import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Clock, CheckCircle2, AlertCircle, Send, Landmark, Eye,
} from "lucide-react";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
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
    queryKey: ["banco_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade), laudos(id, status_laudo), pronaf_produtos(nome)")
        .order("created_at", { ascending: false });
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

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const counts = {
    total: solicitacoes?.length ?? 0,
    enviado: solicitacoes?.filter((s) => s.status_banco === "enviado").length ?? 0,
    aprovado: solicitacoes?.filter((s) => s.status_banco === "aprovado").length ?? 0,
    devolvido: solicitacoes?.filter((s) => s.status_banco === "devolvido").length ?? 0,
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
            <p className="text-muted-foreground">Nenhuma solicitação vinculada.</p>
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
                    <Button size="sm" variant="ghost" onClick={() => setDetail(s)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="font-medium">Propriedade:</span> {(detail as any).propriedades?.nome_propriedade}</div>
                <div><span className="font-medium">Produto:</span> {(detail as any).pronaf_produtos?.nome ?? "—"}</div>
                <div><span className="font-medium">Valor Solicitado:</span> {formatCurrency(detail.valor_solicitado)}</div>
                <div><span className="font-medium">Cultura:</span> {detail.cultura_principal}</div>
                <div><span className="font-medium">Área:</span> {detail.area_cultivo_ha} ha</div>
                <div>
                  <span className="font-medium">Status Banco:</span>{" "}
                  <Badge variant={statusBancoMap[detail.status_banco]?.variant ?? "outline"}>
                    {statusBancoMap[detail.status_banco]?.label ?? detail.status_banco}
                  </Badge>
                </div>
              </div>

              {detail.observacoes_banco && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <span className="font-medium">Observações do banco:</span> {detail.observacoes_banco}
                </div>
              )}

              {/* Timeline */}
              {detail && (
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Linha do Tempo</h4>
                  <StatusTimeline solicitacao={detail} laudo={(detail as any).laudos?.[0]} />
                </div>
              )}

              {/* Chat */}
              <div className="border-t pt-3">
                <h4 className="text-sm font-medium mb-2">Chat com a Mesa</h4>
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
                        <p className="text-[10px] opacity-70 mb-0.5">{msg.remetente_role}</p>
                        {msg.audio_url ? <AudioPlayer src={msg.audio_url} /> : <p>{msg.mensagem}</p>}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
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
