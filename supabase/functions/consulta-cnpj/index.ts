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
    const { cnpj } = await req.json();
    if (!cnpj) {
      return new Response(JSON.stringify({ error: "CNPJ é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean CNPJ - only digits
    const cnpjClean = cnpj.replace(/\D/g, "");
    if (cnpjClean.length !== 14) {
      return new Response(
        JSON.stringify({ error: "CNPJ inválido - deve ter 14 dígitos" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Query BrasilAPI (free, no key needed)
    const response = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BrasilAPI error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Não foi possível consultar o CNPJ",
          details: errorText,
        }),
        {
          status: response.status === 404 ? 404 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    // Map to our format
    const result = {
      cnpj: data.cnpj,
      razao_social: data.razao_social || "",
      nome_fantasia: data.nome_fantasia || "",
      endereco: [
        data.descricao_tipo_de_logradouro,
        data.logradouro,
        data.numero,
        data.complemento,
      ]
        .filter(Boolean)
        .join(" "),
      municipio: data.municipio || "",
      uf: data.uf || "",
      telefone: data.ddd_telefone_1
        ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}`
        : "",
      email: data.email || "",
      situacao_cadastral: data.descricao_situacao_cadastral || "",
      data_situacao_cadastral: data.data_situacao_cadastral || "",
      data_inicio_atividade: data.data_inicio_atividade || "",
      natureza_juridica: data.natureza_juridica || "",
      porte: data.descricao_porte || "",
      cnaes_secundarios: data.cnaes_secundarios || [],
      cnae_fiscal_descricao: data.cnae_fiscal_descricao || "",
      dados_completos: data,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao consultar CNPJ" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
