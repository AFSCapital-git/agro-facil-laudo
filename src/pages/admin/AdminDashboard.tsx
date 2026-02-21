import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, MapPin, ClipboardCheck, Clock, CheckCircle2 } from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
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

  const { data: recentLogins } = useQuery({
    queryKey: ["admin_recent_logins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("login_logs")
        .select("login_at")
        .gte("login_at", new Date(Date.now() - 7 * 86400000).toISOString())
        .order("login_at", { ascending: true });
      // group by day
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
    "hsl(var(--secondary))",
    "hsl(210 60% 50%)",
    "hsl(150 50% 45%)",
    "hsl(0 60% 50%)",
    "hsl(45 80% 50%)",
    "hsl(280 50% 55%)",
  ];

  const pieData = Object.entries(stats?.statusCounts ?? {}).map(([status, count]) => ({
    name: statusLabels[status] ?? status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel Admin</h1>
        <p className="text-muted-foreground">Visão geral da plataforma AgroLaudo.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={MapPin} title="Produtores" value={String(stats?.produtores ?? "—")} />
        <StatCard icon={Users} title="Engenheiros" value={String(stats?.engenheiros ?? "—")} />
        <StatCard icon={FileText} title="Laudos" value={String(stats?.laudos ?? "—")} />
        <StatCard icon={CreditCard} title="Pgto Pendente" value={formatCurrency(stats?.totalPendente ?? 0)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={ClipboardCheck} title="Total Solicitações" value={String(stats?.totalSolicitacoes ?? "—")} />
        <StatCard icon={Clock} title="Em Análise" value={String((stats?.statusCounts?.em_analise_mesa ?? 0) + (stats?.statusCounts?.docs_em_validacao ?? 0))} />
        <StatCard icon={CheckCircle2} title="Prontas p/ Banco" value={String(stats?.statusCounts?.pronta_para_banco ?? 0)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
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
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>

        {/* Login activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Logins (últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {(recentLogins ?? []).length > 0 ? (
              <ChartContainer config={{ logins: { label: "Logins", color: "hsl(var(--primary))" } }} className="h-[250px] w-full">
                <BarChart data={recentLogins}>
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Bar dataKey="logins" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
      </CardContent>
    </Card>
  );
}
