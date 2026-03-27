import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, RotateCcw, CheckCircle2, FileText, History, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

interface Enquadramento {
  produto_sugerido: string;
  capitulo_mcr: string;
  justificativa: string;
  condicoes: string;
  valor_sugerido: string;
}

export default function ChatCredito() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [consultaId, setConsultaId] = useState<string | null>(null);
  const [enquadramento, setEnquadramento] = useState<Enquadramento | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Fetch producer data for context
  const { data: produtorId } = useQuery({
    queryKey: ["produtor_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_produtor_id");
      return data as string;
    },
  });

  const { data: propriedades } = useQuery({
    queryKey: ["propriedades_contexto"],
    queryFn: async () => {
      const { data } = await supabase
        .from("propriedades")
        .select("nome_propriedade, area_total_ha, municipio, uf, tipo_solo, fonte_agua")
        .limit(10);
      return data || [];
    },
  });

  const { data: historicoSolicitacoes } = useQuery({
    queryKey: ["historico_solicitacoes_contexto"],
    queryFn: async () => {
      const { data } = await supabase
        .from("solicitacoes_laudo")
        .select("cultura_principal, valor_solicitado, status_solicitacao, pronaf_produtos(nome)")
        .order("created_at", { ascending: false })
        .limit(5);
      return (data || []).map((s: any) => ({
        produto: s.pronaf_produtos?.nome || "—",
        cultura: s.cultura_principal,
        valor: s.valor_solicitado,
        status: s.status_solicitacao,
      }));
    },
  });

  const { data: pronafProdutos } = useQuery({
    queryKey: ["pronaf_produtos_chat"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pronaf_produtos")
        .select("nome, finalidade, grupo_alvo, limite_valor, juros, carencia, prazo_reembolso, o_que_financia")
        .eq("ativo", true);
      return data || [];
    },
  });

  // Previous enquadramentos
  const { data: consultasAnteriores } = useQuery({
    queryKey: ["consultas_anteriores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("consulta_enquadramento")
        .select("id, status, produto_sugerido_nome, capitulo_mcr, created_at, solicitacao_id")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConsulta = async () => {
    if (!produtorId) return null;
    const { data, error } = await supabase
      .from("consulta_enquadramento")
      .insert({
        produtor_id: produtorId,
        dados_contexto: { propriedades, historico: historicoSolicitacoes },
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  };

  const saveMessage = async (cId: string, role: string, content: string) => {
    await supabase.from("consulta_enquadramento_mensagens").insert({
      consulta_id: cId,
      role,
      content,
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      // Create consulta on first message
      let cId = consultaId;
      if (!cId) {
        cId = await createConsulta();
        setConsultaId(cId);
      }

      // Save user message
      if (cId) await saveMessage(cId, "user", text);

      const { data, error } = await supabase.functions.invoke("chat-credito", {
        body: {
          messages: updated,
          contexto: { propriedades, historico_solicitacoes: historicoSolicitacoes },
          produtos_disponiveis: pronafProdutos,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const assistantContent = data.content;
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);

      // Save assistant message
      if (cId) await saveMessage(cId, "assistant", assistantContent);

      // Check for enquadramento
      if (data.enquadramento) {
        setEnquadramento(data.enquadramento);
        // Save to DB
        if (cId) {
          const produtoMatch = pronafProdutos?.find(
            (p: any) => p.nome.toLowerCase() === data.enquadramento.produto_sugerido.toLowerCase()
          );
          await supabase.from("consulta_enquadramento").update({
            status: "finalizado",
            produto_sugerido_nome: data.enquadramento.produto_sugerido,
            capitulo_mcr: data.enquadramento.capitulo_mcr,
            justificativa: data.enquadramento.justificativa,
            condicoes_resumo: data.enquadramento.condicoes,
            resultado_enquadramento: data.enquadramento,
            pronaf_produto_sugerido_id: produtoMatch ? undefined : null,
            finalizado_em: new Date().toISOString(),
          }).eq("id", cId);
          qc.invalidateQueries({ queryKey: ["consultas_anteriores"] });
        }
      }
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível obter resposta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    setConsultaId(null);
    setEnquadramento(null);
  };

  const handleCreateSolicitacao = () => {
    // Navigate to solicitacoes with enquadramento context
    navigate("/solicitacoes", {
      state: { enquadramentoId: consultaId, enquadramento },
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Consulta MCR</h1>
          <p className="text-sm text-muted-foreground">Assistente de Enquadramento do Crédito Rural</p>
        </div>
        <div className="flex gap-2">
          {(consultasAnteriores?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              Histórico
              {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetChat} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Nova consulta
            </Button>
          )}
        </div>
      </div>

      {/* History panel */}
      {showHistory && consultasAnteriores && consultasAnteriores.length > 0 && (
        <Card className="mb-4 p-4 bg-muted/50">
          <h3 className="text-sm font-semibold mb-2">Consultas anteriores</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {consultasAnteriores.map((c: any) => (
              <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-background">
                <div className="flex items-center gap-2">
                  <Badge variant={c.status === "finalizado" ? "default" : "outline"} className="text-xs">
                    {c.status === "finalizado" ? "Concluído" : "Em andamento"}
                  </Badge>
                  <span className="text-muted-foreground">
                    {c.produto_sugerido_nome || "Sem recomendação"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enquadramento result card */}
      {enquadramento && (
        <Card className="mb-4 p-4 border-green-500/50 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-400">Enquadramento Recomendado</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>Produto:</strong> {enquadramento.produto_sugerido}</p>
                <p><strong>MCR:</strong> {enquadramento.capitulo_mcr}</p>
                <p><strong>Condições:</strong> {enquadramento.condicoes}</p>
                <p className="text-muted-foreground text-xs mt-1">{enquadramento.justificativa}</p>
              </div>
              <Button
                onClick={handleCreateSolicitacao}
                className="mt-3 gap-2 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Criar Solicitação com este Enquadramento
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden bg-background border">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-16 space-y-3">
                <div className="mx-auto h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Bot className="h-7 w-7 text-green-700 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-foreground">Assistente de Enquadramento</p>
                <p className="text-sm max-w-md mx-auto">
                  Vou te ajudar a encontrar o melhor produto PRONAF para sua necessidade. Descreva o que você precisa financiar e eu vou guiar a conversa até chegar no enquadramento ideal.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {[
                    "Preciso financiar custeio de soja",
                    "Quero investir em máquinas",
                    "Financiamento para irrigação",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInput(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-green-700 dark:text-green-400" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                    m.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content.replace(/```enquadramento[\s\S]*?```/g, "")}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-1">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analisando...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4 flex gap-2 bg-background">
          <Input
            placeholder="Descreva o que você precisa financiar..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            disabled={isLoading}
            className="rounded-full"
          />
          <Button
            onClick={send}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full bg-green-600 hover:bg-green-700 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
