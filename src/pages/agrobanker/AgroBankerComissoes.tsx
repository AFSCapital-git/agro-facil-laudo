import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Clock, CheckCircle2 } from "lucide-react";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AgroBankerComissoes() {
  const { data: agrobankerId } = useQuery({
    queryKey: ["agrobanker_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_agrobanker_id");
      return data as string;
    },
  });

  const { data: comissoes = [] } = useQuery({
    queryKey: ["ab_comissoes", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_comissoes")
        .select("*")
        .eq("agrobanker_id", agrobankerId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const totalPendente = comissoes.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);
  const totalPago = comissoes.filter((c) => c.status === "pago").reduce((s, c) => s + Number(c.valor), 0);
  const totalGeral = comissoes.reduce((s, c) => s + Number(c.valor), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Comissões" description="Acompanhe seus ganhos e pagamentos" />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Geral" value={formatCurrency(totalGeral)} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard title="Pendente" value={formatCurrency(totalPendente)} icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Pago" value={formatCurrency(totalPago)} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Data Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comissoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma comissão registrada.
                  </TableCell>
                </TableRow>
              ) : (
                comissoes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="capitalize">{c.tipo.replace("_", " ")}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(c.valor))}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "pago" ? "default" : c.status === "pendente" ? "secondary" : "outline"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.data_pagamento ? new Date(c.data_pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
