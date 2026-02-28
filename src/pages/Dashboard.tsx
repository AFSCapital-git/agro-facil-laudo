import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  FileText, MapPin, ClipboardCheck, CreditCard, Sprout, TrendingUp, TrendingDown,
  ArrowRight, Calendar, Clock, Activity, BarChart3, Plus, Eye, ChevronRight,
  Wallet, Target, AlertCircle, CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { role, user } = useAuth();
  const nome = user?.user_metadata?.nome?.split(" ")[0] || "Usuário";
  const navigate = useNavigate();

  if (role === "admin") return <AdminDashboard />;

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const dateStr = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  const { data: prodStats, isLoading: loadingProd } = useQuery({
    queryKey: ["produtor_stats"],
    enabled: role === "produtor",
    queryFn: async () => {
      const [props, sols, aprovados, pendentes] = await Promise.all([
        supabase.from("propriedades").select("id", { count: "exact", head: true }),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).neq("status_solicitacao", "reprovada"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_banco", "aprovado"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).in("status_solicitacao", ["pendente", "em_analise_mesa", "docs_pendentes_produtor"]),
      ]);
      return {
        props: props.count ?? 0,
        sols: sols.count ?? 0,
        laudos: aprovados.count ?? 0,
        pendentes: pendentes.count ?? 0,
      };
    },
  });

  const { data: engStats, isLoading: loadingEng } = useQuery({
    queryKey: ["engenheiro_stats"],
    enabled: role === "engenheiro",
    queryFn: async () => {
      const [demandas, laudos, pagPend, pagPago] = await Promise.all([
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).in("status_solicitacao", ["aguardando_laudo", "pronta_para_banco"]),
        supabase.from("laudos").select("id", { count: "exact", head: true }).neq("status_laudo", "finalizado"),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pago"),
      ]);
      const totalPend = pagPend.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      const totalPago = pagPago.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      return { demandas: demandas.count ?? 0, laudos: laudos.count ?? 0, totalPend, totalPago };
    },
  });

  const { data: recentSolicitacoes, isLoading: loadingTimeline } = useQuery({
    queryKey: ["dashboard_timeline", role],
    enabled: role === "produtor" || role === "engenheiro",
    queryFn: async () => {
      if (role === "produtor") {
        const { data } = await supabase
          .from("solicitacoes_laudo")
          .select("id, created_at, status_solicitacao, status_banco, aprovado_mesa_em, data_envio_banco, data_retorno_banco, cultura_principal, laudos(id, status_laudo, created_at, updated_at), propriedades:propriedade_id(nome_propriedade)")
          .order("created_at", { ascending: false })
          .limit(5);
        return data ?? [];
      }
      const { data } = await supabase
        .from("laudos")
        .select("id, status_laudo, created_at, updated_at, solicitacoes_laudo:solicitacao_id(id, created_at, status_solicitacao, status_banco, aprovado_mesa_em, data_envio_banco, data_retorno_banco, cultura_principal, propriedades:propriedade_id(nome_propriedade))")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const isLoading = role === "produtor" ? loadingProd : loadingEng;

  // Quick actions per role
  const quickActions = role === "produtor"
    ? [
        { label: "Nova Propriedade", icon: Plus, path: "/propriedades", color: "bg-primary/10 text-primary" },
        { label: "Nova Solicitação", icon: FileText, path: "/solicitacoes", color: "bg-accent/10 text-accent" },
        { label: "Ver Histórico", icon: BarChart3, path: "/relatorios-produtor", color: "bg-success/10 text-success" },
      ]
    : [
        { label: "Ver Demandas", icon: ClipboardCheck, path: "/demandas", color: "bg-primary/10 text-primary" },
        { label: "Meus Laudos", icon: FileText, path: "/meus-laudos", color: "bg-accent/10 text-accent" },
        { label: "Pagamentos", icon: Wallet, path: "/pagamentos", color: "bg-success/10 text-success" },
      ];

  return (
    <div className="space-y-6">
      {/* Hero Header - Fintech style */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/8 via-card to-accent/5 border p-6 animate-fade-in">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Calendar className="h-3.5 w-3.5" />
            <span className="capitalize">{dateStr}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, <span className="text-primary">{nome}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
            {role === "produtor"
              ? "Acompanhe suas operações de crédito rural em tempo real."
              : "Gerencie suas demandas e acompanhe seus recebimentos."}
          </p>
        </div>
      </div>

      {/* KPI Cards - Financial terminal style */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {role === "produtor" && (
          <>
            <KPICard
              loading={isLoading}
              icon={<MapPin className="h-4 w-4" />}
              label="Propriedades"
              value={String(prodStats?.props ?? "0")}
              subtitle="cadastradas"
              accentColor="text-primary"
              bgColor="bg-primary/10"
              delay={0}
            />
            <KPICard
              loading={isLoading}
              icon={<Activity className="h-4 w-4" />}
              label="Operações Ativas"
              value={String(prodStats?.sols ?? "0")}
              subtitle="em andamento"
              accentColor="text-accent"
              bgColor="bg-accent/10"
              delay={50}
            />
            <KPICard
              loading={isLoading}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Aprovadas"
              value={String(prodStats?.laudos ?? "0")}
              subtitle="pelo banco"
              accentColor="text-success"
              bgColor="bg-success/10"
              delay={100}
            />
            <KPICard
              loading={isLoading}
              icon={<AlertCircle className="h-4 w-4" />}
              label="Pendências"
              value={String(prodStats?.pendentes ?? "0")}
              subtitle="requer atenção"
              accentColor="text-warning"
              bgColor="bg-warning/10"
              delay={150}
            />
          </>
        )}
        {role === "engenheiro" && (
          <>
            <KPICard
              loading={isLoading}
              icon={<Target className="h-4 w-4" />}
              label="Demandas"
              value={String(engStats?.demandas ?? "0")}
              subtitle="disponíveis"
              accentColor="text-primary"
              bgColor="bg-primary/10"
              delay={0}
            />
            <KPICard
              loading={isLoading}
              icon={<FileText className="h-4 w-4" />}
              label="Laudos Ativos"
              value={String(engStats?.laudos ?? "0")}
              subtitle="em andamento"
              accentColor="text-accent"
              bgColor="bg-accent/10"
              delay={50}
            />
            <KPICard
              loading={isLoading}
              icon={<Wallet className="h-4 w-4" />}
              label="A Receber"
              value={formatCurrency(engStats?.totalPend ?? 0)}
              subtitle="pendente"
              accentColor="text-warning"
              bgColor="bg-warning/10"
              delay={100}
              isFinancial
            />
            <KPICard
              loading={isLoading}
              icon={<TrendingUp className="h-4 w-4" />}
              label="Total Recebido"
              value={formatCurrency(engStats?.totalPago ?? 0)}
              subtitle="acumulado"
              accentColor="text-success"
              bgColor="bg-success/10"
              delay={150}
              isFinancial
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-3 animate-fade-in" style={{ animationDelay: "200ms" }}>
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${action.color} transition-transform group-hover:scale-110`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold font-display truncate">{action.label}</p>
              <p className="text-[10px] text-muted-foreground">Acessar</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Pipeline / Timeline Section */}
      {(role === "produtor" || role === "engenheiro") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h2 className="font-display text-lg font-semibold">Pipeline de Operações</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => navigate(role === "produtor" ? "/solicitacoes" : "/meus-laudos")}
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          {loadingTimeline ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentSolicitacoes && recentSolicitacoes.length > 0 ? (
            <div className="space-y-2">
              {recentSolicitacoes.map((item: any, i: number) => {
                const sol = role === "produtor" ? item : item.solicitacoes_laudo;
                const laudo = role === "produtor" ? (Array.isArray(item.laudos) ? item.laudos[0] : item.laudos) : item;
                const prop = role === "produtor" ? item.propriedades : sol?.propriedades;
                if (!sol) return null;

                const statusColor =
                  sol.status_banco === "aprovado" ? "text-success" :
                  sol.status_banco === "reprovado" ? "text-destructive" :
                  sol.status_solicitacao === "reprovada" ? "text-destructive" :
                  "text-muted-foreground";

                return (
                  <Card
                    key={sol.id}
                    className="overflow-hidden opacity-0 animate-slide-up transition-all hover:shadow-md hover:border-primary/20 cursor-pointer group"
                    style={{ animationDelay: `${300 + i * 60}ms`, animationFillMode: "forwards" }}
                    onClick={() => navigate(role === "produtor" ? "/solicitacoes" : "/meus-laudos")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Sprout className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold font-display truncate">
                              {prop?.nome_propriedade || "Propriedade"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {sol.cultura_principal || "—"} • {new Date(sol.created_at).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <StatusTimeline solicitacao={sol} laudo={laudo} />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title="Nenhuma operação ativa"
              description="Suas operações de crédito rural aparecerão aqui em tempo real."
              action={
                role === "produtor" ? (
                  <Button size="sm" onClick={() => navigate("/solicitacoes")} className="gap-1.5 mt-2">
                    <Plus className="h-3.5 w-3.5" /> Nova Solicitação
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── KPI Card Component ──────────────────── */
interface KPICardProps {
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  accentColor: string;
  bgColor: string;
  delay?: number;
  isFinancial?: boolean;
}

function KPICard({ loading, icon, label, value, subtitle, accentColor, bgColor, delay = 0, isFinancial }: KPICardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <Skeleton className="h-3 w-16 mb-3" />
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-3 w-12" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="overflow-hidden opacity-0 animate-slide-up transition-all hover:shadow-md hover:border-primary/20 relative group"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${bgColor.replace("/10", "")}`} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${bgColor} ${accentColor}`}>
            {icon}
          </div>
        </div>
        <p className={`font-display font-bold tracking-tight ${isFinancial ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"}`}>
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
