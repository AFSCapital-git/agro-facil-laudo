import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with caller's token to verify admin
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await callerClient.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar usuários internos." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { nome, email, senha, role, banco_parceiro_id } = await req.json();

    // Validate inputs
    if (!nome || !email || !senha || !role) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: nome, email, senha, role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["mesa_produtos", "banco"].includes(role)) {
      return new Response(JSON.stringify({ error: "Papel deve ser 'mesa_produtos' ou 'banco'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (role === "banco" && !banco_parceiro_id) {
      return new Response(JSON.stringify({ error: "Banco parceiro é obrigatório para o papel 'banco'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (senha.length < 6) {
      return new Response(JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create user with email auto-confirmed
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError) {
      // Check for duplicate email
      if (createError.message?.includes("already been registered") || createError.message?.includes("already exists")) {
        return new Response(JSON.stringify({ error: "Este email já está cadastrado na plataforma." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw createError;
    }

    const userId = newUser.user.id;

    // Assign role (using service role to bypass RLS)
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role });
    if (roleError) throw roleError;

    // If banco, link to banco_parceiro
    if (role === "banco" && banco_parceiro_id) {
      const { error: bancoError } = await adminClient
        .from("banco_usuarios")
        .insert({ user_id: userId, banco_parceiro_id });
      if (bancoError) throw bancoError;
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, message: "Usuário criado com sucesso!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error creating internal user:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao criar usuário" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
