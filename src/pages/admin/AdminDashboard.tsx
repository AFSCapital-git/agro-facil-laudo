import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, CreditCard, MapPin, ClipboardCheck, Clock, CheckCircle2,
  LayoutDashboard, TrendingUp, Activity, Wallet, Target, ArrowRight,
  ChevronRight, Calendar, Shield, Briefcase, AlertCircle, BarChart3,
  GitBranch, Settings, Package, UserCheck,
} from "lucide-react";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const nome = user?.user_metadata?.nome?.split(" ")[0] || "Admin";

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [produtores, engenheiros, laudos, pagPendentes, pagPagos, solicitacoes, agrobankers] = await Promise.all([
        supabase.from("produtores").select("id", { count: "exact", head: true }),
        supabase.from("engenheiros").select("id", { count: "exact", head: true }),
        supabase.from("laudos").select("id", { count: "exact", head: true }),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pago"),
        supabase.from("solicitacoes_laudo").select("status_solicitacao, status_banco"),
        supabase.from("agrobankers").select("id", { count: "exact", head: true }),
      ]);
      const totalPendente = pagPendentes.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      const totalPago = pagPagos.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;

      const statusCounts: Record<string, number> = {};
      const bancoCounts: Record<string, number> = {};
      (solicitacoes.data ?? []).forEach((s) => {
        statusCounts[s.status_solicitacao] = (statusCounts[s.status_solicitacao] || 0) + 1;
        bancoCounts[s.status_banco] = (bancoCounts[s.status_banco] || 0) + 1;
      });

      return {
        produtores: produtores.count ?? 0,
        engenheiros: engenheiros.count ?? 0,
        agrobankers: agrobankers.count ?? 0,
        laudos: laudos.count ?? 0,
        totalPendente,
        totalPago,
        statusCounts,
        bancoCounts,
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
    "hsl(var(--success))",
    "hsl(210 60% 50%)",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(280 50% 55%)",
    "hsl(var(--secondary-foreground))",
  ];

  const pieData = Object.entries(stats?.statusCounts ?? {}).map(([status, count]) => ({
    name: statusLabels[status] ?? status,
    value: count,
  }));

  // Operational metrics
  const emAnalise = (stats?.statusCounts?.em_analise_mesa ?? 0) + (stats?.statusCounts?.docs_em_validacao ?? 0);
  const pendentes = stats?.statusCounts?.pendente ?? 0;
  const prontasBanco = stats?.statusCounts?.pronta_para_banco ?? 0;
  const aprovadosBanco = stats?.bancoCounts?.aprovado ?? 0;
  const taxaAprovacao = stats?.totalSolicitacoes ? Math.round((aprovadosBanco / stats.totalSolicitacoes) * 100) : 0;

  // Quick actions
  const quickActions = [
    { label: "Esteira", desc: "Funil & Desempenho", icon: GitBranch, path: "/admin/esteira", color: "bg-primary/10 text-primary" },
    { label: "Usuários", desc: "Gestão de perfis", icon: Users, path: "/admin/usuarios", color: "bg-accent/10 text-accent" },
    { label: "Produtos", desc: "PRONAF", icon: Package, path: "/admin/produtos-pronaf", color: "bg-success/10 text-success" },
    { label: "Relatórios", desc: "Exportar dados", icon: BarChart3, path: "/admin/relatorios", color: "bg-warning/10 text-warning" },
    { label: "Auditoria", desc: "Logs do sistema", icon: Shield, path: "/admin/auditoria", color: "bg-destructive/10 text-destructive" },
    { label: "Configurações", desc: "Plataforma", icon: Settings, path: "/admin/configuracoes", color: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/8 via-card to-accent/5 border p-6 animate-fade-in">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="capitalize">{dateStr}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              {greeting}, <span className="text-primary">{nome}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Centro de controle da plataforma AgroLaudo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 text-xs font-medium">
              <Activity className="h-3 w-3 text-success animate-pulse" />
              Sistema Operacional
            </Badge>
          </div>
        </div>
      </div>

      {/* Primary KPIs - Financial Terminal Style */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KPICard loading={isLoading} icon={<MapPin className="h-4 w-4" />} label="Produtores" value={String(stats?.produtores ?? 0)} accentColor="text-primary" bgColor="bg-primary/10" delay={0} />
        <KPICard loading={isLoading} icon={<UserCheck className="h-4 w-4" />} label="Engenheiros" value={String(stats?.engenheiros ?? 0)} accentColor="text-accent" bgColor="bg-accent/10" delay={50} />
        <KPICard loading={isLoading} icon={<Briefcase className="h-4 w-4" />} label="AgroBankers" value={String(stats?.agrobankers ?? 0)} accentColor="text-success" bgColor="bg-success/10" delay={100} />
        <KPICard loading={isLoading} icon={<FileText className="h-4 w-4" />} label="Laudos" value={String(stats?.laudos ?? 0)} accentColor="text-warning" bgColor="bg-warning/10" delay={150} />
      </div>

      {/* Operational Metrics Row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <MetricCard loading={isLoading} label="Total Operações" value={String(stats?.totalSolicitacoes ?? 0)} icon={<ClipboardCheck className="h-3.5 w-3.5" />} delay={200} />
        <MetricCard loading={isLoading} label="Pendentes" value={String(pendentes)} icon={<Clock className="h-3.5 w-3.5" />} variant="warning" delay={230} />
        <MetricCard loading={isLoading} label="Em Análise" value={String(emAnalise)} icon={<Activity className="h-3.5 w-3.5" />} variant="info" delay={260} />
        <MetricCard loading={isLoading} label="Prontas p/ Banco" value={String(prontasBanco)} icon={<Target className="h-3.5 w-3.5" />} variant="success" delay={290} />
        <MetricCard loading={isLoading} label="Taxa Aprovação" value={`${taxaAprovacao}%`} icon={<TrendingUp className="h-3.5 w-3.5" />} variant="primary" delay={320} />
      </div>

      {/* Financial Summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Card className="overflow-hidden opacity-0 animate-slide-up relative group hover:shadow-md transition-all" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-warning" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pagamentos Pendentes</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="font-display text-2xl font-bold tracking-tight text-warning">{formatCurrency(stats?.totalPendente ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">aguardando liberação</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden opacity-0 animate-slide-up relative group hover:shadow-md transition-all" style={{ animationDelay: "380ms", animationFillMode: "forwards" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-success" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Pago</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="font-display text-2xl font-bold tracking-tight text-success">{formatCurrency(stats?.totalPago ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">acumulado na plataforma</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="font-display text-base font-semibold">Acesso Rápido</h2>
        </div>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 animate-fade-in" style={{ animationDelay: "420ms" }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} transition-transform group-hover:scale-110`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold font-display">{action.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="opacity-0 animate-slide-up overflow-hidden" style={{ animationDelay: "480ms", animationFillMode: "forwards" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Distribuição por Status
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">{stats?.totalSolicitacoes ?? 0} total</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[260px]">
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              </div>
            ) : pieData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ChartContainer config={{}} className="h-[260px] flex-1">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={50} strokeWidth={2} label={({ name, value }) => `${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="hidden sm:flex flex-col gap-1.5 min-w-[120px]">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-[11px]">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Sem dados disponíveis.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="opacity-0 animate-slide-up overflow-hidden" style={{ animationDelay: "540ms", animationFillMode: "forwards" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent" />
                Logins (últimos 7 dias)
              </CardTitle>
              <Badge variant="outline" className="text-[10px]">
                {(recentLogins ?? []).reduce((s, d) => s + d.logins, 0)} acessos
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loadingLogins ? (
              <div className="flex items-end gap-2 h-[260px] pb-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : (recentLogins ?? []).length > 0 ? (
              <ChartContainer config={{ logins: { label: "Logins", color: "hsl(var(--primary))" } }} className="h-[260px] w-full">
                <BarChart data={recentLogins}>
                  <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Bar dataKey="logins" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Sem dados disponíveis.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ──────────────────── KPI Card ──────────────────── */
interface KPICardProps {
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
  bgColor: string;
  delay?: number;
}

function KPICard({ loading, icon, label, value, accentColor, bgColor, delay = 0 }: KPICardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-7 w-14 mb-1" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden opacity-0 animate-slide-up transition-all hover:shadow-md hover:border-primary/20 relative" style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}>
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bgColor.replace("/10", "")}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bgColor} ${accentColor}`}>{icon}</div>
        </div>
        <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

/* ──────────────────── Metric Card (compact) ──────────────────── */
interface MetricCardProps {
  loading?: boolean;
  label: string;
  value: string;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "info" | "success" | "primary";
  delay?: number;
}

function MetricCard({ loading, label, value, icon, variant = "default", delay = 0 }: MetricCardProps) {
  const variantStyles: Record<string, string> = {
    default: "text-foreground",
    warning: "text-warning",
    info: "text-accent",
    success: "text-success",
    primary: "text-primary",
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-3 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div><Skeleton className="h-4 w-10 mb-1" /><Skeleton className="h-3 w-16" /></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden opacity-0 animate-slide-up transition-all hover:shadow-sm" style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`font-display text-lg font-bold tracking-tight ${variantStyles[variant]}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
