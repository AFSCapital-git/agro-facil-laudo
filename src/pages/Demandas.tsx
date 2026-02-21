import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, MapPin, Banknote } from "lucide-react";
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
        .select("id, created_at, valor_pagamento_engenheiro, pronaf_produto_id, pronaf_produtos(nome), propriedades(nome_propriedade, endereco, area_total_ha)")
        .in("status_solicitacao", ["aguardando_laudo", "pronta_para_banco"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const aceitarMutation = useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 5);
      const dataLimiteStr = dataLimite.toISOString().split("T")[0];

      const { error: laudoErr } = await supabase.from("laudos").insert({
        engenheiro_id: engenheiroId!,
        solicitacao_id: solicitacaoId,
        status_laudo: "em_vistoria",
        data_limite_visita: dataLimiteStr,
      });
      if (laudoErr) throw laudoErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas_abertas"] });
      toast({ title: "Demanda aceita! Você tem 5 dias para realizar a visita." });
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
        <p className="text-muted-foreground">Veja a localização e o valor antes de aceitar.</p>
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
            const produto = (s as any).pronaf_produtos;
            return (
              <Card key={s.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold">{prop?.nome_propriedade}</span>
                        {produto && <Badge variant="secondary">{produto.nome}</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {prop?.endereco}
                        </span>
                        {s.valor_pagamento_engenheiro > 0 && (
                          <span className="flex items-center gap-1 text-foreground font-medium">
                            <Banknote className="h-3.5 w-3.5" /> {formatCurrency(s.valor_pagamento_engenheiro)}
                          </span>
                        )}
                      </div>
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
                    Solicitado em {new Date(s.created_at).toLocaleDateString("pt-BR")} · Prazo de visita: 5 dias após aceite
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
