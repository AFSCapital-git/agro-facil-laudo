import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, MapPin, Sprout, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Demandas() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: engenheiroId } = useQuery({
    queryKey: ["engenheiro_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_engenheiro_id");
      return data as string;
    },
  });

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["demandas_abertas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade, endereco, area_total_ha)")
        .eq("status_solicitacao", "aberta")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const aceitarMutation = useMutation({
    mutationFn: async (solicitacaoId: string) => {
      // Create laudo linked to this request
      const { error: laudoErr } = await supabase.from("laudos").insert({
        engenheiro_id: engenheiroId!,
        solicitacao_id: solicitacaoId,
        status_laudo: "em_vistoria",
      });
      if (laudoErr) throw laudoErr;

      // Update request status
      const { error: solErr } = await supabase
        .from("solicitacoes_laudo")
        .update({ status_solicitacao: "aceita" })
        .eq("id", solicitacaoId);
      if (solErr) throw solErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas_abertas"] });
      toast({ title: "Demanda aceita! Vá para Meus Laudos para iniciar a vistoria." });
      navigate("/meus-laudos");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao aceitar", description: err.message, variant: "destructive" });
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Demandas Disponíveis</h1>
        <p className="text-muted-foreground">Solicitações de laudo abertas para aceite.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !solicitacoes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma demanda disponível no momento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {solicitacoes.map((s) => {
            const prop = (s as any).propriedades;
            return (
              <Card key={s.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold">{prop?.nome_propriedade}</span>
                        <Badge variant="secondary">{s.tipo_credito}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {prop?.endereco}
                        </span>
                        <span className="flex items-center gap-1">
                          <Sprout className="h-3.5 w-3.5" /> {s.cultura_principal} · {s.area_cultivo_ha} ha
                        </span>
                        <span className="flex items-center gap-1">
                          <Banknote className="h-3.5 w-3.5" /> {formatCurrency(s.valor_solicitado)}
                        </span>
                      </div>
                      {s.observacoes_produtor && (
                        <p className="text-sm text-muted-foreground italic">"{s.observacoes_produtor}"</p>
                      )}
                    </div>
                    <Button
                      onClick={() => aceitarMutation.mutate(s.id)}
                      disabled={aceitarMutation.isPending || !engenheiroId}
                      size="sm"
                    >
                      Aceitar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Solicitado em {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
