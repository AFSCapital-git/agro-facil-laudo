import { useEffect, useState } from "react";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Building2, Users, TrendingUp, Eye } from "lucide-react";
import { SEGMENTOS, STATUS_MEMBRO_LABELS } from "@/types/rede-membro";

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  tipo: string;
  status: string;
  uf: string;
  municipio: string;
  rm_id: string | null;
}

interface Membro {
  id: string;
  empresa_id: string;
  tipo_pessoa: string;
  segmento: string;
  status: string;
  nome_completo: string;
  nome_fantasia: string;
  razao_social: string;
  cpf: string;
  cnpj: string;
  uf: string;
}

export default function OnboardingRMDashboard() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [{ data: empData }, { data: memData }] = await Promise.all([
        (onboardingDb as any).empresas().select("*"),
        (onboardingDb as any).redeMembros().select("*"),
      ]);
      setEmpresas((empData || []) as Empresa[]);
      setMembros((memData || []) as Membro[]);
      setLoading(false);
    };
    load();
  }, []);

  const subestabelecidos = empresas.filter(e => e.tipo === 'subestabelecido' || e.rm_id);
  
  const getMembrosEmpresa = (empresaId: string) => membros.filter(m => m.empresa_id === empresaId);

  const stats = {
    totalSubest: subestabelecidos.length,
    totalMembros: membros.length,
    membrosAtivos: membros.filter(m => m.status === 'ativo').length,
    membrosPendentes: membros.filter(m => m.status === 'pendente').length,
  };

  const segmentoCount = SEGMENTOS.reduce((acc, seg) => {
    acc[seg.value] = membros.filter(m => m.segmento === seg.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard RM"
        description="Acompanhe métricas e performance dos Subestabelecidos e suas redes"
        icon={<BarChart3 className="h-5 w-5" />}
      />

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Subestabelecidos", value: stats.totalSubest, icon: Building2, color: "text-blue-600" },
          { label: "Total da Rede", value: stats.totalMembros, icon: Users, color: "text-primary" },
          { label: "Membros Ativos", value: stats.membrosAtivos, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Pendentes", value: stats.membrosPendentes, icon: Eye, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution by segment */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Distribuição por Segmento</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {SEGMENTOS.filter(s => segmentoCount[s.value] > 0).map(s => (
              <div key={s.value} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm font-medium">{s.label}</span>
                <Badge variant="secondary">{segmentoCount[s.value]}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per Subestabelecido breakdown */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="detail">Por Subestabelecido</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3">
          {subestabelecidos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum subestabelecido vinculado.</CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subestabelecidos.map(emp => {
                const empMembros = getMembrosEmpresa(emp.id);
                const ativos = empMembros.filter(m => m.status === 'ativo').length;
                return (
                  <Card key={emp.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm truncate">{emp.nome_fantasia || emp.razao_social}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{emp.municipio}/{emp.uf}</span>
                        <Badge variant={emp.status === 'ativo' ? 'default' : 'secondary'} className="text-[10px]">{emp.status}</Badge>
                      </div>
                      <div className="mt-3 flex gap-3">
                        <div className="text-center flex-1 bg-muted/30 rounded p-2">
                          <p className="text-lg font-bold">{empMembros.length}</p>
                          <p className="text-[10px] text-muted-foreground">Membros</p>
                        </div>
                        <div className="text-center flex-1 bg-muted/30 rounded p-2">
                          <p className="text-lg font-bold text-primary">{ativos}</p>
                          <p className="text-[10px] text-muted-foreground">Ativos</p>
                        </div>
                        <div className="text-center flex-1 bg-muted/30 rounded p-2">
                          <p className="text-lg font-bold text-destructive">{empMembros.length - ativos}</p>
                          <p className="text-[10px] text-muted-foreground">Pendentes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="detail" className="space-y-4">
          {subestabelecidos.map(emp => {
            const empMembros = getMembrosEmpresa(emp.id);
            if (empMembros.length === 0) return null;
            return (
              <Card key={emp.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {emp.nome_fantasia || emp.razao_social}
                    <Badge variant="outline" className="text-[10px]">{empMembros.length} membros</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {empMembros.map(m => {
                      const displayName = m.tipo_pessoa === 'pj' ? (m.nome_fantasia || m.razao_social) : m.nome_completo;
                      const segLabel = SEGMENTOS.find(s => s.value === m.segmento)?.label || m.segmento;
                      const statusInfo = STATUS_MEMBRO_LABELS[m.status] || { label: m.status, color: '' };
                      return (
                        <div key={m.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{displayName || "—"}</span>
                            <Badge variant="outline" className="text-[10px]">{segLabel}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.uf && <span className="text-xs text-muted-foreground">{m.uf}</span>}
                            <Badge variant="secondary" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
