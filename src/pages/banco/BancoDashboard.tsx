import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Clock, CheckCircle2, AlertCircle, Send, Landmark, Eye,
  Download, File, XCircle, RotateCcw,
} from "lucide-react";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
import OrcamentoCusteio from "@/components/solicitacoes/OrcamentoCusteio";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { AudioPlayer } from "@/components/chat/AudioPlayer";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise_mesa: { label: "Em Análise", variant: "secondary" },
  docs_pendentes_produtor: { label: "Docs Pendentes", variant: "outline" },
  docs_em_validacao: { label: "Validando Docs", variant: "secondary" },
  elegivel: { label: "Elegível", variant: "secondary" },
  reprovada: { label: "Reprovada", variant: "destructive" },
  aguardando_laudo: { label: "Aguard. Laudo", variant: "secondary" },
  pronta_para_banco: { label: "Pronta p/ Banco", variant: "default" },
};

const statusBancoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  nao_enviado: { label: "Não Enviado", variant: "outline" },
  enviado: { label: "Enviado", variant: "secondary" },
  devolvido: { label: "Devolvido", variant: "destructive" },
  aprovado: { label: "Aprovado", variant: "default" },
  reprovado: { label: "Reprovado", variant: "destructive" },
};

export default function BancoDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [detail, setDetail] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [observacoesBanco, setObservacoesBanco] = useState("");

  const { data: bancoInfo } = useQuery({
    queryKey: ["banco_usuario_info"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banco_usuarios")
        .select("*, bancos_parceiros(nome, codigo)")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["banco_solicitacoes", bancoInfo?.banco_parceiro_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade, municipio, uf, area_total_ha, codigo_car), laudos(id, status_laudo, parecer_final, caminho_pdf_laudo), pronaf_produtos(nome, finalidade, limite_valor, juros, prazo_reembolso)")
        .eq("banco_parceiro_id", bancoInfo!.banco_parceiro_id)
        .neq("status_banco", "nao_enviado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bancoInfo?.banco_parceiro_id,
  });

  // Documents for selected solicitation
  const { data: documentos } = useQuery({
    queryKey: ["banco_docs", detail?.id],
    enabled: !!detail,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_documentos")
        .select("*, pronaf_documentos(nome_documento)")
        .eq("solicitacao_id", detail.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Shared group documents
  const { data: grupoDocumentos } = useQuery({
    queryKey: ["banco_grupo_docs", detail?.grupo_id],
    enabled: !!detail?.grupo_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupo_documentos_compartilhados")
        .select("*, pronaf_documentos(nome_documento)")
        .eq("grupo_id", detail.grupo_id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["banco_chat", detail?.id],
    enabled: !!detail,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_mensagens")
        .select("*")
        .eq("solicitacao_id", detail.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Update status banco mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status_banco }: { id: string; status_banco: string }) => {
      const updates: any = {
        status_banco,
        observacoes_banco: observacoesBanco || null,
        data_retorno_banco: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("solicitacoes_laudo")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banco_solicitacoes"] });
      toast({ title: "Status atualizado com sucesso" });
      setObservacoesBanco("");
      setDetail(null);
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ audioUrl }: { audioUrl?: string } = {}) => {
      const { error } = await supabase.from("chat_mensagens").insert({
        solicitacao_id: detail.id,
        remetente_id: user!.id,
        remetente_role: "banco",
        mensagem: audioUrl ? "🎤 Mensagem de áudio" : chatMessage,
        audio_url: audioUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banco_chat", detail?.id] });
      setChatMessage("");
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const handleAudioComplete = async (blob: Blob) => {
    setIsUploadingAudio(true);
    try {
      const fileName = `${user!.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("chat-audio").upload(fileName, blob);
      if (uploadError) throw uploadError;
      const { data } = await supabase.storage.from("chat-audio").createSignedUrl(fileName, 86400 * 365);
      if (data?.signedUrl) sendChatMutation.mutate({ audioUrl: data.signedUrl });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleDownloadDoc = async (caminho: string, nome: string) => {
    try {
      const { data, error } = await supabase.storage.from("solicitacao-docs").createSignedUrl(caminho, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      toast({ title: "Erro ao baixar", description: err.message, variant: "destructive" });
    }
  };

  const openDetail = (s: any) => {
    setDetail(s);
    setObservacoesBanco(s.observacoes_banco || "");
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const counts = {
    total: solicitacoes?.length ?? 0,
    enviado: solicitacoes?.filter((s) => s.status_banco === "enviado").length ?? 0,
    aprovado: solicitacoes?.filter((s) => s.status_banco === "aprovado").length ?? 0,
    devolvido: solicitacoes?.filter((s) => s.status_banco === "devolvido").length ?? 0,
  };

  const allDocs = [
    ...(grupoDocumentos?.map((d: any) => ({
      id: d.id,
      nome: d.pronaf_documentos?.nome_documento || d.nome_documento || d.nome_arquivo,
      arquivo: d.nome_arquivo,
      caminho: d.caminho_arquivo,
      status: d.status_documento,
      tipo: "grupo",
    })) ?? []),
    ...(documentos?.map((d: any) => ({
      id: d.id,
      nome: d.pronaf_documentos?.nome_documento || d.nome_arquivo,
      arquivo: d.nome_arquivo,
      caminho: d.caminho_arquivo,
      status: d.status_documento,
      tipo: "individual",
    })) ?? []),
  ];

  const statusDocBadge = (status: string) => {
    switch (status) {
      case "validado": return <Badge variant="default" className="text-xs">Validado</Badge>;
      case "recusado": return <Badge variant="destructive" className="text-xs">Recusado</Badge>;
      default: return <Badge variant="outline" className="text-xs">Enviado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Landmark className="h-6 w-6" />
          Painel do Banco
        </h1>
        <p className="text-muted-foreground">
          {bancoInfo?.bancos_parceiros?.nome ?? "Carregando..."} — Acompanhe os projetos vinculados.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{counts.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Enviados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-secondary-foreground">{counts.enviado}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aprovados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{counts.aprovado}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Devolvidos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{counts.devolvido}</p></CardContent></Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !solicitacoes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma solicitação enviada pela mesa.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propriedade</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status Projeto</TableHead>
                <TableHead>Status Banco</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{(s as any).propriedades?.nome_propriedade}</TableCell>
                  <TableCell>{(s as any).pronaf_produtos?.nome ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(s.valor_solicitado)}</TableCell>
                  <TableCell>
                    <Badge variant={statusMap[s.status_solicitacao]?.variant ?? "outline"}>
                      {statusMap[s.status_solicitacao]?.label ?? s.status_solicitacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBancoMap[s.status_banco]?.variant ?? "outline"}>
                      {statusBancoMap[s.status_banco]?.label ?? s.status_banco}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openDetail(s)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-5">
              {/* Info grid */}
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="font-medium">Propriedade:</span> {(detail as any).propriedades?.nome_propriedade}</div>
                <div><span className="font-medium">Município/UF:</span> {(detail as any).propriedades?.municipio}/{(detail as any).propriedades?.uf}</div>
                <div><span className="font-medium">Área Total:</span> {(detail as any).propriedades?.area_total_ha} ha</div>
                <div><span className="font-medium">CAR:</span> {(detail as any).propriedades?.codigo_car || "—"}</div>
                <div><span className="font-medium">Produto:</span> {(detail as any).pronaf_produtos?.nome ?? "—"}</div>
                <div><span className="font-medium">Finalidade:</span> {(detail as any).pronaf_produtos?.finalidade ?? "—"}</div>
                <div><span className="font-medium">Valor Solicitado:</span> {formatCurrency(detail.valor_solicitado)}</div>
                <div><span className="font-medium">Cultura:</span> {detail.cultura_principal}</div>
                <div><span className="font-medium">Área Cultivo:</span> {detail.area_cultivo_ha} ha</div>
                <div><span className="font-medium">Juros:</span> {(detail as any).pronaf_produtos?.juros || "—"}</div>
                <div><span className="font-medium">Limite:</span> {(detail as any).pronaf_produtos?.limite_valor || "—"}</div>
                <div><span className="font-medium">Prazo:</span> {(detail as any).pronaf_produtos?.prazo_reembolso || "—"}</div>
                <div>
                  <span className="font-medium">Status Banco:</span>{" "}
                  <Badge variant={statusBancoMap[detail.status_banco]?.variant ?? "outline"}>
                    {statusBancoMap[detail.status_banco]?.label ?? detail.status_banco}
                  </Badge>
                </div>
              </div>

              {/* Laudo info */}
              {(detail as any).laudos?.length > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <h4 className="font-medium">Laudo Técnico</h4>
                  <p>Status: <Badge variant="secondary">{(detail as any).laudos[0].status_laudo}</Badge></p>
                  {(detail as any).laudos[0].parecer_final && (
                    <p><span className="font-medium">Parecer:</span> {(detail as any).laudos[0].parecer_final}</p>
                  )}
                </div>
              )}

              {/* Documents section */}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Documentação ({allDocs.length})
                </h4>
                {allDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
                ) : (
                  <div className="space-y-1.5">
                    {allDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{doc.nome}</span>
                          {statusDocBadge(doc.status)}
                          {doc.tipo === "grupo" && <Badge variant="outline" className="text-[10px]">Compartilhado</Badge>}
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => handleDownloadDoc(doc.caminho, doc.arquivo)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Orçamento custeio */}
              {detail.tipo_credito === "custeio" && (
                <OrcamentoCusteio
                  solicitacaoId={detail.id}
                  culturaPrincipal={detail.cultura_principal}
                  readOnly
                />
              )}

              {/* Timeline */}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Linha do Tempo</h4>
                <StatusTimeline solicitacao={detail} laudo={(detail as any).laudos?.[0]} />
              </div>

              {/* Bank actions */}
              {detail.status_banco === "enviado" && (
                <div className="border-t pt-3 space-y-3">
                  <h4 className="text-sm font-medium">Ação do Banco</h4>
                  <div className="space-y-2">
                    <Label>Observações / Justificativa</Label>
                    <Textarea
                      value={observacoesBanco}
                      onChange={(e) => setObservacoesBanco(e.target.value)}
                      placeholder="Descreva a justificativa para aprovação, reprovação ou devolução..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="default"
                      onClick={() => updateStatusMutation.mutate({ id: detail.id, status_banco: "aprovado" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: detail.id, status_banco: "devolvido" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" /> Devolver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateStatusMutation.mutate({ id: detail.id, status_banco: "reprovado" })}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Reprovar
                    </Button>
                  </div>
                </div>
              )}

              {detail.observacoes_banco && detail.status_banco !== "enviado" && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">Observações do banco:</span> {detail.observacoes_banco}
                </div>
              )}

              {/* Chat banco ↔ mesa */}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Comunicação com a Mesa</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-3 rounded border p-2">
                  {!chatMessages?.length ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem.</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                          msg.remetente_id === user?.id
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-[10px] opacity-70 mb-0.5">
                          {msg.remetente_role === "banco" ? "Banco" : msg.remetente_role === "mesa_produtos" ? "Mesa" : msg.remetente_role}
                        </p>
                        {msg.audio_url ? <AudioPlayer src={msg.audio_url} /> : <p>{msg.mensagem}</p>}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem para a mesa..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && chatMessage.trim()) sendChatMutation.mutate({});
                    }}
                  />
                  <AudioRecorder onRecordingComplete={handleAudioComplete} disabled={isUploadingAudio} />
                  <Button
                    size="icon"
                    onClick={() => chatMessage.trim() && sendChatMutation.mutate({})}
                    disabled={!chatMessage.trim() || sendChatMutation.isPending}
                  >
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
