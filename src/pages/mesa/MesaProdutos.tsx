import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, MapPin, Sprout, Banknote, Check, X, Send, MessageCircle, Users } from "lucide-react";

const statusMesaMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em análise", variant: "secondary" },
  docs_ok: { label: "Docs OK", variant: "secondary" },
  elegibilidade_ok: { label: "Elegível", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
  docs_pendente_eng: { label: "Docs pendente (eng.)", variant: "outline" },
};

export default function MesaProdutos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [notas, setNotas] = useState("");
  const [engenheiroAtribuidoId, setEngenheiroAtribuidoId] = useState("");

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["mesa_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade, endereco, area_total_ha), pronaf_produtos(nome, finalidade, valor_engenheiro, tipo_valor_engenheiro), profiles:produtor_id(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: engenheiros } = useQuery({
    queryKey: ["lista_engenheiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engenheiros")
        .select("id, crea, user_id, area_atuacao")
        .eq("status_verificacao", "aprovado");
      if (error) throw error;
      // Get profiles for names
      if (data?.length) {
        const userIds = data.map((e) => e.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome")
          .in("id", userIds);
        return data.map((e) => ({
          ...e,
          nome: profiles?.find((p) => p.id === e.user_id)?.nome || "—",
        }));
      }
      return [];
    },
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["chat_mesa", selectedSolicitacao?.id],
    enabled: !!selectedSolicitacao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_mensagens")
        .select("*")
        .eq("solicitacao_id", selectedSolicitacao.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status_mesa, extra }: { id: string; status_mesa: string; extra?: any }) => {
      const updateData: any = {
        status_mesa,
        notas_mesa: notas,
        ...extra,
      };
      if (status_mesa === "aprovada") {
        updateData.aprovado_mesa_em = new Date().toISOString();
        updateData.aprovado_mesa_por = user?.id;
        updateData.status_solicitacao = "aberta"; // make visible to engineers
      }
      if (engenheiroAtribuidoId) {
        updateData.engenheiro_atribuido_id = engenheiroAtribuidoId;
      }
      const { error } = await supabase
        .from("solicitacoes_laudo")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa_solicitacoes"] });
      toast({ title: "Status atualizado!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chat_mensagens").insert({
        solicitacao_id: selectedSolicitacao.id,
        remetente_id: user!.id,
        remetente_role: "mesa_produtos",
        mensagem: chatMessage,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_mesa", selectedSolicitacao?.id] });
      setChatMessage("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    },
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openDetail = (s: any) => {
    setSelectedSolicitacao(s);
    setNotas(s.notas_mesa || "");
    setEngenheiroAtribuidoId(s.engenheiro_atribuido_id || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mesa de Produtos</h1>
        <p className="text-muted-foreground">Gerencie solicitações, valide documentos e atribua engenheiros.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !solicitacoes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {solicitacoes.map((s) => {
            const prop = (s as any).propriedades;
            const produto = (s as any).pronaf_produtos;
            const st = statusMesaMap[s.status_mesa] || { label: s.status_mesa, variant: "outline" as const };
            return (
              <Card key={s.id} className="cursor-pointer hover:ring-1 hover:ring-ring transition-shadow" onClick={() => openDetail(s)}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold">{prop?.nome_propriedade}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {produto && <Badge variant="outline">{produto.nome}</Badge>}
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
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedSolicitacao} onOpenChange={(v) => { if (!v) setSelectedSolicitacao(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Análise da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="font-medium">Propriedade:</span> {(selectedSolicitacao as any).propriedades?.nome_propriedade}</div>
                <div><span className="font-medium">Endereço:</span> {(selectedSolicitacao as any).propriedades?.endereco}</div>
                <div><span className="font-medium">Cultura:</span> {selectedSolicitacao.cultura_principal}</div>
                <div><span className="font-medium">Área:</span> {selectedSolicitacao.area_cultivo_ha} ha</div>
                <div><span className="font-medium">Valor:</span> {formatCurrency(selectedSolicitacao.valor_solicitado)}</div>
                <div><span className="font-medium">Produto:</span> {(selectedSolicitacao as any).pronaf_produtos?.nome || "—"}</div>
                <div><span className="font-medium">Pagamento Eng.:</span> {formatCurrency(selectedSolicitacao.valor_pagamento_engenheiro)}</div>
                <div><span className="font-medium">Status Mesa:</span> {statusMesaMap[selectedSolicitacao.status_mesa]?.label}</div>
              </div>

              {/* Notas da mesa */}
              <div className="space-y-2">
                <Label>Notas da Mesa</Label>
                <Textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Observações sobre documentação, elegibilidade..."
                />
              </div>

              {/* Atribuição de engenheiro */}
              <div className="space-y-2">
                <Label>Atribuir Engenheiro (opcional — deixe vazio para abrir para todos)</Label>
                <Select value={engenheiroAtribuidoId || "todos"} onValueChange={(v) => setEngenheiroAtribuidoId(v === "todos" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Abrir para todos os engenheiros" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Abrir para todos</SelectItem>
                    {engenheiros?.map((eng) => (
                      <SelectItem key={eng.id} value={eng.id}>
                        {eng.nome} (CREA: {eng.crea})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {selectedSolicitacao.status_mesa === "pendente" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "em_analise" })}>
                    Iniciar Análise
                  </Button>
                )}
                {["pendente", "em_analise"].includes(selectedSolicitacao.status_mesa) && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "docs_ok" })}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Docs OK
                  </Button>
                )}
                {["docs_ok", "em_analise"].includes(selectedSolicitacao.status_mesa) && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "elegibilidade_ok" })}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Elegibilidade OK
                  </Button>
                )}
                {selectedSolicitacao.status_mesa !== "aprovada" && selectedSolicitacao.status_mesa !== "rejeitada" && (
                  <>
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "aprovada" })} disabled={updateStatusMutation.isPending}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Aprovar e Disparar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "rejeitada" })}>
                      <X className="h-3.5 w-3.5 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
                {selectedSolicitacao.status_mesa !== "docs_pendente_eng" && selectedSolicitacao.status_mesa !== "aprovada" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: "docs_pendente_eng" })}>
                    Solicitar Docs ao Eng.
                  </Button>
                )}
              </div>

              {/* Chat section */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" /> Chat
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-md border p-3 bg-muted/30">
                  {!chatMessages?.length ? (
                    <p className="text-xs text-muted-foreground text-center">Nenhuma mensagem ainda.</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className={`text-sm ${msg.remetente_id === user?.id ? "text-right" : ""}`}>
                        <span className="text-xs text-muted-foreground">
                          {msg.remetente_role === "mesa_produtos" ? "Mesa" : msg.remetente_role === "engenheiro" ? "Engenheiro" : "Produtor"}
                          {" · "}
                          {new Date(msg.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </span>
                        <p className={`rounded-md p-2 inline-block max-w-[80%] ${msg.remetente_id === user?.id ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}>
                          {msg.mensagem}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Enviar mensagem..."
                    onKeyDown={(e) => { if (e.key === "Enter" && chatMessage.trim()) sendChatMutation.mutate(); }}
                  />
                  <Button size="icon" onClick={() => sendChatMutation.mutate()} disabled={!chatMessage.trim() || sendChatMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
