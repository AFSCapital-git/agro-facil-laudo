import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { ClipboardCheck, MapPin, Sprout, Banknote, Check, X, Send, MessageCircle, Sparkles, FileSearch, UserCheck, Loader2, FolderOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

const statusMesaMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise: { label: "Em análise", variant: "secondary" },
  docs_ok: { label: "Docs OK", variant: "secondary" },
  elegibilidade_ok: { label: "Elegível", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  rejeitada: { label: "Rejeitada", variant: "destructive" },
  docs_pendente_eng: { label: "Docs pendente (eng.)", variant: "outline" },
};

const pipelineStages = [
  { key: "pendente", label: "Pendentes" },
  { key: "em_analise", label: "Em Análise" },
  { key: "docs_ok", label: "Docs OK" },
  { key: "elegibilidade_ok", label: "Elegível" },
  { key: "aprovada", label: "Aprovadas" },
];

export default function MesaProdutos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const ai = useAiAssistant();
  const qc = useQueryClient();
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [notas, setNotas] = useState("");
  const [engenheiroAtribuidoId, setEngenheiroAtribuidoId] = useState("");
  
  // Payment override state
  const [tipoValorOverride, setTipoValorOverride] = useState<"produto" | "fixo" | "percentual">("produto");
  const [valorOverride, setValorOverride] = useState("");

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
      if (data?.length) {
        const userIds = data.map((e) => e.user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", userIds);
        return data.map((e) => ({ ...e, nome: profiles?.find((p) => p.id === e.user_id)?.nome || "—" }));
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
      const updateData: any = { status_mesa, notas_mesa: notas, ...extra };
      
      if (status_mesa === "aprovada") {
        updateData.aprovado_mesa_em = new Date().toISOString();
        updateData.aprovado_mesa_por = user?.id;
        updateData.status_solicitacao = "aberta";
      }
      if (engenheiroAtribuidoId) {
        updateData.engenheiro_atribuido_id = engenheiroAtribuidoId;
      }

      // Apply payment override
      if (tipoValorOverride !== "produto" && valorOverride) {
        updateData.tipo_valor_engenheiro_override = tipoValorOverride;
        updateData.valor_engenheiro_override = parseFloat(valorOverride) || 0;
        // Calculate actual payment
        const sol = selectedSolicitacao;
        if (tipoValorOverride === "fixo") {
          updateData.valor_pagamento_engenheiro = parseFloat(valorOverride) || 0;
        } else if (tipoValorOverride === "percentual") {
          updateData.valor_pagamento_engenheiro = (sol.valor_solicitado * (parseFloat(valorOverride) || 0)) / 100;
        }
      } else if (tipoValorOverride === "produto") {
        // Use product defaults
        const produto = (selectedSolicitacao as any).pronaf_produtos;
        if (produto) {
          if (produto.tipo_valor_engenheiro === "fixo") {
            updateData.valor_pagamento_engenheiro = produto.valor_engenheiro;
          } else {
            updateData.valor_pagamento_engenheiro = (selectedSolicitacao.valor_solicitado * produto.valor_engenheiro) / 100;
          }
        }
        updateData.tipo_valor_engenheiro_override = null;
        updateData.valor_engenheiro_override = null;
      }

      const { error } = await supabase.from("solicitacoes_laudo").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa_solicitacoes"] });
      toast({ title: "Atualizado com sucesso!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
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
    onError: (err: Error) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openDetail = (s: any) => {
    setSelectedSolicitacao(s);
    setNotas(s.notas_mesa || "");
    setEngenheiroAtribuidoId(s.engenheiro_atribuido_id || "");
    // Load payment override state
    if ((s as any).tipo_valor_engenheiro_override) {
      setTipoValorOverride((s as any).tipo_valor_engenheiro_override);
      setValorOverride(String((s as any).valor_engenheiro_override ?? ""));
    } else {
      setTipoValorOverride("produto");
      setValorOverride("");
    }
  };

  const filterByStage = (stage: string) =>
    solicitacoes?.filter((s) => s.status_mesa === stage) ?? [];

  const renderCard = (s: any) => {
    const prop = (s as any).propriedades;
    const produto = (s as any).pronaf_produtos;
    const st = statusMesaMap[s.status_mesa] || { label: s.status_mesa, variant: "outline" as const };
    return (
      <Card key={s.id} className="cursor-pointer hover:ring-1 hover:ring-ring transition-shadow" onClick={() => openDetail(s)}>
        <CardContent className="py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-display font-semibold text-sm">{prop?.nome_propriedade}</span>
              {produto && <Badge variant="outline" className="text-xs">{produto.nome}</Badge>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {prop?.endereco}</span>
            <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {formatCurrency(s.valor_solicitado)}</span>
          </div>
          {s.valor_pagamento_engenheiro > 0 && (
            <p className="text-xs font-medium text-foreground">Eng.: {formatCurrency(s.valor_pagamento_engenheiro)}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Esteira de Solicitações</h1>
        <p className="text-muted-foreground">Pipeline completo: documentação → elegibilidade → aprovação → engenheiro.</p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Tabs defaultValue="pendente">
          <TabsList className="flex-wrap h-auto">
            {pipelineStages.map((stage) => (
              <TabsTrigger key={stage.key} value={stage.key}>
                {stage.label} ({filterByStage(stage.key).length})
              </TabsTrigger>
            ))}
            <TabsTrigger value="rejeitada">Rejeitadas ({filterByStage("rejeitada").length})</TabsTrigger>
          </TabsList>
          {pipelineStages.map((stage) => (
            <TabsContent key={stage.key} value={stage.key}>
              {!filterByStage(stage.key).length ? (
                <Card><CardContent className="flex flex-col items-center gap-3 py-12">
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma solicitação nesta etapa.</p>
                </CardContent></Card>
              ) : (
                <div className="grid gap-3">{filterByStage(stage.key).map(renderCard)}</div>
              )}
            </TabsContent>
          ))}
          <TabsContent value="rejeitada">
            {!filterByStage("rejeitada").length ? (
              <Card><CardContent className="flex flex-col items-center gap-3 py-12">
                <p className="text-muted-foreground">Nenhuma solicitação rejeitada.</p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-3">{filterByStage("rejeitada").map(renderCard)}</div>
            )}
          </TabsContent>
        </Tabs>
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
                <div><span className="font-medium">Valor solicitado:</span> {formatCurrency(selectedSolicitacao.valor_solicitado)}</div>
                <div><span className="font-medium">Produto:</span> {(selectedSolicitacao as any).pronaf_produtos?.nome || "—"}</div>
                <div><span className="font-medium">Status Mesa:</span> <Badge variant={statusMesaMap[selectedSolicitacao.status_mesa]?.variant}>{statusMesaMap[selectedSolicitacao.status_mesa]?.label}</Badge></div>
                <div><span className="font-medium">Pgto Eng. atual:</span> {formatCurrency(selectedSolicitacao.valor_pagamento_engenheiro)}</div>
              </div>

              {/* Payment override */}
              <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Remuneração do Engenheiro (por projeto)
                </h4>
                <RadioGroup
                  value={tipoValorOverride}
                  onValueChange={(v) => setTipoValorOverride(v as "produto" | "fixo" | "percentual")}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="produto" id="ov-produto" />
                    <Label htmlFor="ov-produto" className="text-sm">Usar padrão do produto</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="fixo" id="ov-fixo" />
                    <Label htmlFor="ov-fixo" className="text-sm">Valor fixo (R$)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="percentual" id="ov-pct" />
                    <Label htmlFor="ov-pct" className="text-sm">Percentual (%)</Label>
                  </div>
                </RadioGroup>
                {tipoValorOverride === "produto" ? (
                  <p className="text-xs text-muted-foreground">
                    Produto: {(selectedSolicitacao as any).pronaf_produtos?.tipo_valor_engenheiro === "percentual"
                      ? `${(selectedSolicitacao as any).pronaf_produtos?.valor_engenheiro}%`
                      : formatCurrency((selectedSolicitacao as any).pronaf_produtos?.valor_engenheiro ?? 0)}
                  </p>
                ) : (
                  <Input
                    type="number"
                    step="0.01"
                    value={valorOverride}
                    onChange={(e) => setValorOverride(e.target.value)}
                    placeholder={tipoValorOverride === "fixo" ? "Ex: 800.00" : "Ex: 2.5"}
                    className="max-w-[200px]"
                  />
                )}
                {tipoValorOverride !== "produto" && valorOverride && (
                  <p className="text-xs font-medium text-foreground">
                    Valor calculado: {tipoValorOverride === "fixo"
                      ? formatCurrency(parseFloat(valorOverride) || 0)
                      : formatCurrency((selectedSolicitacao.valor_solicitado * (parseFloat(valorOverride) || 0)) / 100)}
                  </p>
                )}
              </div>

              {/* AI Assistant Panel */}
              <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Assistente IA
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ai.isLoading}
                    onClick={() => ai.analyze("resumo_solicitacao", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                      status: selectedSolicitacao.status_mesa,
                    })}
                  >
                    {ai.isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Resumo IA
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ai.isLoading}
                    onClick={() => ai.analyze("analise_documentos", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                      tipo_credito: selectedSolicitacao.tipo_credito,
                    })}
                  >
                    <FileSearch className="h-3.5 w-3.5 mr-1" /> Análise Docs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={ai.isLoading}
                    onClick={() => ai.analyze("sugestao_engenheiro", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                    })}
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Sugestão Eng.
                  </Button>
                </div>
                {ai.isLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Analisando com IA...
                  </div>
                )}
                {ai.result && (
                  <div className="rounded-md border bg-background p-3 text-sm prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{ai.result}</ReactMarkdown>
                    <Button size="sm" variant="ghost" className="mt-2 text-xs" onClick={ai.clear}>
                      Fechar análise
                    </Button>
                  </div>
                )}
              </div>

              {/* Notas da mesa */}
              <div className="space-y-2">
                <Label>Notas da Mesa</Label>
                <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} placeholder="Observações sobre documentação, elegibilidade..." />
              </div>

              {/* Atribuição de engenheiro */}
              <div className="space-y-2">
                <Label>Atribuir Engenheiro (opcional)</Label>
                <Select value={engenheiroAtribuidoId || "todos"} onValueChange={(v) => setEngenheiroAtribuidoId(v === "todos" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Abrir para todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Abrir para todos</SelectItem>
                    {engenheiros?.map((eng) => (
                      <SelectItem key={eng.id} value={eng.id}>{eng.nome} (CREA: {eng.crea})</SelectItem>
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
                      <Check className="h-3.5 w-3.5 mr-1" /> Aprovar e Liberar
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
                {/* Toggle document upload for producer */}
                <Button
                  size="sm"
                  variant={selectedSolicitacao.docs_habilitados ? "secondary" : "outline"}
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedSolicitacao.id,
                    status_mesa: selectedSolicitacao.status_mesa,
                    extra: { docs_habilitados: !selectedSolicitacao.docs_habilitados },
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  {selectedSolicitacao.docs_habilitados ? "Docs Liberados ✓" : "Liberar Documentos"}
                </Button>
                {/* Save payment override without changing status */}
                <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_mesa: selectedSolicitacao.status_mesa })} disabled={updateStatusMutation.isPending}>
                  Salvar Alterações
                </Button>
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
