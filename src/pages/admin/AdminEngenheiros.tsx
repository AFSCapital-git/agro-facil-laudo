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
import { Users, CheckCircle2, XCircle } from "lucide-react";

export default function AdminEngenheiros() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: engenheiros, isLoading } = useQuery({
    queryKey: ["admin_engenheiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engenheiros")
        .select("*, profiles:user_id(nome, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("engenheiros")
        .update({ status_verificacao: status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_engenheiros"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
    if (s === "aprovado") return "default";
    if (s === "reprovado") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Engenheiros</h1>
        <p className="text-muted-foreground">Aprove ou reprove cadastros de engenheiros.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !engenheiros?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum engenheiro cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CREA</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Laudos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {engenheiros.map((e) => {
                  const profile = (e as any).profiles;
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{profile?.nome || "—"}</span>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{e.crea}</TableCell>
                      <TableCell>{e.area_atuacao || "—"}</TableCell>
                      <TableCell>{e.total_laudos_concluidos}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(e.status_verificacao)}>
                          {e.status_verificacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {e.status_verificacao === "pendente" && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-success"
                              onClick={() => updateStatus.mutate({ id: e.id, status: "aprovado" })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => updateStatus.mutate({ id: e.id, status: "reprovado" })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
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
