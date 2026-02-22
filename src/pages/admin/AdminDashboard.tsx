import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, MapPin, ClipboardCheck, Clock, CheckCircle2, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [produtores, engenheiros, laudos, pagPendentes, solicitacoes] = await Promise.all([
        supabase.from("produtores").select("id", { count: "exact", head: true }),
        supabase.from("engenheiros").select("id", { count: "exact", head: true }),
        supabase.from("laudos").select("id", { count: "exact", head: true }),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
        supabase.from("solicitacoes_laudo").select("status_solicitacao"),
      ]);
      const totalPendente = pagPendentes.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;

      const statusCounts: Record<string, number> = {};
      (solicitacoes.data ?? []).forEach((s) => {
        statusCounts[s.status_solicitacao] = (statusCounts[s.status_solicitacao] || 0) + 1;
      });

      return {
        produtores: produtores.count ?? 0,
        engenheiros: engenheiros.count ?? 0,
        laudos: laudos.count ?? 0,
        totalPendente,
        statusCounts,
        totalSolicitacoes: solicitacoes.data?.length ?? 0,
      };
    },
  });

  const { data: recentLogins, isLoading: loadingLogins } = useQuery({
    queryKey: ["admin_recent_logins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("login_logs")
        .select("login_at")
        .gte("login_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("login_at", { ascending: true });
      const byDay: Record<string, number> = {};
      (data ?? []).forEach((l) => {
        const day = l.login_at.slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      });
      return Object.entries(byDay).map(([day, count]) => ({ day: day.slice(5), logins: count }));
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    em_analise_mesa: "Análise Mesa",
    docs_pendentes_produtor: "Docs Pendentes",
    docs_em_validacao: "Validação",
    elegivel: "Elegível",
    reprovada: "Reprovada",
    aguardando_laudo: "Aguard. Laudo",
    pronta_para_banco: "Pronta p/ Banco",
  };

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--secondary-foreground))",
    "hsl(210 60% 50%)",
    "hsl(var(--success))",
    "hsl(var(--destructive))",
    "hsl(var(--warning))",
    "hsl(280 50% 55%)",
  ];

  const pieData = Object.entries(stats?.statusCounts ?? {}).map(([status, count]) => ({
    name: statusLabels[status] ?? status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title="Painel Admin"
        description="Visão geral da plataforma AgroLaudo."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard loading={isLoading} icon={<MapPin className="h-4 w-4" />} title="Produtores" value={String(stats?.produtores ?? "0")} delay={0} />
        <StatCard loading={isLoading} icon={<Users className="h-4 w-4" />} title="Engenheiros" value={String(stats?.engenheiros ?? "0")} delay={75} />
        <StatCard loading={isLoading} icon={<FileText className="h-4 w-4" />} title="Laudos" value={String(stats?.laudos ?? "0")} delay={150} />
        <StatCard loading={isLoading} icon={<CreditCard className="h-4 w-4" />} title="Pgto Pendente" value={formatCurrency(stats?.totalPendente ?? 0)} delay={225} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard loading={isLoading} icon={<ClipboardCheck className="h-4 w-4" />} title="Total Solicitações" value={String(stats?.totalSolicitacoes ?? "0")} delay={300} />
        <StatCard loading={isLoading} icon={<Clock className="h-4 w-4" />} title="Em Análise" value={String((stats?.statusCounts?.em_analise_mesa ?? 0) + (stats?.statusCounts?.docs_em_validacao ?? 0))} delay={375} />
        <StatCard loading={isLoading} icon={<CheckCircle2 className="h-4 w-4" />} title="Prontas p/ Banco" value={String(stats?.statusCounts?.pronta_para_banco ?? 0)} delay={450} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="opacity-0 animate-slide-up" style={{ animationDelay: "500ms", animationFillMode: "forwards" }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[250px]">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              </div>
            ) : pieData.length > 0 ? (
              <ChartContainer config={{}} className="h-[250px] w-full">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sem dados disponíveis.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="opacity-0 animate-slide-up" style={{ animationDelay: "575ms", animationFillMode: "forwards" }}>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Logins (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLogins ? (
              <div className="flex items-end gap-2 h-[250px] pb-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : (recentLogins ?? []).length > 0 ? (
              <ChartContainer config={{ logins: { label: "Logins", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                <BarChart data={recentLogins}>
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Bar dataKey="logins" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sem dados disponíveis.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
