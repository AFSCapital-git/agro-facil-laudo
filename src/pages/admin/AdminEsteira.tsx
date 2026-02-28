import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowRight, Download, BarChart3, GitBranch, Users, Clock, CheckCircle2, XCircle, FileText, TrendingUp, AlertTriangle,
} from "lucide-react";

/* ── Pipeline stages ── */

const pipelineStages = [
  { key: "pendente", label: "Pendente", color: "bg-muted-foreground" },
  { key: "em_analise_mesa", label: "Análise Mesa", color: "bg-primary" },
  { key: "docs_pendentes_produtor", label: "Docs Pendentes", color: "bg-warning" },
  { key: "docs_em_validacao", label: "Docs Validação", color: "bg-warning" },
  { key: "elegivel", label: "Elegível", color: "bg-success" },
  { key: "aguardando_laudo", label: "Aguard. Laudo", color: "bg-secondary" },
  { key: "pronta_para_banco", label: "Pronta p/ Banco", color: "bg-primary" },
  { key: "reprovada", label: "Reprovada", color: "bg-destructive" },
];

const bancoStages = [
  { key: "nao_enviado", label: "Não Enviado", color: "bg-muted-foreground" },
  { key: "enviado", label: "Enviado", color: "bg-primary" },
  { key: "devolvido", label: "Devolvido", color: "bg-warning" },
  { key: "aprovado", label: "Aprovado", color: "bg-success" },
  { key: "reprovado", label: "Reprovado", color: "bg-destructive" },
];

const laudoStages = [
  { key: "em_vistoria", label: "Em Vistoria" },
  { key: "aguardando_assinatura", label: "Aguard. Assinatura" },
  { key: "finalizado", label: "Finalizado" },
];

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminEsteira() {
  const [de, setDe] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [ate, setAte] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: solicitacoes, isLoading: loadingSol } = useQuery({
    queryKey: ["admin_esteira_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("id, status_solicitacao, status_banco, engenheiro_atribuido_id, created_at, updated_at, valor_solicitado, banco_parceiro_id, propriedades(nome_propriedade), pronaf_produtos(nome), laudos(status_laudo, engenheiro_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: eventos } = useQuery({
    queryKey: ["admin_esteira_eventos", de, ate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_eventos")
        .select("id, solicitacao_id, tipo_evento, campo_alterado, valor_anterior, valor_novo, autor_id, autor_tipo, created_at")
        .gte("created_at", de)
        .lte("created_at", ate + "T23:59:59")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: engenheiros } = useQuery({
    queryKey: ["admin_esteira_engenheiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engenheiros")
        .select("id, crea, user_id, profiles:user_id(nome)")
        .eq("status_verificacao", "aprovado");
      if (error) throw error;
      return data;
    },
  });

  const { data: mesaUsers } = useQuery({
    queryKey: ["admin_esteira_mesa_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "mesa_produtos");
      if (error) throw error;
      const userIds = data?.map((r) => r.user_id) ?? [];
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);
      return profiles ?? [];
    },
  });

  const { data: bancoUsers } = useQuery({
    queryKey: ["admin_esteira_banco_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banco_usuarios")
        .select("user_id, banco_parceiro_id, bancos_parceiros(nome)")
        .order("created_at");
      if (error) throw error;
      const userIds = data?.map((r) => r.user_id) ?? [];
      if (!userIds.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);
      return (data ?? []).map((bu) => ({
        ...bu,
        profile: profiles?.find((p) => p.id === bu.user_id),
      }));
    },
  });

  /* ── Derived metrics ── */

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    solicitacoes?.forEach((s) => {
      counts[s.status_solicitacao] = (counts[s.status_solicitacao] || 0) + 1;
    });
    return counts;
  }, [solicitacoes]);

  const bancoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    solicitacoes?.forEach((s) => {
      counts[s.status_banco] = (counts[s.status_banco] || 0) + 1;
    });
    return counts;
  }, [solicitacoes]);

  const laudoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    solicitacoes?.forEach((s) => {
      const laudos = (s as any).laudos;
      if (Array.isArray(laudos)) {
        laudos.forEach((l: any) => {
          counts[l.status_laudo] = (counts[l.status_laudo] || 0) + 1;
        });
      } else if (laudos?.status_laudo) {
        counts[laudos.status_laudo] = (counts[laudos.status_laudo] || 0) + 1;
      }
    });
    return counts;
  }, [solicitacoes]);

  const mesaPerformance = useMemo(() => {
    const map = new Map<string, { nome: string; acoes: number; aprovacoes: number; reprovacoes: number }>();
    mesaUsers?.forEach((u) => {
      map.set(u.id, { nome: u.nome || u.email, acoes: 0, aprovacoes: 0, reprovacoes: 0 });
    });
    eventos?.forEach((ev) => {
      if (ev.autor_tipo === "mesa" && ev.autor_id && map.has(ev.autor_id)) {
        const entry = map.get(ev.autor_id)!;
        entry.acoes++;
        if (ev.valor_novo === "elegivel" || ev.valor_novo === "aguardando_laudo") entry.aprovacoes++;
        if (ev.valor_novo === "reprovada") entry.reprovacoes++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.acoes - a.acoes);
  }, [eventos, mesaUsers]);

  const engPerformance = useMemo(() => {
    const map = new Map<string, { nome: string; crea: string; laudos_total: number; finalizados: number; em_andamento: number }>();
    engenheiros?.forEach((e) => {
      map.set(e.id, {
        nome: (e as any).profiles?.nome || "—",
        crea: e.crea,
        laudos_total: 0,
        finalizados: 0,
        em_andamento: 0,
      });
    });
    solicitacoes?.forEach((s) => {
      const laudos = (s as any).laudos;
      const list = Array.isArray(laudos) ? laudos : laudos ? [laudos] : [];
      list.forEach((l: any) => {
        if (l.engenheiro_id && map.has(l.engenheiro_id)) {
          const entry = map.get(l.engenheiro_id)!;
          entry.laudos_total++;
          if (l.status_laudo === "finalizado") entry.finalizados++;
          else entry.em_andamento++;
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => b.finalizados - a.finalizados);
  }, [solicitacoes, engenheiros]);

  const bancoPerformance = useMemo(() => {
    const map = new Map<string, { nome: string; total: number; aprovados: number; reprovados: number; pendentes: number }>();
    solicitacoes?.forEach((s) => {
      if (!s.banco_parceiro_id) return;
      if (!map.has(s.banco_parceiro_id)) {
        map.set(s.banco_parceiro_id, { nome: "", total: 0, aprovados: 0, reprovados: 0, pendentes: 0 });
      }
      const entry = map.get(s.banco_parceiro_id)!;
      entry.total++;
      if (s.status_banco === "aprovado") entry.aprovados++;
      else if (s.status_banco === "reprovado") entry.reprovados++;
      else entry.pendentes++;
    });
    bancoUsers?.forEach((bu) => {
      const bpId = bu.banco_parceiro_id;
      if (map.has(bpId)) {
        map.get(bpId)!.nome = (bu as any).bancos_parceiros?.nome || bpId;
      }
    });
    solicitacoes?.forEach((s) => {
      if (s.banco_parceiro_id && map.has(s.banco_parceiro_id) && !map.get(s.banco_parceiro_id)!.nome) {
        map.get(s.banco_parceiro_id)!.nome = s.banco_parceiro_id;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [solicitacoes, bancoUsers]);

  const totalSolicitacoes = solicitacoes?.length ?? 0;
  const pendentes = statusCounts["pendente"] ?? 0;
  const emAnalise = (statusCounts["em_analise_mesa"] ?? 0) + (statusCounts["docs_em_validacao"] ?? 0);
  const prontas = statusCounts["pronta_para_banco"] ?? 0;

  const handleExportMesa = () => {
    const headers = ["Membro", "Ações no Período", "Aprovações", "Reprovações"];
    const rows = mesaPerformance.map((m) => [m.nome, String(m.acoes), String(m.aprovacoes), String(m.reprovacoes)]);
    exportCSV(headers, rows, `desempenho_mesa_${de}_${ate}.csv`);
  };

  const handleExportEng = () => {
    const headers = ["Engenheiro", "CREA", "Total Laudos", "Finalizados", "Em Andamento"];
    const rows = engPerformance.map((e) => [e.nome, e.crea, String(e.laudos_total), String(e.finalizados), String(e.em_andamento)]);
    exportCSV(headers, rows, `desempenho_engenheiros_${de}_${ate}.csv`);
  };

  const handleExportBanco = () => {
    const headers = ["Banco", "Total", "Aprovados", "Reprovados", "Pendentes"];
    const rows = bancoPerformance.map((b) => [b.nome, String(b.total), String(b.aprovados), String(b.reprovados), String(b.pendentes)]);
    exportCSV(headers, rows, `desempenho_bancos_${de}_${ate}.csv`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Esteira & Desempenho"
        description="Visão completa do pipeline e métricas de desempenho de todas as equipes."
        icon={<GitBranch className="h-5 w-5" />}
      />

      {/* KPI Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<FileText className="h-4 w-4" />} title="Total Solicitações" value={String(totalSolicitacoes)} loading={loadingSol} delay={0} />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} title="Pendentes" value={String(pendentes)} loading={loadingSol} delay={100} />
        <StatCard icon={<Clock className="h-4 w-4" />} title="Em Análise" value={String(emAnalise)} loading={loadingSol} delay={200} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} title="Prontas p/ Banco" value={String(prontas)} loading={loadingSol} delay={300} />
      </div>

      {/* Date filter */}
      <Card>
        <CardContent className="py-3 flex items-end gap-4 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="w-40 h-9" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="w-40 h-9" />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Pipeline de Solicitações
            <Badge variant="outline" className="ml-auto">{totalSolicitacoes} total</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSol ? (
            <div className="flex gap-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 flex-1 rounded-md" />)}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {pipelineStages.map((stage, i) => {
                const count = statusCounts[stage.key] || 0;
                const pct = totalSolicitacoes > 0 ? Math.round((count / totalSolicitacoes) * 100) : 0;
                return (
                  <div key={stage.key} className="flex items-center gap-1">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div className={`w-full rounded-md px-2 py-2 text-center ${stage.color} text-white text-xs font-medium`}>
                        {count}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">{stage.label}</span>
                      <span className="text-[10px] text-muted-foreground">{pct}%</span>
                    </div>
                    {i < pipelineStages.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Banco & Laudo Funnels */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Ciclo Bancário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-1">
              {bancoStages.map((stage, i) => {
                const count = bancoCounts[stage.key] || 0;
                return (
                  <div key={stage.key} className="flex items-center gap-1">
                    <div className="flex flex-col items-center min-w-[64px]">
                      <div className={`w-full rounded px-2 py-1.5 text-center ${stage.color} text-white text-xs font-medium`}>
                        {count}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">{stage.label}</span>
                    </div>
                    {i < bancoStages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Laudos Técnicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-1">
              {laudoStages.map((stage, i) => {
                const count = laudoCounts[stage.key] || 0;
                return (
                  <div key={stage.key} className="flex items-center gap-1">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div className="w-full rounded px-2 py-1.5 text-center bg-secondary text-secondary-foreground text-xs font-medium">
                        {count}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 text-center leading-tight">{stage.label}</span>
                    </div>
                    {i < laudoStages.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Tabs */}
      <Tabs defaultValue="mesa">
        <TabsList>
          <TabsTrigger value="mesa">Mesa de Produtos ({mesaPerformance.length})</TabsTrigger>
          <TabsTrigger value="engenheiros">Engenheiros ({engPerformance.length})</TabsTrigger>
          <TabsTrigger value="bancos">Bancos ({bancoPerformance.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mesa">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Desempenho da Mesa
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleExportMesa}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {mesaPerformance.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum membro da mesa cadastrado" description="Adicione membros na página de Usuários." />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Membro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                      <TableHead className="text-right">Aprovações</TableHead>
                      <TableHead className="text-right">Reprovações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mesaPerformance.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{m.nome}</TableCell>
                        <TableCell className="text-right">{m.acoes}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-success font-medium">{m.aprovacoes}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-destructive font-medium">{m.reprovacoes}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engenheiros">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Desempenho dos Engenheiros
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleExportEng}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {engPerformance.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum engenheiro com laudos" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Engenheiro</TableHead>
                      <TableHead>CREA</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Finalizados</TableHead>
                      <TableHead className="text-right">Em Andamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engPerformance.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell>{e.crea}</TableCell>
                        <TableCell className="text-right">{e.laudos_total}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-success font-medium">{e.finalizados}</span>
                        </TableCell>
                        <TableCell className="text-right">{e.em_andamento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bancos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Desempenho por Banco
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={handleExportBanco}>
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {bancoPerformance.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum dado bancário disponível" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banco</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Aprovados</TableHead>
                      <TableHead className="text-right">Reprovados</TableHead>
                      <TableHead className="text-right">Pendentes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bancoPerformance.map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{b.nome || "—"}</TableCell>
                        <TableCell className="text-right">{b.total}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-success font-medium">{b.aprovados}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-destructive font-medium">{b.reprovados}</span>
                        </TableCell>
                        <TableCell className="text-right">{b.pendentes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
