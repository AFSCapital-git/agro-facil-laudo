import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, ClipboardCheck, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";

export default function Dashboard() {
  const { role, user } = useAuth();
  const nome = user?.user_metadata?.nome || "Usuário";

  if (role === "admin") return <AdminDashboard />;

  const { data: prodStats } = useQuery({
    queryKey: ["produtor_stats"],
    enabled: role === "produtor",
    queryFn: async () => {
      const [props, sols, laudos] = await Promise.all([
        supabase.from("propriedades").select("id", { count: "exact", head: true }),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).neq("status_solicitacao", "finalizada"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_solicitacao", "finalizada"),
      ]);
      return { props: props.count ?? 0, sols: sols.count ?? 0, laudos: laudos.count ?? 0 };
    },
  });

  const { data: engStats } = useQuery({
    queryKey: ["engenheiro_stats"],
    enabled: role === "engenheiro",
    queryFn: async () => {
      const [demandas, laudos, pagPend] = await Promise.all([
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_solicitacao", "aberta"),
        supabase.from("laudos").select("id", { count: "exact", head: true }).neq("status_laudo", "finalizado"),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
      ]);
      const totalPend = pagPend.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      return { demandas: demandas.count ?? 0, laudos: laudos.count ?? 0, totalPend };
    },
  });

  const { data: recentSolicitacoes } = useQuery({
    queryKey: ["dashboard_timeline", role],
    enabled: role === "produtor" || role === "engenheiro",
    queryFn: async () => {
      if (role === "produtor") {
        const { data } = await supabase
          .from("solicitacoes_laudo")
          .select("id, created_at, status_solicitacao, status_mesa, status_banco, aprovado_mesa_em, data_envio_banco, data_retorno_banco, cultura_principal, laudos(id, status_laudo, created_at, updated_at), propriedades:propriedade_id(nome_propriedade)")
          .order("created_at", { ascending: false })
          .limit(5);
        return data ?? [];
      }
      // engenheiro
      const { data } = await supabase
        .from("laudos")
        .select("id, status_laudo, created_at, updated_at, solicitacoes_laudo:solicitacao_id(id, created_at, status_solicitacao, status_mesa, status_banco, aprovado_mesa_em, data_envio_banco, data_retorno_banco, cultura_principal, propriedades:propriedade_id(nome_propriedade))")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Olá, {nome}!</h1>
        <p className="text-muted-foreground">
          {role === "produtor" && "Gerencie suas propriedades e solicitações de laudo."}
          {role === "engenheiro" && "Veja demandas disponíveis e gerencie seus laudos."}
          {!role && "Carregando informações..."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === "produtor" && (
          <>
            <DashCard icon={MapPin} title="Propriedades" value={String(prodStats?.props ?? "—")} desc="cadastradas" />
            <DashCard icon={FileText} title="Solicitações" value={String(prodStats?.sols ?? "—")} desc="ativas" />
            <DashCard icon={ClipboardCheck} title="Laudos" value={String(prodStats?.laudos ?? "—")} desc="finalizados" />
          </>
        )}
        {role === "engenheiro" && (
          <>
            <DashCard icon={ClipboardCheck} title="Demandas" value={String(engStats?.demandas ?? "—")} desc="disponíveis" />
            <DashCard icon={FileText} title="Meus Laudos" value={String(engStats?.laudos ?? "—")} desc="em andamento" />
            <DashCard icon={CreditCard} title="Pendente" value={formatCurrency(engStats?.totalPend ?? 0)} desc="a receber" />
          </>
        )}
      </div>

      {(role === "produtor" || role === "engenheiro") && recentSolicitacoes && recentSolicitacoes.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Andamento das Solicitações</h2>
          {recentSolicitacoes.map((item: any) => {
            const sol = role === "produtor" ? item : item.solicitacoes_laudo;
            const laudo = role === "produtor" ? (Array.isArray(item.laudos) ? item.laudos[0] : item.laudos) : item;
            const prop = role === "produtor" ? item.propriedades : sol?.propriedades;
            if (!sol) return null;
            return (
              <Card key={sol.id} className="overflow-hidden">
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
          })}
        </div>
      )}
    </div>
  );
}

function DashCard({ icon: Icon, title, value, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
