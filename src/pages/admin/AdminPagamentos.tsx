import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Wallet, Clock, CheckCircle2 } from "lucide-react";

export default function AdminPagamentos() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: pagamentos, isLoading } = useQuery({
    queryKey: ["admin_pagamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pagamentos_engenheiro")
        .select("*, engenheiros(crea, profiles:user_id(nome))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const marcarPago = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pagamentos_engenheiro")
        .update({
          status_pagamento: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_pagamentos"] });
      toast({ title: "Pagamento marcado como pago!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const total = pagamentos?.length ?? 0;
  const pendentes = pagamentos?.filter((p) => p.status_pagamento === "pendente") ?? [];
  const pagos = pagamentos?.filter((p) => p.status_pagamento === "pago") ?? [];
  const valorPendente = pendentes.reduce((s, p) => s + p.valor_bruto, 0);
  const valorPago = pagos.reduce((s, p) => s + p.valor_bruto, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Pagamentos"
        description="Gerencie os pagamentos dos engenheiros."
        icon={<CreditCard className="h-5 w-5" />}
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<CreditCard className="h-4 w-4" />} title="Total Pagamentos" value={String(total)} loading={isLoading} delay={0} />
        <StatCard icon={<Clock className="h-4 w-4" />} title="Pendentes" value={String(pendentes.length)} description={formatCurrency(valorPendente)} loading={isLoading} delay={100} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} title="Pagos" value={String(pagos.length)} description={formatCurrency(valorPago)} loading={isLoading} delay={200} />
        <StatCard icon={<Wallet className="h-4 w-4" />} title="Valor Pendente" value={formatCurrency(valorPendente)} loading={isLoading} delay={300} />
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
        </CardContent></Card>
      ) : !pagamentos?.length ? (
        <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Nenhum pagamento registrado" description="Os pagamentos aparecem aqui quando laudos são finalizados." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Engenheiro</TableHead>
                  <TableHead>CREA</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Pago em</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagamentos.map((p) => {
                  const eng = (p as any).engenheiros;
                  const profile = eng?.profiles;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{profile?.nome || "—"}</TableCell>
                      <TableCell>{eng?.crea || "—"}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(p.valor_bruto)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status_pagamento === "pago" ? "default" : "outline"}>
                          {p.status_pagamento}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.data_prevista_pagamento
                          ? new Date(p.data_prevista_pagamento).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.data_pagamento
                          ? new Date(p.data_pagamento).toLocaleDateString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {p.status_pagamento === "pendente" && (
                          <Button
                            size="sm"
                            onClick={() => marcarPago.mutate(p.id)}
                            disabled={marcarPago.isPending}
                          >
                            Pagar
                          </Button>
                        )}
                      </TableCell>
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
