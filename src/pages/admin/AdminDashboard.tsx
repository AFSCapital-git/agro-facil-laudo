import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, MapPin } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const [produtores, engenheiros, laudos, pagPendentes] = await Promise.all([
        supabase.from("produtores").select("id", { count: "exact", head: true }),
        supabase.from("engenheiros").select("id", { count: "exact", head: true }),
        supabase.from("laudos").select("id", { count: "exact", head: true }),
        supabase.from("pagamentos_engenheiro").select("valor_bruto").eq("status_pagamento", "pendente"),
      ]);
      const totalPendente = pagPendentes.data?.reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
      return {
        produtores: produtores.count ?? 0,
        engenheiros: engenheiros.count ?? 0,
        laudos: laudos.count ?? 0,
        totalPendente,
      };
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

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
