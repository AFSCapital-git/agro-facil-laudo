import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Gestão de Pagamentos</h1>
        <p className="text-muted-foreground">Gerencie os pagamentos dos engenheiros.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !pagamentos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <CreditCard className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum pagamento registrado.</p>
          </CardContent>
        </Card>
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
                      <TableCell>{formatCurrency(p.valor_bruto)}</TableCell>
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
