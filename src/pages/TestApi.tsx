import { useState } from "react";
import { AxiosError } from "axios";
import { authService } from "@/services/auth-service";
import { API_URL, API_TOKEN_KEY, API_USER_ID_KEY } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

interface BlockState {
  status: Status;
  payload: unknown;
  error: string | null;
}

const initial: BlockState = { status: "idle", payload: null, error: null };

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    idle: { label: "idle", variant: "outline" },
    loading: { label: "loading...", variant: "secondary" },
    success: { label: "success", variant: "default" },
    error: { label: "error", variant: "destructive" },
  };
  const m = map[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function ResultPane({ state }: { state: BlockState }) {
  if (state.status === "idle") return null;
  return (
    <div className="mt-3 space-y-2">
      {state.error && (
        <pre className="overflow-auto rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {state.error}
        </pre>
      )}
      {state.payload !== null && (
        <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs text-foreground">
          {JSON.stringify(state.payload, null, 2)}
        </pre>
      )}
    </div>
  );
}

function formatAxiosError(err: unknown): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status ?? "no-status";
    const body = err.response?.data ?? err.message;
    return `HTTP ${status}\n${typeof body === "string" ? body : JSON.stringify(body, null, 2)}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function TestApi() {
  // Register state
  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rNome, setRNome] = useState("");
  const [rRole, setRRole] = useState("produtor");
  const [registerState, setRegisterState] = useState<BlockState>(initial);

  // Login state
  const [lEmail, setLEmail] = useState("");
  const [lPassword, setLPassword] = useState("");
  const [loginState, setLoginState] = useState<BlockState>(initial);

  // Me state
  const [meState, setMeState] = useState<BlockState>(initial);

  const [storageVer, setStorageVer] = useState(0);
  const refresh = () => setStorageVer((v) => v + 1);

  const token = typeof window !== "undefined" ? localStorage.getItem(API_TOKEN_KEY) : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem(API_USER_ID_KEY) : null;
  const maskedToken = token ? `${token.slice(0, 12)}…${token.slice(-6)} (${token.length} chars)` : "(vazio)";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterState({ status: "loading", payload: null, error: null });
    try {
      const res = await authService.register({
        email: rEmail,
        password: rPassword,
        nome: rNome,
        role: rRole,
      });
      setRegisterState({ status: "success", payload: res, error: null });
      refresh();
    } catch (err) {
      setRegisterState({ status: "error", payload: null, error: formatAxiosError(err) });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginState({ status: "loading", payload: null, error: null });
    try {
      const res = await authService.login({ email: lEmail, password: lPassword });
      setLoginState({ status: "success", payload: res, error: null });
      refresh();
    } catch (err) {
      setLoginState({ status: "error", payload: null, error: formatAxiosError(err) });
    }
  };

  const handleMe = async () => {
    setMeState({ status: "loading", payload: null, error: null });
    try {
      const res = await authService.getCurrentUser();
      setMeState({ status: "success", payload: res, error: null });
    } catch (err) {
      setMeState({ status: "error", payload: null, error: formatAxiosError(err) });
    }
  };

  const handleLogout = () => {
    authService.logout();
    setRegisterState(initial);
    setLoginState(initial);
    setMeState(initial);
    refresh();
  };

  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const apiIsHttp = API_URL.startsWith("http://");
  const mixedContentRisk = isHttps && apiIsHttp;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Test API — FASE 0</h1>
          <p className="text-sm text-muted-foreground">
            Painel de debug isolado da API Python (<code className="text-xs">{API_URL}</code>). Não afeta o app real.
          </p>
        </header>

        {mixedContentRisk && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Mixed content detectado</AlertTitle>
            <AlertDescription>
              O preview está em <strong>HTTPS</strong> mas a API roda em <strong>HTTP</strong>. O browser vai bloquear
              as requisições. Para testar, abra o preview em HTTP, libere mixed content nas configurações do site (cadeado →
              Configurações), ou exponha a API via HTTPS (ngrok, Cloudflare Tunnel, certificado).
            </AlertDescription>
          </Alert>
        )}

        {/* Storage / token panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">localStorage</CardTitle>
              <CardDescription>Estado atual do token armazenado</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout / Limpar
            </Button>
          </CardHeader>
          <CardContent className="space-y-1 text-sm" key={storageVer}>
            <div className="flex gap-2">
              <span className="text-muted-foreground">access_token:</span>
              <code className="text-xs text-foreground">{maskedToken}</code>
            </div>
            <div className="flex gap-2">
              <span className="text-muted-foreground">user_id:</span>
              <code className="text-xs text-foreground">{userId ?? "(vazio)"}</code>
            </div>
          </CardContent>
        </Card>

        {/* Register */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">POST /api/auth/register</CardTitle>
              <CardDescription>Cria um novo usuário e salva token</CardDescription>
            </div>
            <StatusBadge status={registerState.status} />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-email">Email</Label>
                <Input id="r-email" type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-password">Senha</Label>
                <Input id="r-password" type="password" value={rPassword} onChange={(e) => setRPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-nome">Nome</Label>
                <Input id="r-nome" value={rNome} onChange={(e) => setRNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-role">Role</Label>
                <Select value={rRole} onValueChange={setRRole}>
                  <SelectTrigger id="r-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produtor">produtor</SelectItem>
                    <SelectItem value="engenheiro">engenheiro</SelectItem>
                    <SelectItem value="agrobanker">agrobanker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={registerState.status === "loading"}>
                  Register
                </Button>
              </div>
            </form>
            <ResultPane state={registerState} />
          </CardContent>
        </Card>

        {/* Login */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">POST /api/auth/login</CardTitle>
              <CardDescription>Autentica e salva token</CardDescription>
            </div>
            <StatusBadge status={loginState.status} />
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="l-email">Email</Label>
                <Input id="l-email" type="email" value={lEmail} onChange={(e) => setLEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="l-password">Senha</Label>
                <Input id="l-password" type="password" value={lPassword} onChange={(e) => setLPassword(e.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={loginState.status === "loading"}>
                  Login
                </Button>
              </div>
            </form>
            <ResultPane state={loginState} />
          </CardContent>
        </Card>

        {/* Me */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">GET /api/auth/me</CardTitle>
              <CardDescription>Valida o token enviando Authorization: Bearer …</CardDescription>
            </div>
            <StatusBadge status={meState.status} />
          </CardHeader>
          <CardContent>
            <Button onClick={handleMe} disabled={meState.status === "loading"}>
              Validar /me
            </Button>
            <ResultPane state={meState} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
