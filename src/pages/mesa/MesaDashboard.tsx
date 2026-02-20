import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, FileText, Send, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function MesaDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["mesa_stats"],
    queryFn: async () => {
      const [pendentes, emAnalise, aprovadas, enviadas, devolvidas, total] = await Promise.all([
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_mesa", "pendente"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).in("status_mesa", ["em_analise", "docs_ok", "elegibilidade_ok"]),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_mesa", "aprovada"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_banco", "enviado_banco"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }).eq("status_banco", "devolvido_banco"),
        supabase.from("solicitacoes_laudo").select("id", { count: "exact", head: true }),
      ]);
      return {
        pendentes: pendentes.count ?? 0,
        emAnalise: emAnalise.count ?? 0,
        aprovadas: aprovadas.count ?? 0,
        enviadas: enviadas.count ?? 0,
        devolvidas: devolvidas.count ?? 0,
        total: total.count ?? 0,
      };
    },
  });

  const cards = [
    { icon: Clock, title: "Pendentes", value: stats?.pendentes ?? 0, desc: "Aguardando análise" },
    { icon: ClipboardCheck, title: "Em Análise", value: stats?.emAnalise ?? 0, desc: "Docs / elegibilidade" },
    { icon: CheckCircle2, title: "Aprovadas", value: stats?.aprovadas ?? 0, desc: "Liberadas para engenheiro" },
    { icon: Send, title: "Enviadas ao Banco", value: stats?.enviadas ?? 0, desc: "Aguardando retorno" },
    { icon: AlertTriangle, title: "Devolvidas", value: stats?.devolvidas ?? 0, desc: "Requer ação" },
    { icon: FileText, title: "Total", value: stats?.total ?? 0, desc: "Todas as solicitações" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Painel da Mesa</h1>
        <p className="text-muted-foreground">Visão geral das solicitações e esteira de trabalho.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
