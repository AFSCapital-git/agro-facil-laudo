import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Send, RotateCcw, CheckCircle2, MapPin, Banknote, XCircle } from "lucide-react";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";

const statusBancoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  nao_enviado: { label: "Não enviado", variant: "outline" },
  enviado: { label: "Enviado ao Banco", variant: "secondary" },
  devolvido: { label: "Devolvido pelo Banco", variant: "destructive" },
  aprovado: { label: "Aprovado pelo Banco", variant: "default" },
  reprovado: { label: "Reprovado pelo Banco", variant: "destructive" },
};

export default function MesaEnviosBanco() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any | null>(null);
  const [obs, setObs] = useState("");

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["mesa_envios_banco"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade, endereco), pronaf_produtos(nome), laudos(id, status_laudo, caminho_pdf_laudo), bancos_parceiros(nome)")
        .in("status_banco", ["nao_enviado", "enviado", "devolvido", "aprovado", "reprovado"])
        .eq("status_solicitacao", "pronta_para_banco")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateBanco = useMutation({
    mutationFn: async ({ id, status_banco }: { id: string; status_banco: string }) => {
      const updateData: any = { status_banco, observacoes_banco: obs };
      if (status_banco === "enviado") updateData.data_envio_banco = new Date().toISOString();
      if (["devolvido", "aprovado", "reprovado"].includes(status_banco)) updateData.data_retorno_banco = new Date().toISOString();
      const { error } = await supabase.from("solicitacoes_laudo").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa_envios_banco"] });
      toast({ title: "Status bancário atualizado!" });
      setSelected(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openDetail = (s: any) => {
    setSelected(s);
    setObs((s as any).observacoes_banco || "");
  };

  const filterByStatus = (status: string) =>
    solicitacoes?.filter((s) => (s as any).status_banco === status) ?? [];

  const getLaudoStatus = (s: any): string | null => {
    const laudos = (s as any).laudos;
    if (!laudos) return null;
    if (Array.isArray(laudos)) {
      if (laudos.length === 0) return null;
      return laudos[0].status_laudo;
    }
    return laudos.status_laudo;
  };

  const renderList = (items: any[]) =>
    !items.length ? (
      <p className="text-sm text-muted-foreground text-center py-8">Nenhum item nesta etapa.</p>
    ) : (
      <div className="grid gap-3">
        {items.map((s) => {
          const prop = (s as any).propriedades;
          const produto = (s as any).pronaf_produtos;
          const st = statusBancoMap[(s as any).status_banco] || { label: (s as any).status_banco, variant: "outline" as const };
          const laudoSt = getLaudoStatus(s);
          return (
            <Card key={s.id} className="cursor-pointer hover:ring-1 hover:ring-ring transition-shadow" onClick={() => openDetail(s)}>
              <CardContent className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-display font-semibold text-sm">{prop?.nome_propriedade}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    {produto && <Badge variant="outline">{produto.nome}</Badge>}
                    {laudoSt && (
                      <Badge variant={laudoSt === "finalizado" ? "default" : "secondary"} className="text-xs">
                        Laudo: {laudoSt === "em_vistoria" ? "em vistoria" : laudoSt === "aguardando_assinatura" ? "aguard. assin." : laudoSt}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatCurrency(s.valor_solicitado)}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {prop?.endereco}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Envios ao Banco</h1>
        <p className="text-muted-foreground">Gerencie envios, devolutivas e aprovações bancárias.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Tabs defaultValue="prontos">
          <TabsList>
            <TabsTrigger value="prontos">Prontos p/ Envio ({filterByStatus("nao_enviado").length})</TabsTrigger>
            <TabsTrigger value="enviados">Enviados ({filterByStatus("enviado").length})</TabsTrigger>
            <TabsTrigger value="devolvidos">Devolvidos ({filterByStatus("devolvido").length})</TabsTrigger>
            <TabsTrigger value="aprovados">Aprovados ({filterByStatus("aprovado").length})</TabsTrigger>
            <TabsTrigger value="reprovados">Reprovados ({filterByStatus("reprovado").length})</TabsTrigger>
          </TabsList>
          <TabsContent value="prontos">{renderList(filterByStatus("nao_enviado"))}</TabsContent>
          <TabsContent value="enviados">{renderList(filterByStatus("enviado"))}</TabsContent>
          <TabsContent value="devolvidos">{renderList(filterByStatus("devolvido"))}</TabsContent>
          <TabsContent value="aprovados">{renderList(filterByStatus("aprovado"))}</TabsContent>
          <TabsContent value="reprovados">{renderList(filterByStatus("reprovado"))}</TabsContent>
        </Tabs>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gestão Bancária</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <StatusTimeline solicitacao={selected} />
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="font-medium">Propriedade:</span> {(selected as any).propriedades?.nome_propriedade}</div>
                <div><span className="font-medium">Valor:</span> {formatCurrency(selected.valor_solicitado)}</div>
                <div><span className="font-medium">Banco destino:</span> {(selected as any).bancos_parceiros?.nome || selected.banco_destino || "—"}</div>
                <div><span className="font-medium">Status:</span> {statusBancoMap[(selected as any).status_banco]?.label}</div>
                {(selected as any).data_envio_banco && (
                  <div><span className="font-medium">Enviado em:</span> {new Date((selected as any).data_envio_banco).toLocaleDateString("pt-BR")}</div>
                )}
                {(selected as any).data_retorno_banco && (
                  <div><span className="font-medium">Retorno em:</span> {new Date((selected as any).data_retorno_banco).toLocaleDateString("pt-BR")}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Observações bancárias</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Motivo de devolução, protocolo..." />
              </div>

              <div className="flex flex-wrap gap-2">
                {(selected as any).status_banco === "nao_enviado" && (
                  <Button size="sm" onClick={() => updateBanco.mutate({ id: selected.id, status_banco: "enviado" })} disabled={updateBanco.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Marcar como Enviado
                  </Button>
                )}
                {(selected as any).status_banco === "enviado" && (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => updateBanco.mutate({ id: selected.id, status_banco: "devolvido" })} disabled={updateBanco.isPending}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Devolvido
                    </Button>
                    <Button size="sm" onClick={() => updateBanco.mutate({ id: selected.id, status_banco: "aprovado" })} disabled={updateBanco.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovado pelo Banco
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateBanco.mutate({ id: selected.id, status_banco: "reprovado" })} disabled={updateBanco.isPending}>
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reprovado pelo Banco
                    </Button>
                  </>
                )}
                {(selected as any).status_banco === "devolvido" && (
                  <Button size="sm" onClick={() => updateBanco.mutate({ id: selected.id, status_banco: "enviado" })} disabled={updateBanco.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Reenviar ao Banco
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
