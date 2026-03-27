import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, contexto, produtos_disponiveis } = body;

    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Mensagens inválidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const m of messages) {
      if (!m.role || !m.content || typeof m.content !== "string" || m.content.length > 5000) {
        return new Response(JSON.stringify({ error: "Formato de mensagem inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Serviço de IA indisponível" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context block
    let contextoBlock = "";
    if (contexto) {
      const parts: string[] = [];
      if (contexto.propriedades?.length) {
        parts.push("PROPRIEDADES DO PRODUTOR:");
        for (const p of contexto.propriedades) {
          parts.push(`- ${p.nome_propriedade}: ${p.area_total_ha}ha em ${p.municipio}/${p.uf}, Solo: ${p.tipo_solo || 'não informado'}, Fonte água: ${p.fonte_agua || 'não informado'}`);
        }
      }
      if (contexto.historico_solicitacoes?.length) {
        parts.push("\nHISTÓRICO DE SOLICITAÇÕES:");
        for (const s of contexto.historico_solicitacoes) {
          parts.push(`- ${s.produto}: ${s.cultura}, R$ ${s.valor}, Status: ${s.status}`);
        }
      }
      if (parts.length) contextoBlock = "\n\n--- DADOS DO PRODUTOR ---\n" + parts.join("\n") + "\n--- FIM DADOS ---\n";
    }

    let produtosBlock = "";
    if (produtos_disponiveis?.length) {
      produtosBlock = "\n\n--- PRODUTOS PRONAF DISPONÍVEIS ---\n";
      for (const p of produtos_disponiveis) {
        produtosBlock += `- ${p.nome}: ${p.finalidade}, Grupo: ${p.grupo_alvo}, Limite: ${p.limite_valor}, Juros: ${p.juros}, Carência: ${p.carencia}, Prazo: ${p.prazo_reembolso}, Financia: ${p.o_que_financia}\n`;
      }
      produtosBlock += "--- FIM PRODUTOS ---\n";
    }

    const systemPrompt = `Você é o **Assistente de Enquadramento de Crédito Rural** da plataforma AgroLaudo. Seu objetivo é **guiar o produtor rural** até encontrar o melhor enquadramento de produto PRONAF para sua necessidade.

## MODO DE OPERAÇÃO
Você deve conduzir a conversa de forma **proativa e estruturada**:

1. **COLETA DE INFORMAÇÕES**: Faça perguntas objetivas, uma ou duas por vez, para entender:
   - Qual a finalidade do crédito (custeio, investimento, industrialização)
   - Qual a atividade/cultura pretendida
   - Valor aproximado necessário
   - Região e características da propriedade
   - Se é primeiro acesso ao PRONAF

2. **ANÁLISE E REFINAMENTO**: Com base nas respostas, cruze com as normas do MCR e os produtos disponíveis para sugerir as melhores opções.

3. **RECOMENDAÇÃO FINAL**: Quando tiver informações suficientes, apresente a recomendação no seguinte formato EXATO (para que o sistema possa extrair):

\`\`\`enquadramento
PRODUTO: [nome exato do produto PRONAF]
CAPÍTULO MCR: [capítulo e seção]
JUSTIFICATIVA: [por que este produto é o mais adequado]
CONDIÇÕES: [resumo das condições - juros, prazo, carência, limite]
VALOR SUGERIDO: [faixa de valor recomendada, se aplicável]
\`\`\`

## REGRAS
- Sempre cite capítulo e seção do MCR que embasa sua análise
- Use os dados do produtor já disponíveis para evitar perguntas redundantes
- Se houver mais de uma opção viável, apresente até 3 alternativas ranqueadas
- Se não souber com certeza, recomende consultar o MCR atualizado no site do Banco Central
- Use markdown para formatação
- Seja objetivo e profissional, mas amigável
- NÃO apresente o bloco \`\`\`enquadramento\`\`\` até ter informações suficientes
${contextoBlock}${produtosBlock}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: apiMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Sem resposta da IA.";

    // Extract enquadramento if present
    let enquadramento = null;
    const match = content.match(/```enquadramento\n([\s\S]*?)```/);
    if (match) {
      const block = match[1];
      const extract = (key: string) => {
        const r = new RegExp(`${key}:\\s*(.+)`, "i");
        return r.exec(block)?.[1]?.trim() || "";
      };
      enquadramento = {
        produto_sugerido: extract("PRODUTO"),
        capitulo_mcr: extract("CAPÍTULO MCR"),
        justificativa: extract("JUSTIFICATIVA"),
        condicoes: extract("CONDIÇÕES"),
        valor_sugerido: extract("VALOR SUGERIDO"),
      };
    }

    return new Response(JSON.stringify({ content, enquadramento }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[INTERNAL] chat-credito error:", e);
    return new Response(JSON.stringify({ error: "Ocorreu um erro inesperado." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
