import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AuthN: require valid JWT to prevent unauthenticated AI credit drain ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tipoDocumento = formData.get("tipo_documento") as string;

    if (!file) {
      return new Response(JSON.stringify({ error: "Arquivo é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file.type || "application/pdf";

    // Use Gemini via Lovable AI to extract document data
    const prompt = `Analise este documento (${tipoDocumento || "documento"}) e extraia as seguintes informações em formato JSON:
    
Para qualquer tipo de documento empresarial, tente extrair:
- cnpj: CNPJ encontrado no documento
- razao_social: Razão Social
- nome_fantasia: Nome Fantasia
- endereco: Endereço completo
- municipio: Município
- uf: Estado (sigla)
- data_emissao: Data de emissão do documento (formato YYYY-MM-DD)
- data_validade: Data de validade/vencimento (formato YYYY-MM-DD), se aplicável
- orgao_emissor: Órgão emissor do documento
- numero_documento: Número ou protocolo do documento
- responsavel_nome: Nome do responsável legal, se mencionado
- responsavel_cpf: CPF do responsável, se mencionado
- observacoes: Quaisquer informações relevantes adicionais

Se um campo não for encontrado, retorne string vazia.
Retorne APENAS o JSON, sem markdown ou texto adicional.`;

    const aiResponse = await fetch(
      "https://ai-gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
              ],
            },
          ],
          temperature: 0.1,
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      throw new Error(`AI extraction failed [${aiResponse.status}]`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response (handle markdown code blocks)
    let extracted;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      extracted = { observacoes: "Não foi possível extrair dados automaticamente" };
    }

    return new Response(JSON.stringify({ extracted, tipo_documento: tipoDocumento }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[INTERNAL] extract-document-data", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar documento" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
