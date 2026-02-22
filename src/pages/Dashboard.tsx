import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, ClipboardCheck, CreditCard, Sprout } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { role, user } = useAuth();
  const nome = user?.user_metadata?.nome || "Usuário";

  if (role === "admin") return <AdminDashboard />;

  const { data: prodStats, isLoading: loadingProd } = useQuery({
    queryKey: ["produtor_stats"],
    enabled: role === "produtor",
    queryFn: async () => {
      const [props, sols, aprovados] = await Promise.all([
        supabase.from("propriedades").select("id", { count: "exact", head: true }),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).neq("status_solicitacao", "reprovada"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_banco", "aprovado"),
      ]);
      return { props: props.count ?? 0, sols: sols.count ?? 0, laudos: aprovados.count ?? 0 };
    },
  });

  const { data: engStats, isLoading: loadingEng } = useQuery({
    queryKey: ["engenheiro_stats"],
    enabled: role === "engenheiro",
    queryFn: async () => {
      const [demandas, laudos, pagPend] = await Promise.all([
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).in("status_solicitacao", ["aguardando_laudo", "pronta_para_banco"]),
        supabase.from("laudos").select("id", { count: "exact", head: true }).neq("status_laudo", "finalizado"),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
      ]);
      const totalPend = pagPend.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      return { demandas: demandas.count ?? 0, laudos: laudos.count ?? 0, totalPend };
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

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Sprout className="h-5 w-5" />}
        title={`Olá, ${nome}!`}
        description={
          role === "produtor"
            ? "Gerencie suas propriedades e solicitações de laudo."
            : role === "engenheiro"
            ? "Veja demandas disponíveis e gerencie seus laudos."
            : "Carregando informações..."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {role === "produtor" && (
          <>
            <StatCard loading={isLoading} icon={<MapPin className="h-4 w-4" />} title="Propriedades" value={String(prodStats?.props ?? "0")} description="cadastradas" delay={0} />
            <StatCard loading={isLoading} icon={<FileText className="h-4 w-4" />} title="Solicitações" value={String(prodStats?.sols ?? "0")} description="ativas" delay={75} />
            <StatCard loading={isLoading} icon={<ClipboardCheck className="h-4 w-4" />} title="Aprovados" value={String(prodStats?.laudos ?? "0")} description="pelo banco" delay={150} />
          </>
        )}
        {role === "engenheiro" && (
          <>
            <StatCard loading={isLoading} icon={<ClipboardCheck className="h-4 w-4" />} title="Demandas" value={String(engStats?.demandas ?? "0")} description="disponíveis" delay={0} />
            <StatCard loading={isLoading} icon={<FileText className="h-4 w-4" />} title="Meus Laudos" value={String(engStats?.laudos ?? "0")} description="em andamento" delay={75} />
            <StatCard loading={isLoading} icon={<CreditCard className="h-4 w-4" />} title="Pendente" value={formatCurrency(engStats?.totalPend ?? 0)} description="a receber" delay={150} />
          </>
        )}
      </div>

      {(role === "produtor" || role === "engenheiro") && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold animate-fade-in" style={{ animationDelay: "200ms" }}>
            Andamento das Solicitações
          </h2>
          {loadingTimeline ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-48 mb-3" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentSolicitacoes && recentSolicitacoes.length > 0 ? (
            recentSolicitacoes.map((item: any, i: number) => {
              const sol = role === "produtor" ? item : item.solicitacoes_laudo;
              const laudo = role === "produtor" ? (Array.isArray(item.laudos) ? item.laudos[0] : item.laudos) : item;
              const prop = role === "produtor" ? item.propriedades : sol?.propriedades;
              if (!sol) return null;
              return (
                <Card
                  key={sol.id}
                  className="overflow-hidden opacity-0 animate-slide-up transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${250 + i * 75}ms`, animationFillMode: "forwards" }}
                >
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {prop?.nome_propriedade || "Propriedade"} — {sol.cultura_principal || "—"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <StatusTimeline solicitacao={sol} laudo={laudo} />
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="Nenhuma solicitação ainda"
              description="Quando você tiver solicitações, o andamento aparecerá aqui."
            />
          )}
        </div>
      )}
    </div>
  );
}
