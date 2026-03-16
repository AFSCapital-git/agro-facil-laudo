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
    // --- JWT VALIDATION ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- INPUT VALIDATION ---
    const { laudo_id } = await req.json();
    if (!laudo_id || typeof laudo_id !== "string") {
      return new Response(JSON.stringify({ error: "laudo_id inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(laudo_id)) {
      return new Response(JSON.stringify({ error: "laudo_id inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- FETCH LAUDO & VERIFY OWNERSHIP ---
    const { data: laudo, error: laudoErr } = await supabase
      .from("laudos")
      .select(`
        id, solicitacao_id, engenheiro_id, status_laudo,
        situacao_cultura, tipo_solo, historico_produtividade,
        disponibilidade_hidrica, riscos_identificados, garantias_observadas,
        recomendacoes_tecnicas, resumo_viabilidade, parecer_final,
        observacoes_adicionais, pronaf_produto_confirmado_id,
        engenheiros!inner(id, user_id)
      `)
      .eq("id", laudo_id)
      .single();

    if (laudoErr || !laudo) {
      return new Response(JSON.stringify({ error: "Laudo não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only the engenheiro who owns the laudo can sign it
    const eng = laudo.engenheiros as any;
    if (eng?.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Apenas o engenheiro responsável pode assinar o laudo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Laudo must be in aguardando_assinatura status
    if (laudo.status_laudo !== "aguardando_assinatura") {
      return new Response(JSON.stringify({ error: "Laudo não está aguardando assinatura" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already signed
    const { data: existingSig } = await supabase
      .from("assinatura_laudo")
      .select("id")
      .eq("laudo_id", laudo_id)
      .maybeSingle();

    if (existingSig) {
      return new Response(JSON.stringify({ error: "Laudo já foi assinado" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- GENERATE HASH SERVER-SIDE ---
    const timestamp = new Date().toISOString();
    const contentToHash = JSON.stringify({
      laudo_id: laudo.id,
      solicitacao_id: laudo.solicitacao_id,
      engenheiro_id: laudo.engenheiro_id,
      situacao_cultura: laudo.situacao_cultura,
      tipo_solo: laudo.tipo_solo,
      historico_produtividade: laudo.historico_produtividade,
      disponibilidade_hidrica: laudo.disponibilidade_hidrica,
      riscos_identificados: laudo.riscos_identificados,
      garantias_observadas: laudo.garantias_observadas,
      recomendacoes_tecnicas: laudo.recomendacoes_tecnicas,
      resumo_viabilidade: laudo.resumo_viabilidade,
      parecer_final: laudo.parecer_final,
      observacoes_adicionais: laudo.observacoes_adicionais,
      pronaf_produto_confirmado_id: laudo.pronaf_produto_confirmado_id,
      timestamp,
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(contentToHash);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Get client IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // --- INSERT SIGNATURE ---
    const { error: sigErr } = await supabase.from("assinatura_laudo").insert({
      laudo_id: laudo.id,
      engenheiro_id: laudo.engenheiro_id,
      hash_assinatura: hashHex,
      tipo_assinatura: "server_verified",
      ip_assinatura: clientIP,
      data_hora_assinatura: timestamp,
    });

    if (sigErr) {
      console.error("[INTERNAL] Signature insert error:", sigErr);
      return new Response(JSON.stringify({ error: "Erro ao registrar assinatura" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- UPDATE LAUDO STATUS ---
    const { error: laudoUpdateErr } = await supabase
      .from("laudos")
      .update({ status_laudo: "finalizado" })
      .eq("id", laudo_id);

    if (laudoUpdateErr) {
      console.error("[INTERNAL] Laudo update error:", laudoUpdateErr);
      return new Response(JSON.stringify({ error: "Erro ao finalizar laudo" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        hash: hashHex,
        timestamp,
        ip: clientIP,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[INTERNAL] sign-laudo error:", err);
    return new Response(
      JSON.stringify({ error: "Ocorreu um erro ao assinar o laudo. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
