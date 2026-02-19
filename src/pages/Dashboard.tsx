import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, ClipboardCheck, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
