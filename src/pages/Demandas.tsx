import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, MapPin, Banknote, Ban, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Demandas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: engenheiroId } = useQuery({
    queryKey: ["engenheiro_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_engenheiro_id");
      return data as string;
    },
  });

  const { data: blacklistStatus } = useQuery({
    queryKey: ["eng_blacklist", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blacklist")
        .select("id")
        .eq("user_id", user!.id)
        .eq("ativo", true)
        .eq("tipo", "engenheiro")
        .limit(1);
      if (error) throw error;
      return data && data.length > 0;
    },
  });

  // Fetch ALL solicitacoes visible to this engineer (RLS handles visibility)
  // Then split into "assigned to me" vs "open for everyone"
  const { data: allSolicitacoes, isLoading } = useQuery({
    queryKey: ["demandas_engenheiro", engenheiroId],
    enabled: !!engenheiroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("id, created_at, valor_pagamento_engenheiro, pronaf_produto_id, engenheiro_atribuido_id, status_solicitacao, pronaf_produtos(nome), propriedades(nome_propriedade, endereco, area_total_ha)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Check if the engineer already has an active laudo for a solicitação
  const { data: existingLaudoSolicitacaoIds } = useQuery({
    queryKey: ["engenheiro_laudos_existentes", engenheiroId],
    enabled: !!engenheiroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laudos")
        .select("solicitacao_id")
        .eq("engenheiro_id", engenheiroId!);
      if (error) throw error;
      return new Set(data?.map((l) => l.solicitacao_id) ?? []);
    },
  });

  // Split into two lists
  const minhasDemandas = allSolicitacoes?.filter(
    (s) => s.engenheiro_atribuido_id === engenheiroId && !existingLaudoSolicitacaoIds?.has(s.id)
  ) ?? [];

  const demandasAbertas = allSolicitacoes?.filter(
    (s) =>
      !s.engenheiro_atribuido_id &&
      ["aguardando_laudo", "pronta_para_banco"].includes(s.status_solicitacao) &&
      !existingLaudoSolicitacaoIds?.has(s.id)
  ) ?? [];

  const aceitarMutation = useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() + 5);
      const dataLimiteStr = dataLimite.toISOString().split("T")[0];

      // Create the laudo
      const { error: laudoErr } = await supabase.from("laudos").insert({
        engenheiro_id: engenheiroId!,
        solicitacao_id: solicitacaoId,
        status_laudo: "em_vistoria",
        data_limite_visita: dataLimiteStr,
      });
      if (laudoErr) throw laudoErr;

      // Update solicitação status to aguardando_laudo if it isn't already
      const sol = allSolicitacoes?.find((s) => s.id === solicitacaoId);
      if (sol && !["aguardando_laudo", "pronta_para_banco"].includes(sol.status_solicitacao)) {
        const { error: updateErr } = await supabase
          .from("solicitacoes_laudo")
          .update({
            status_solicitacao: "aguardando_laudo",
            engenheiro_atribuido_id: engenheiroId!,
          })
          .eq("id", solicitacaoId);
        if (updateErr) throw updateErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["demandas_engenheiro"] });
      qc.invalidateQueries({ queryKey: ["engenheiro_laudos_existentes"] });
      toast({ title: "Demanda aceita! Você tem 5 dias para realizar a visita." });
      navigate("/meus-laudos");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao aceitar", description: err.message, variant: "destructive" });
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const renderCard = (s: any, isAssigned: boolean) => {
    const prop = s.propriedades;
    const produto = s.pronaf_produtos;
    return (
      <Card key={s.id}>
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold">{prop?.nome_propriedade}</span>
                {produto && <Badge variant="secondary">{produto.nome}</Badge>}
                {isAssigned && (
                  <Badge variant="default" className="gap-1 text-xs">
                    <UserCheck className="h-3 w-3" /> Atribuída a você
                  </Badge>
                )}
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
              disabled={aceitarMutation.isPending || !engenheiroId || blacklistStatus === true}
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Demandas Disponíveis</h1>
        <p className="text-muted-foreground">Veja a localização e o valor antes de aceitar.</p>
      </div>

      {blacklistStatus === true && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4 text-destructive">
            <Ban className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Sua conta está suspensa. Você não pode aceitar novas demandas.</p>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <>
          {/* Demandas atribuídas diretamente ao engenheiro */}
          {minhasDemandas.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Atribuídas a Você ({minhasDemandas.length})
              </h2>
              <div className="grid gap-4">
                {minhasDemandas.map((s) => renderCard(s, true))}
              </div>
            </div>
          )}

          {/* Demandas abertas para qualquer engenheiro */}
          {demandasAbertas.length > 0 && (
            <div className="space-y-3">
              {minhasDemandas.length > 0 && (
                <h2 className="font-display text-lg font-semibold">Abertas para Todos ({demandasAbertas.length})</h2>
              )}
              <div className="grid gap-4">
                {demandasAbertas.map((s) => renderCard(s, false))}
              </div>
            </div>
          )}

          {minhasDemandas.length === 0 && demandasAbertas.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma demanda disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
