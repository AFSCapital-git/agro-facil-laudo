import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- AuthN: validate caller's JWT ---
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const userId = userData.user.id;

    // --- AuthZ: only admin or coban_master may trigger compliance ---
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roleList = (roles ?? []).map((r: { role: string }) => r.role);
    const allowed = roleList.includes("admin") || roleList.includes("coban_master");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Permissão insuficiente" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { empresa_id, cnpj, action } = await req.json();

    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = {};

    // 1. Validate CNPJ at Receita Federal
    if (cnpj || action === "validate_all") {
      const cnpjToCheck = cnpj || (await getCnpj(supabase, empresa_id));
      if (cnpjToCheck) {
        const cnpjClean = cnpjToCheck.replace(/\D/g, "");
        try {
          const resp = await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`
          );
          if (resp.ok) {
            const data = await resp.json();
            const isActive = data.descricao_situacao_cadastral === "ATIVA";
            results.cnpj_valido = {
              status: isActive ? "aprovado" : "rejeitado",
              dados: {
                situacao: data.descricao_situacao_cadastral,
                data_situacao: data.data_situacao_cadastral,
                razao_social: data.razao_social,
                porte: data.descricao_porte,
              },
              fonte: "receita_federal_brasilapi",
              verificado_em: new Date().toISOString(),
            };

            await supabase
              .from("onboarding_empresas")
              .update({
                dados_receita: data,
                situacao_cadastral: data.descricao_situacao_cadastral,
                ultima_consulta_cnpj: new Date().toISOString(),
              })
              .eq("id", empresa_id);
          } else {
            results.cnpj_valido = {
              status: "pendente",
              dados: { erro: "Não foi possível consultar" },
              fonte: "receita_federal_brasilapi",
            };
          }
        } catch (e) {
          console.error("[INTERNAL] cnpj fetch", e);
          results.cnpj_valido = {
            status: "pendente",
            dados: { erro: "Falha na consulta externa" },
            fonte: "receita_federal_brasilapi",
          };
        }
      }
    }

    // 2. Check document validity dates
    const { data: docs } = await supabase
      .from("onboarding_documentos")
      .select("*")
      .eq("empresa_id", empresa_id);

    if (docs) {
      const now = new Date();
      for (const doc of docs) {
        if (doc.data_validade) {
          const validade = new Date(doc.data_validade);
          const diasRestantes = Math.ceil(
            (validade.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          let complianceItem = "";
          if (doc.tipo_documento === "alvara") complianceItem = "alvara_vigente";
          else if (doc.tipo_documento === "certidao_negativa")
            complianceItem = "certidao_negativa";
          else if (doc.tipo_documento === "contrato_social")
            complianceItem = "contrato_social";

          if (complianceItem) {
            results[complianceItem] = {
              status:
                diasRestantes < 0
                  ? "rejeitado"
                  : diasRestantes < 30
                    ? "pendente"
                    : "aprovado",
              dados: {
                data_validade: doc.data_validade,
                dias_restantes: diasRestantes,
                vencido: diasRestantes < 0,
                alerta: diasRestantes < 30 && diasRestantes >= 0,
              },
              fonte: "validacao_documento",
              verificado_em: new Date().toISOString(),
            };
          }
        }
      }

      const docTypes = docs.map((d: any) => d.tipo_documento);
      if (docTypes.includes("contrato_social") && !results.contrato_social) {
        results.contrato_social = {
          status: "aprovado",
          dados: { documento_enviado: true },
          fonte: "validacao_documento",
          verificado_em: new Date().toISOString(),
        };
      }
      if (docTypes.includes("comprovante_endereco")) {
        results.endereco_confirmado = {
          status: "aprovado",
          dados: { documento_enviado: true },
          fonte: "validacao_documento",
          verificado_em: new Date().toISOString(),
        };
      }
    }

    // 3. Check if responsável exists
    const { data: resp } = await supabase
      .from("onboarding_responsaveis")
      .select("id, nome, cpf")
      .eq("empresa_id", empresa_id)
      .limit(1);

    if (resp && resp.length > 0) {
      results.responsavel_identificado = {
        status: "aprovado",
        dados: { nome: resp[0].nome, cpf: resp[0].cpf },
        fonte: "validacao_cadastro",
        verificado_em: new Date().toISOString(),
      };
    }

    // 4. Update compliance items in database
    for (const [item, validation] of Object.entries(results)) {
      const val = validation as any;
      await supabase
        .from("onboarding_compliance")
        .update({
          status: val.status,
          fonte_validacao: val.fonte || "automatica",
          dados_validacao: val.dados || {},
          ultima_verificacao_auto: val.verificado_em || new Date().toISOString(),
          valido_ate: val.dados?.data_validade || null,
          proxima_verificacao: getNextVerification(item),
        })
        .eq("empresa_id", empresa_id)
        .eq("item", item);
    }

    const hasExpired = Object.values(results).some(
      (r: any) => r.status === "rejeitado" && r.dados?.vencido
    );

    if (hasExpired) {
      await supabase
        .from("onboarding_empresas")
        .update({ status: "pendente_renovacao" })
        .eq("id", empresa_id)
        .in("status", ["ativo", "aprovado"]);
    }

    return new Response(
      JSON.stringify({ results, has_expired: hasExpired }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[INTERNAL] validate-compliance", error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getCnpj(supabase: any, empresaId: string): Promise<string | null> {
  const { data } = await supabase
    .from("onboarding_empresas")
    .select("cnpj")
    .eq("id", empresaId)
    .single();
  return data?.cnpj || null;
}

function getNextVerification(item: string): string {
  const now = new Date();
  const daysMap: Record<string, number> = {
    cnpj_valido: 30,
    certidao_negativa: 7,
    alvara_vigente: 30,
    contrato_social: 90,
    responsavel_identificado: 90,
    endereco_confirmado: 90,
  };
  const days = daysMap[item] || 30;
  now.setDate(now.getDate() + days);
  return now.toISOString();
}
