import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { laudo_id } = await req.json();
    if (!laudo_id) {
      return new Response(JSON.stringify({ error: "laudo_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch laudo with related data
    const { data: laudo, error: laudoErr } = await supabase
      .from("laudos")
      .select(`
        *,
        engenheiros(crea, area_atuacao, profiles:user_id(nome, email)),
        solicitacoes_laudo(
          cultura_principal, area_cultivo_ha, valor_solicitado, tipo_credito, banco_destino,
          produtores(cpf_cnpj, profiles:user_id(nome, email, telefone)),
          propriedades(nome_propriedade, endereco, area_total_ha, codigo_car)
        ),
        assinatura_laudo(hash_assinatura, data_hora_assinatura, tipo_assinatura)
      `)
      .eq("id", laudo_id)
      .single();

    if (laudoErr || !laudo) {
      return new Response(JSON.stringify({ error: "Laudo not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sol = laudo.solicitacoes_laudo as any;
    const eng = laudo.engenheiros as any;
    const prop = sol?.propriedades;
    const produtor = sol?.produtores;
    const assinatura = laudo.assinatura_laudo as any;
    const engProfile = eng?.profiles;
    const prodProfile = produtor?.profiles;

    const formatDate = (d: string) => {
      try { return new Date(d).toLocaleDateString("pt-BR"); } catch { return d; }
    };

    // Generate HTML for PDF
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; font-size: 12px; line-height: 1.5; }
  h1 { color: #2d5a27; font-size: 20px; text-align: center; border-bottom: 2px solid #2d5a27; padding-bottom: 10px; }
  h2 { color: #2d5a27; font-size: 14px; margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .header { text-align: center; margin-bottom: 30px; }
  .header p { margin: 2px 0; color: #666; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { margin-bottom: 8px; }
  .field-label { font-weight: bold; color: #555; font-size: 11px; text-transform: uppercase; }
  .field-value { margin-top: 2px; }
  .signature-box { margin-top: 30px; padding: 15px; border: 1px solid #2d5a27; border-radius: 4px; background: #f9fdf8; }
  .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
</style></head><body>
  <div class="header">
    <h1>🌿 LAUDO DE VIABILIDADE AGRONÔMICA</h1>
    <p>AgroLaudo - Plataforma de Laudos Agronômicos</p>
    <p>Emitido em: ${formatDate(new Date().toISOString())}</p>
  </div>

  <h2>Dados do Produtor</h2>
  <div class="grid">
    <div class="field"><span class="field-label">Nome:</span><div class="field-value">${prodProfile?.nome || "—"}</div></div>
    <div class="field"><span class="field-label">CPF/CNPJ:</span><div class="field-value">${produtor?.cpf_cnpj || "—"}</div></div>
    <div class="field"><span class="field-label">Email:</span><div class="field-value">${prodProfile?.email || "—"}</div></div>
    <div class="field"><span class="field-label">Telefone:</span><div class="field-value">${prodProfile?.telefone || "—"}</div></div>
  </div>

  <h2>Dados da Propriedade</h2>
  <div class="grid">
    <div class="field"><span class="field-label">Propriedade:</span><div class="field-value">${prop?.nome_propriedade || "—"}</div></div>
    <div class="field"><span class="field-label">Endereço:</span><div class="field-value">${prop?.endereco || "—"}</div></div>
    <div class="field"><span class="field-label">Área total:</span><div class="field-value">${prop?.area_total_ha || 0} ha</div></div>
    <div class="field"><span class="field-label">CAR:</span><div class="field-value">${prop?.codigo_car || "—"}</div></div>
  </div>

  <h2>Dados da Solicitação</h2>
  <div class="grid">
    <div class="field"><span class="field-label">Tipo de crédito:</span><div class="field-value">${sol?.tipo_credito || "—"}</div></div>
    <div class="field"><span class="field-label">Cultura principal:</span><div class="field-value">${sol?.cultura_principal || "—"}</div></div>
    <div class="field"><span class="field-label">Área de cultivo:</span><div class="field-value">${sol?.area_cultivo_ha || 0} ha</div></div>
    <div class="field"><span class="field-label">Valor solicitado:</span><div class="field-value">R$ ${Number(sol?.valor_solicitado || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div></div>
    <div class="field"><span class="field-label">Banco destino:</span><div class="field-value">${sol?.banco_destino || "—"}</div></div>
  </div>

  <h2>Avaliação Técnica</h2>
  <div class="field"><span class="field-label">Situação da cultura:</span><div class="field-value">${laudo.situacao_cultura || "—"}</div></div>
  <div class="field"><span class="field-label">Tipo de solo:</span><div class="field-value">${laudo.tipo_solo || "—"}</div></div>
  <div class="field"><span class="field-label">Histórico de produtividade:</span><div class="field-value">${laudo.historico_produtividade || "—"}</div></div>
  <div class="field"><span class="field-label">Disponibilidade hídrica:</span><div class="field-value">${laudo.disponibilidade_hidrica || "—"}</div></div>
  <div class="field"><span class="field-label">Riscos identificados:</span><div class="field-value">${laudo.riscos_identificados || "—"}</div></div>
  <div class="field"><span class="field-label">Garantias observadas:</span><div class="field-value">${laudo.garantias_observadas || "—"}</div></div>
  <div class="field"><span class="field-label">Recomendações técnicas:</span><div class="field-value">${laudo.recomendacoes_tecnicas || "—"}</div></div>

  <h2>Parecer Final</h2>
  <div class="field"><span class="field-label">Resumo de viabilidade:</span><div class="field-value">${laudo.resumo_viabilidade || "—"}</div></div>
  <div class="field"><span class="field-label">Parecer:</span><div class="field-value">${laudo.parecer_final || "—"}</div></div>
  <div class="field"><span class="field-label">Observações adicionais:</span><div class="field-value">${laudo.observacoes_adicionais || "—"}</div></div>

  <h2>Engenheiro Responsável</h2>
  <div class="grid">
    <div class="field"><span class="field-label">Nome:</span><div class="field-value">${engProfile?.nome || "—"}</div></div>
    <div class="field"><span class="field-label">CREA:</span><div class="field-value">${eng?.crea || "—"}</div></div>
    <div class="field"><span class="field-label">Área de atuação:</span><div class="field-value">${eng?.area_atuacao || "—"}</div></div>
  </div>

  ${assinatura ? `
  <div class="signature-box">
    <h2 style="margin-top: 0; border: none;">Assinatura Digital</h2>
    <div class="field"><span class="field-label">Data/Hora:</span><div class="field-value">${formatDate(assinatura.data_hora_assinatura)}</div></div>
    <div class="field"><span class="field-label">Tipo:</span><div class="field-value">${assinatura.tipo_assinatura}</div></div>
    <div class="field"><span class="field-label">Hash SHA-256:</span><div class="field-value" style="font-family: monospace; font-size: 10px; word-break: break-all;">${assinatura.hash_assinatura}</div></div>
  </div>` : ""}

  <div class="footer">
    <p>Documento gerado pela plataforma AgroLaudo. Este laudo é de responsabilidade técnica do engenheiro signatário.</p>
    <p>ID do Laudo: ${laudo_id}</p>
  </div>
</body></html>`;

    // Store HTML as PDF placeholder (real PDF conversion would use a library)
    const pdfPath = `${laudo_id}/laudo.html`;
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(html);

    const { error: uploadErr } = await supabase.storage
      .from("laudo-pdfs")
      .upload(pdfPath, htmlBytes, {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update laudo with PDF path
    await supabase
      .from("laudos")
      .update({ caminho_pdf_laudo: pdfPath })
      .eq("id", laudo_id);

    // Auto-create payment record for engineer
    // Fetch platform config for base value
    const { data: config } = await supabase
      .from("configuracoes_plataforma")
      .select("valor_base_laudo, prazo_padrao_pagamento_dias")
      .limit(1)
      .single();

    const valorBase = config?.valor_base_laudo ?? 500;
    const prazoDias = config?.prazo_padrao_pagamento_dias ?? 7;
    const dataPrevista = new Date();
    dataPrevista.setDate(dataPrevista.getDate() + prazoDias);

    // Check if payment already exists
    const { data: existingPay } = await supabase
      .from("pagamentos_engenheiro")
      .select("id")
      .eq("laudo_id", laudo_id)
      .maybeSingle();

    if (!existingPay) {
      await supabase.from("pagamentos_engenheiro").insert({
        laudo_id: laudo_id,
        engenheiro_id: laudo.engenheiro_id,
        valor_bruto: valorBase,
        status_pagamento: "pendente",
        data_prevista_pagamento: dataPrevista.toISOString().split("T")[0],
      });
    }

    return new Response(
      JSON.stringify({ success: true, path: pdfPath }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
