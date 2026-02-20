import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "resumo_solicitacao": {
        systemPrompt = `Você é um analista especialista em crédito rural PRONAF. Gere um resumo executivo conciso da solicitação de laudo abaixo, destacando:
1. Dados principais (propriedade, cultura, área, valor)
2. Produto PRONAF solicitado e elegibilidade
3. Pontos de atenção ou risco
4. Recomendação (aprovação, análise adicional, ou rejeição)
Seja objetivo e use no máximo 200 palavras. Formato markdown.`;
        userPrompt = JSON.stringify(data);
        break;
      }
      case "analise_documentos": {
        systemPrompt = `Você é um analista de documentação de crédito rural. Com base nos dados da solicitação e produto PRONAF, analise:
1. Quais documentos obrigatórios provavelmente estão pendentes
2. Se os dados informados (área, valor, cultura) são compatíveis com o produto PRONAF
3. Alertas de inconsistência (ex: valor acima do limite, cultura incompatível)
4. Checklist de próximos passos para a Mesa
Formato markdown com emojis para status (✅ ⚠️ ❌).`;
        userPrompt = JSON.stringify(data);
        break;
      }
      case "sugestao_engenheiro": {
        systemPrompt = `Você é um coordenador de operações de uma plataforma de laudos técnicos. Com base nos dados da solicitação (localização, cultura, valor, produto PRONAF), sugira:
1. Critérios ideais para o engenheiro (especialidade, proximidade)
2. Valor justo de remuneração com justificativa
3. Prazo sugerido para a vistoria
4. Pontos de atenção para o engenheiro
Seja prático e objetivo. Formato markdown.`;
        userPrompt = JSON.stringify(data);
        break;
      }
      case "analise_banco": {
        systemPrompt = `Você é um analista de crédito rural especialista em envios bancários. Com base nos dados do laudo e solicitação:
1. Avalie se o dossiê está completo para envio ao banco
2. Liste documentos ou informações que podem causar devolutiva
3. Sugira observações a incluir no envio
4. Estime probabilidade de aprovação bancária (alta/média/baixa)
Formato markdown.`;
        userPrompt = JSON.stringify(data);
        break;
      }
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Sem resposta da IA.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
