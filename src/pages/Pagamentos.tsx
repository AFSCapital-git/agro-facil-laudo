import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  pago: { label: "Pago", variant: "default" },
};

export default function Pagamentos() {
  const { data: pagamentos, isLoading } = useQuery({
    queryKey: ["meus_pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos_engenheiro")
        .select("*, laudos(solicitacoes_laudo(propriedades(nome_propriedade)))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const totalPendente = pagamentos?.filter((p) => p.status_pagamento === "pendente").reduce((s, p) => s + p.valor_bruto, 0) ?? 0;
  const totalPago = pagamentos?.filter((p) => p.status_pagamento === "pago").reduce((s, p) => s + p.valor_bruto, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Meus Pagamentos</h1>
        <p className="text-muted-foreground">Acompanhe seus recebimentos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-display text-warning">{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-display text-success">{formatCurrency(totalPago)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !pagamentos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data prevista</TableHead>
                  <TableHead>Data pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.map((p) => {
                  const propName = (p as any).laudos?.solicitacoes_laudo?.propriedades?.nome_propriedade || "—";
                  const st = statusMap[p.status_pagamento] || { label: p.status_pagamento, variant: "outline" as const };
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{propName}</TableCell>
                      <TableCell>{formatCurrency(p.valor_bruto)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>{p.data_prevista_pagamento ? new Date(p.data_prevista_pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
