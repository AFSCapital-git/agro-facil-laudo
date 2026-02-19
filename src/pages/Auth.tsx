import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Leaf, ArrowRight } from "lucide-react";

type AuthMode = "login" | "register";
type UserRole = "produtor" | "engenheiro";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [role, setRole] = useState<UserRole>("produtor");

  // Produtor fields
  const [cpfCnpj, setCpfCnpj] = useState("");

  // Engenheiro fields
  const [crea, setCrea] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [raioAtendimento, setRaioAtendimento] = useState("100");

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: authError.message, variant: "destructive" });
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setLoading(false);
      toast({ title: "Erro", description: "Não foi possível criar o usuário.", variant: "destructive" });
      return;
    }

    // Update profile
    await supabase.from("profiles").update({ nome, telefone }).eq("id", userId);

    // Insert role
    await supabase.from("user_roles").insert({ user_id: userId, role });

    // Insert role-specific data
    if (role === "produtor") {
      await supabase.from("produtores").insert({ user_id: userId, cpf_cnpj: cpfCnpj });
    } else {
      await supabase.from("engenheiros").insert({
        user_id: userId,
        crea,
        area_atuacao: areaAtuacao,
        raio_atendimento_km: parseInt(raioAtendimento) || 100,
      });
    }

    setLoading(false);
    toast({
      title: "Cadastro realizado!",
      description: "Verifique seu email para confirmar a conta.",
    });
    setMode("login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">AgroLaudo</h1>
          <p className="text-sm text-muted-foreground">Laudos agronômicos simplificados</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-display">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Acesse sua conta para continuar"
                : "Preencha os dados para se cadastrar"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de conta</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produtor">Produtor Rural</SelectItem>
                        <SelectItem value="engenheiro">Engenheiro Agrônomo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {role === "produtor" && (
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF / CNPJ</Label>
                      <Input id="cpf" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} required />
                    </div>
                  )}
                  {role === "engenheiro" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="crea">CREA</Label>
                        <Input id="crea" value={crea} onChange={(e) => setCrea(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Área de atuação</Label>
                        <Input id="area" value={areaAtuacao} onChange={(e) => setAreaAtuacao(e.target.value)} placeholder="Ex: Grãos, Pecuária" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="raio">Raio de atendimento (km)</Label>
                        <Input id="raio" type="number" value={raioAtendimento} onChange={(e) => setRaioAtendimento(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  Não tem conta?{" "}
                  <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
                    Cadastre-se
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Já tem conta?{" "}
                  <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
                    Entrar
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
