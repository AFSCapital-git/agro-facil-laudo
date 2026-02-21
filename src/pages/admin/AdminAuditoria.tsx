import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, LogIn } from "lucide-react";
import { format } from "date-fns";

export default function AdminAuditoria() {
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ["admin_audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: loginLogs, isLoading: loadingLogins } = useQuery({
    queryKey: ["admin_login_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("login_logs")
        .select("*, profiles:user_id(nome, email)")
        .order("login_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredAudit = (auditLogs ?? []).filter((l) => {
    if (entityFilter !== "all" && l.entidade !== entityFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        l.acao.toLowerCase().includes(s) ||
        l.entidade.toLowerCase().includes(s) ||
        l.perfil.toLowerCase().includes(s) ||
        (l.entidade_id ?? "").toLowerCase().includes(s)
      );
    }
    return true;
  });

  const perfilBadge = (p: string) => {
    const map: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      mesa: "secondary",
      engenheiro: "outline",
      produtor: "outline",
      sistema: "outline",
    };
    return map[p] ?? "outline";
  };

  const fmtDate = (d: string) => format(new Date(d), "dd/MM/yy HH:mm");

  const fmtJson = (j: unknown) => {
    if (!j || (typeof j === "object" && Object.keys(j as object).length === 0)) return "—";
    return JSON.stringify(j, null, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Auditoria</h1>
        <p className="text-muted-foreground">Logs de alterações e acessos da plataforma.</p>
      </div>

      <Tabs defaultValue="changes">
        <TabsList>
          <TabsTrigger value="changes">
            <Shield className="mr-1 h-4 w-4" /> Alterações
          </TabsTrigger>
          <TabsTrigger value="logins">
            <LogIn className="mr-1 h-4 w-4" /> Logins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-60"
            />
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="solicitacao">Solicitação</SelectItem>
                <SelectItem value="laudo">Laudo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingAudit ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !filteredAudit.length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <Shield className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum registro encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ScrollArea className="max-h-[600px]">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Anterior</TableHead>
                        <TableHead>Novo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAudit.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(l.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={perfilBadge(l.perfil)}>{l.perfil}</Badge>
                          </TableCell>
                          <TableCell className="font-medium text-xs">{l.acao}</TableCell>
                          <TableCell className="text-xs">
                            {l.entidade}
                            {l.entidade_id && (
                              <span className="ml-1 text-muted-foreground">#{l.entidade_id.slice(0, 8)}</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                            {fmtJson(l.dados_anteriores)}
                          </TableCell>
                          <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                            {fmtJson(l.dados_novos)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logins" className="space-y-4">
          {loadingLogins ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !(loginLogs ?? []).length ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <LogIn className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum login registrado.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <ScrollArea className="max-h-[600px]">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(loginLogs ?? []).map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap text-xs">{fmtDate(l.login_at)}</TableCell>
                          <TableCell className="font-medium">{l.profiles?.nome || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{l.profiles?.email || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
