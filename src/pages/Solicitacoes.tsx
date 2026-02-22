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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Plus, Clock, CheckCircle2, AlertCircle, Download, Info,
  Upload, Trash2, Eye, ShieldCheck, Banknote, FileWarning, MessageCircle, Send, Video, MapPin, Pencil,
  UserCheck, Search, HelpCircle, Layers,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import ProductRulesCard from "@/components/solicitacoes/ProductRulesCard";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
import OrcamentoCusteio from "@/components/solicitacoes/OrcamentoCusteio";

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

interface ProdutoDados {
  cultura_principal: string;
  area_cultivo_ha: string;
  valor_solicitado: string;
}

const emptyProdutoDados: ProdutoDados = {
  cultura_principal: "",
  area_cultivo_ha: "",
  valor_solicitado: "",
};

interface SolicitacaoForm {
  propriedade_id: string;
  pronaf_produto_ids: string[];
  produto_dados: Record<string, ProdutoDados>;
  banco_parceiro_id: string;
  observacoes_produtor: string;
}

const emptyForm: SolicitacaoForm = {
  propriedade_id: "",
  pronaf_produto_ids: [],
  produto_dados: {},
  banco_parceiro_id: "",
  observacoes_produtor: "",
};

export default function Solicitacoes() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailSolicitacao, setDetailSolicitacao] = useState<any | null>(null);
  const [form, setForm] = useState<SolicitacaoForm>(emptyForm);
  const [chatMessage, setChatMessage] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [modoAssistido, setModoAssistido] = useState(false);
  const [engenheiroAssistenteId, setEngenheiroAssistenteId] = useState("");
  const [buscaEngenheiro, setBuscaEngenheiro] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: produtorId } = useQuery({
    queryKey: ["produtor_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_produtor_id");
      return data as string;
    },
  });

  const { data: propriedades } = useQuery({
    queryKey: ["propriedades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("propriedades").select("id, nome_propriedade, regiao_id, regioes(uf)").order("nome_propriedade");
      if (error) throw error;
      return data;
    },
  });

  const { data: pronafProdutos } = useQuery({
    queryKey: ["pronaf_produtos_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: bancosParceiros } = useQuery({
    queryKey: ["bancos_parceiros_ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bancos_parceiros")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: blacklistStatus } = useQuery({
    queryKey: ["produtor_blacklist", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blacklist")
        .select("id")
        .eq("user_id", user!.id)
        .eq("ativo", true)
        .eq("tipo", "produtor")
        .limit(1);
      if (error) throw error;
      return data && data.length > 0;
    },
  });

  // Engineers for assisted mode
  const { data: engenheirosDisponiveis } = useQuery({
    queryKey: ["engenheiros_disponiveis"],
    enabled: modoAssistido,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engenheiros")
        .select("id, crea, user_id, area_atuacao, regiao_id, tipo_licenca, numero_licenca, raio_atendimento_km, rating, total_laudos_concluidos")
        .eq("status_verificacao", "aprovado");
      if (error) throw error;
      if (!data?.length) return [];
      const userIds = data.map((e) => e.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", userIds);
      const { data: regioes } = await supabase.from("regioes").select("id, nome, uf");
      return data.map((e) => ({
        ...e,
        nome: profiles?.find((p) => p.id === e.user_id)?.nome || "—",
        regiao_nome: regioes?.find((r) => r.id === e.regiao_id)?.nome || "",
        regiao_uf: regioes?.find((r) => r.id === e.regiao_id)?.uf || "",
      }));
    },
  });

  // Get all required docs for selected products
  const { data: pronafDocumentos } = useQuery({
    queryKey: ["pronaf_documentos_multi", form.pronaf_produto_ids],
    enabled: form.pronaf_produto_ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_documentos")
        .select("*")
        .in("produto_id", form.pronaf_produto_ids)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  // Get UF from selected property
  const selectedPropUf = (() => {
    if (!form.propriedade_id || !propriedades) return null;
    const prop = propriedades.find((p) => p.id === form.propriedade_id);
    return (prop as any)?.regioes?.uf ?? null;
  })();

  // Regional rules for selected products + UF
  const { data: regrasRegionais } = useQuery({
    queryKey: ["regras_regionais_multi", form.pronaf_produto_ids, selectedPropUf],
    enabled: form.pronaf_produto_ids.length > 0 && !!selectedPropUf,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("produto_regras_regionais")
        .select("*")
        .in("produto_id", form.pronaf_produto_ids)
        .eq("uf", selectedPropUf)
        .eq("ativo", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade), laudos(id, status_laudo, caminho_pdf_laudo), pronaf_produtos(*), bancos_parceiros(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Group solicitações by grupo_id for display
  const groupedSolicitacoes = (() => {
    if (!solicitacoes) return { groups: [], standalone: [] };
    const grupoMap = new Map<string, any[]>();
    const standalone: any[] = [];
    for (const s of solicitacoes) {
      const gid = (s as any).grupo_id;
      if (gid) {
        if (!grupoMap.has(gid)) grupoMap.set(gid, []);
        grupoMap.get(gid)!.push(s);
      } else {
        standalone.push(s);
      }
    }
    return { groups: Array.from(grupoMap.entries()), standalone };
  })();

  // Detail: docs for selected solicitation's product
  const { data: detailPronafDocs } = useQuery({
    queryKey: ["pronaf_documentos_detail", detailSolicitacao?.pronaf_produto_id],
    enabled: !!detailSolicitacao?.pronaf_produto_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_documentos")
        .select("*")
        .eq("produto_id", detailSolicitacao.pronaf_produto_id)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  // Uploaded documents for the detail solicitation
  const { data: uploadedDocs } = useQuery({
    queryKey: ["solicitacao_documentos", detailSolicitacao?.id],
    enabled: !!detailSolicitacao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_documentos")
        .select("*")
        .eq("solicitacao_id", detailSolicitacao.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const parseCurrency = (v: string) => {
    const raw = v.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(raw) || 0;
  };

  const formatToCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const selectedProdutos = pronafProdutos?.filter((p) => form.pronaf_produto_ids.includes(p.id)) ?? [];

  // Helper to get per-product data
  const getProdutoDados = (produtoId: string): ProdutoDados =>
    form.produto_dados[produtoId] || emptyProdutoDados;

  const setProdutoDados = (produtoId: string, field: keyof ProdutoDados, value: string) => {
    setForm((f) => ({
      ...f,
      produto_dados: {
        ...f.produto_dados,
        [produtoId]: {
          ...(f.produto_dados[produtoId] || emptyProdutoDados),
          [field]: value,
        },
      },
    }));
  };

  const getCulturaPrincipalValue = (produtoId: string) => {
    const cultura = getProdutoDados(produtoId).cultura_principal;
    return cultura.startsWith("__outro:")
      ? cultura.replace("__outro:", "").toUpperCase().trim()
      : cultura;
  };

  // Calculate total engineer payment across selected products
  const totalValorEngenheiro = selectedProdutos.reduce((sum, prod) => {
    const dados = getProdutoDados(prod.id);
    if (prod.tipo_valor_engenheiro === "percentual") {
      return sum + parseCurrency(dados.valor_solicitado) * (prod.valor_engenheiro / 100);
    }
    return sum + prod.valor_engenheiro;
  }, 0);

  // Deduplicate docs across selected products
  const uniqueDocs = (() => {
    if (!pronafDocumentos) return [];
    const seen = new Set<string>();
    return pronafDocumentos.filter((doc) => {
      const key = doc.nome_documento.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        // Edit mode: only for single product (legacy)
        const produto = selectedProdutos[0];
        const dados = getProdutoDados(produto?.id || "");
        const valorPagEng = produto
          ? produto.tipo_valor_engenheiro === "percentual"
            ? parseCurrency(dados.valor_solicitado) * (produto.valor_engenheiro / 100)
            : produto.valor_engenheiro
          : 0;
        const { error } = await supabase.from("solicitacoes_laudo").update({
          propriedade_id: form.propriedade_id,
          pronaf_produto_id: form.pronaf_produto_ids[0] || null,
          tipo_credito: produto?.finalidade || "custeio",
          cultura_principal: getCulturaPrincipalValue(produto?.id || ""),
          area_cultivo_ha: parseFloat(dados.area_cultivo_ha) || 0,
          valor_solicitado: parseCurrency(dados.valor_solicitado),
          valor_pagamento_engenheiro: valorPagEng,
          banco_parceiro_id: form.banco_parceiro_id || null,
          banco_destino: bancosParceiros?.find((b) => b.id === form.banco_parceiro_id)?.nome || "",
          observacoes_produtor: form.observacoes_produtor,
        }).eq("id", editId);
        if (error) throw error;
      } else {
        // New: create grupo + sub-solicitações
        const grupoData: any = {
          produtor_id: produtorId!,
          propriedade_id: form.propriedade_id,
          observacoes_produtor: form.observacoes_produtor,
          assistido: modoAssistido && !!engenheiroAssistenteId,
          engenheiro_assistente_id: modoAssistido && engenheiroAssistenteId ? engenheiroAssistenteId : null,
        };

        const { data: grupo, error: grupoError } = await supabase
          .from("grupos_solicitacao")
          .insert(grupoData)
          .select("id")
          .single();
        if (grupoError) throw grupoError;

        // Create one sub-solicitação per product with per-product data
        const subInserts = selectedProdutos.map((produto) => {
          const dados = getProdutoDados(produto.id);
          const valorPagEng = produto.tipo_valor_engenheiro === "percentual"
            ? parseCurrency(dados.valor_solicitado) * (produto.valor_engenheiro / 100)
            : produto.valor_engenheiro;

          return {
            grupo_id: grupo.id,
            produtor_id: produtorId!,
            propriedade_id: form.propriedade_id,
            pronaf_produto_id: produto.id,
            tipo_credito: produto.finalidade || "custeio",
            cultura_principal: getCulturaPrincipalValue(produto.id),
            area_cultivo_ha: parseFloat(dados.area_cultivo_ha) || 0,
            valor_solicitado: parseCurrency(dados.valor_solicitado),
            valor_pagamento_engenheiro: valorPagEng,
            banco_parceiro_id: form.banco_parceiro_id || null,
            banco_destino: bancosParceiros?.find((b) => b.id === form.banco_parceiro_id)?.nome || "",
            observacoes_produtor: form.observacoes_produtor,
            assistido: modoAssistido && !!engenheiroAssistenteId,
            engenheiro_assistente_id: modoAssistido && engenheiroAssistenteId ? engenheiroAssistenteId : null,
          };
        });

        const { error: subError } = await supabase.from("solicitacoes_laudo").insert(subInserts);
        if (subError) throw subError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast({ title: editId ? "Solicitação atualizada!" : "Solicitação criada com sucesso!" });
      setForm(emptyForm);
      setEditId(null);
      setModoAssistido(false);
      setEngenheiroAssistenteId("");
      setBuscaEngenheiro("");
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ file, pronafDocId }: { file: File; pronafDocId?: string }) => {
      const path = `${detailSolicitacao.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("solicitacao-docs").upload(path, file);
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("solicitacao_documentos").insert({
        solicitacao_id: detailSolicitacao.id,
        pronaf_documento_id: pronafDocId || null,
        nome_arquivo: file.name,
        caminho_arquivo: path,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacao_documentos", detailSolicitacao?.id] });
      toast({ title: "Documento enviado!" });
    },
    onError: (err: Error) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("solicitacao-docs").remove([doc.caminho_arquivo]);
      const { error } = await supabase.from("solicitacao_documentos").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacao_documentos", detailSolicitacao?.id] });
      toast({ title: "Documento removido." });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // Chat queries & mutations
  const { data: chatMessages } = useQuery({
    queryKey: ["chat_produtor", detailSolicitacao?.id],
    enabled: !!detailSolicitacao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_mensagens")
        .select("*")
        .eq("solicitacao_id", detailSolicitacao.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ audioUrl }: { audioUrl?: string } = {}) => {
      const { error } = await supabase.from("chat_mensagens").insert({
        solicitacao_id: detailSolicitacao.id,
        remetente_id: user!.id,
        remetente_role: "produtor",
        mensagem: audioUrl ? "🎤 Mensagem de áudio" : chatMessage,
        audio_url: audioUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat_produtor", detailSolicitacao?.id] });
      setChatMessage("");
    },
    onError: (err: Error) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
  });

  const handleAudioComplete = async (blob: Blob) => {
    setIsUploadingAudio(true);
    try {
      const fileName = `${user!.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage.from("chat-audio").upload(fileName, blob);
      if (uploadError) throw uploadError;
      const { data } = await supabase.storage.from("chat-audio").createSignedUrl(fileName, 86400 * 365);
      if (data?.signedUrl) {
        sendChatMutation.mutate({ audioUrl: data.signedUrl });
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar áudio", description: err.message, variant: "destructive" });
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pronta_para_banco") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "reprovada") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const handleFileUpload = (pronafDocId?: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadDocMutation.mutate({ file, pronafDocId });
    };
    input.click();
  };

  const toggleProduto = (produtoId: string) => {
    setForm((f) => {
      const isRemoving = f.pronaf_produto_ids.includes(produtoId);
      const newIds = isRemoving
        ? f.pronaf_produto_ids.filter((id) => id !== produtoId)
        : [...f.pronaf_produto_ids, produtoId];
      const newDados = { ...f.produto_dados };
      if (isRemoving) {
        delete newDados[produtoId];
      } else if (!newDados[produtoId]) {
        newDados[produtoId] = { ...emptyProdutoDados };
      }
      return { ...f, pronaf_produto_ids: newIds, produto_dados: newDados };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Minhas Solicitações</h1>
          <p className="text-muted-foreground">Acompanhe suas solicitações de laudo.</p>
          {blacklistStatus === true && (
            <p className="text-sm text-destructive font-medium mt-1">⚠ Sua conta está suspensa. Você não pode criar novas solicitações.</p>
          )}
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditId(null); setForm(emptyForm); } setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!propriedades?.length || blacklistStatus === true}>
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">{editId ? "Editar Solicitação" : "Nova Solicitação de Laudo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Propriedade *</Label>
                <Select value={form.propriedade_id} onValueChange={(v) => setForm((f) => ({ ...f, propriedade_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {propriedades?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome_propriedade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-product selection */}
              <div className="space-y-2">
                <Label>Produtos PRONAF * <span className="text-xs text-muted-foreground font-normal">(selecione um ou mais)</span></Label>
                <div className="border rounded-md p-2 max-h-52 overflow-y-auto space-y-1">
                  {pronafProdutos?.map((p) => {
                    const isSelected = form.pronaf_produto_ids.includes(p.id);
                    const precoLabel = p.tipo_valor_engenheiro === "percentual"
                      ? `${p.valor_engenheiro}% do valor`
                      : formatCurrency(p.valor_engenheiro);
                    return (
                      <label
                        key={p.id}
                        className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduto(p.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{p.nome}</span>
                            <Badge variant="outline" className="text-xs">{p.finalidade}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {p.grupo_alvo && <span>{p.grupo_alvo}</span>}
                            <span className="flex items-center gap-1">
                              <Banknote className="h-3 w-3" /> Laudo: {precoLabel}
                            </span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {form.pronaf_produto_ids.length > 1 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {form.pronaf_produto_ids.length} produtos selecionados — serão criadas sub-solicitações agrupadas.
                  </p>
                )}
              </div>

              {/* Product rules cards */}
              {selectedProdutos.map((produto) => (
                <ProductRulesCard
                  key={produto.id}
                  produto={produto}
                  valorSolicitado={parseCurrency(getProdutoDados(produto.id).valor_solicitado)}
                />
              ))}

              {/* Deduplicated required documents */}
              {uniqueDocs.length > 0 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4 text-primary" />
                    Documentação exigida (consolidada):
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                    {uniqueDocs.map((doc) => (
                      <li key={doc.id}>
                        {doc.nome_documento}
                        {doc.obrigatorio && <span className="text-destructive ml-1">*</span>}
                        {doc.descricao && <span className="text-xs block text-muted-foreground/70">{doc.descricao}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Regional rules */}
              {regrasRegionais && (regrasRegionais as any[]).length > 0 && (
                <div className="rounded-md border border-accent/30 bg-accent/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-accent-foreground" />
                    Exigências adicionais para UF {selectedPropUf}:
                  </div>
                  {(regrasRegionais as any[]).map((regra: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      {(regra.campos_obrigatorios as string[])?.length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1 pl-6 list-disc">
                          {(regra.campos_obrigatorios as string[]).map((campo: string) => {
                            const labels: Record<string, string> = {
                              codigo_car: "CAR (Cadastro Ambiental Rural)",
                              titulo_posse: "Título de Posse / Escritura",
                              licenca_ambiental: "Licença Ambiental",
                              outorga_agua: "Outorga de Uso de Água",
                              dap_caf: "DAP/CAF",
                              geo_referenciamento: "Georreferenciamento",
                              plano_manejo: "Plano de Manejo",
                              ater: "Declaração ATER",
                            };
                            return <li key={campo}>{labels[campo] ?? campo} <span className="text-destructive">*</span></li>;
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Per-product fields: cultura, área, valor */}
              {selectedProdutos.length > 0 && (
                <div className="space-y-4">
                  {selectedProdutos.map((produto) => {
                    const dados = getProdutoDados(produto.id);
                    const precoLabel = produto.tipo_valor_engenheiro === "percentual"
                      ? `${produto.valor_engenheiro}% do valor`
                      : formatCurrency(produto.valor_engenheiro);
                    return (
                      <div key={produto.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{produto.nome}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Banknote className="h-3 w-3" /> Laudo: {precoLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Atividade / Cultura *</Label>
                            <Select
                              value={dados.cultura_principal.startsWith("__outro:") ? "__outro" : dados.cultura_principal}
                              onValueChange={(v) => {
                                if (v === "__outro") {
                                  setProdutoDados(produto.id, "cultura_principal", "__outro:");
                                } else {
                                  setProdutoDados(produto.id, "cultura_principal", v);
                                }
                              }}
                            >
                              <SelectTrigger className="h-9"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__label_graos" disabled className="font-semibold text-xs text-muted-foreground">— Grãos e Cereais —</SelectItem>
                                <SelectItem value="Soja">Soja</SelectItem>
                                <SelectItem value="Milho">Milho</SelectItem>
                                <SelectItem value="Arroz">Arroz</SelectItem>
                                <SelectItem value="Feijão">Feijão</SelectItem>
                                <SelectItem value="Trigo">Trigo</SelectItem>
                                <SelectItem value="Sorgo">Sorgo</SelectItem>
                                <SelectItem value="Aveia">Aveia</SelectItem>
                                <SelectItem value="Cevada">Cevada</SelectItem>
                                <SelectItem value="__label_hortifruti" disabled className="font-semibold text-xs text-muted-foreground">— Hortifrutigranjeiros —</SelectItem>
                                <SelectItem value="Mandioca">Mandioca</SelectItem>
                                <SelectItem value="Batata">Batata</SelectItem>
                                <SelectItem value="Tomate">Tomate</SelectItem>
                                <SelectItem value="Cebola">Cebola</SelectItem>
                                <SelectItem value="Alho">Alho</SelectItem>
                                <SelectItem value="Hortaliças (diversas)">Hortaliças (diversas)</SelectItem>
                                <SelectItem value="Frutas (diversas)">Frutas (diversas)</SelectItem>
                                <SelectItem value="Banana">Banana</SelectItem>
                                <SelectItem value="Laranja">Laranja</SelectItem>
                                <SelectItem value="Uva">Uva</SelectItem>
                                <SelectItem value="Maçã">Maçã</SelectItem>
                                <SelectItem value="Manga">Manga</SelectItem>
                                <SelectItem value="Açaí">Açaí</SelectItem>
                                <SelectItem value="__label_industriais" disabled className="font-semibold text-xs text-muted-foreground">— Culturas Industriais —</SelectItem>
                                <SelectItem value="Café">Café</SelectItem>
                                <SelectItem value="Cana-de-açúcar">Cana-de-açúcar</SelectItem>
                                <SelectItem value="Algodão">Algodão</SelectItem>
                                <SelectItem value="Tabaco">Tabaco</SelectItem>
                                <SelectItem value="Cacau">Cacau</SelectItem>
                                <SelectItem value="Dendê / Palma">Dendê / Palma</SelectItem>
                                <SelectItem value="Borracha / Seringueira">Borracha / Seringueira</SelectItem>
                                <SelectItem value="__label_pecuaria" disabled className="font-semibold text-xs text-muted-foreground">— Pecuária —</SelectItem>
                                <SelectItem value="Bovinocultura de corte">Bovinocultura de corte</SelectItem>
                                <SelectItem value="Bovinocultura de leite">Bovinocultura de leite</SelectItem>
                                <SelectItem value="Suinocultura">Suinocultura</SelectItem>
                                <SelectItem value="Avicultura">Avicultura</SelectItem>
                                <SelectItem value="Ovinocultura">Ovinocultura</SelectItem>
                                <SelectItem value="Caprinocultura">Caprinocultura</SelectItem>
                                <SelectItem value="Apicultura">Apicultura</SelectItem>
                                <SelectItem value="Equinocultura">Equinocultura</SelectItem>
                                <SelectItem value="Bubalinocultura">Bubalinocultura</SelectItem>
                                <SelectItem value="__label_aqui" disabled className="font-semibold text-xs text-muted-foreground">— Aquicultura e Pesca —</SelectItem>
                                <SelectItem value="Piscicultura">Piscicultura</SelectItem>
                                <SelectItem value="Carcinicultura">Carcinicultura</SelectItem>
                                <SelectItem value="Aquicultura (outros)">Aquicultura (outros)</SelectItem>
                                <SelectItem value="__label_florestal" disabled className="font-semibold text-xs text-muted-foreground">— Florestal —</SelectItem>
                                <SelectItem value="Eucalipto">Eucalipto</SelectItem>
                                <SelectItem value="Pinus">Pinus</SelectItem>
                                <SelectItem value="Teca">Teca</SelectItem>
                                <SelectItem value="Reflorestamento (outros)">Reflorestamento (outros)</SelectItem>
                                <SelectItem value="Extrativismo vegetal">Extrativismo vegetal</SelectItem>
                                <SelectItem value="__label_outros" disabled className="font-semibold text-xs text-muted-foreground">— Outros —</SelectItem>
                                <SelectItem value="Pastagem / Formação de pasto">Pastagem / Formação de pasto</SelectItem>
                                <SelectItem value="Irrigação">Irrigação</SelectItem>
                                <SelectItem value="Agroindústria">Agroindústria</SelectItem>
                                <SelectItem value="Energia solar / Bioenergia">Energia solar / Bioenergia</SelectItem>
                                <SelectItem value="Infraestrutura rural">Infraestrutura rural</SelectItem>
                                <SelectItem value="__outro">Outro (digitar)</SelectItem>
                              </SelectContent>
                            </Select>
                            {dados.cultura_principal.startsWith("__outro:") && (
                              <Input
                                className="uppercase h-9"
                                placeholder="Digite a atividade / cultura"
                                value={dados.cultura_principal.replace("__outro:", "")}
                                onChange={(e) => setProdutoDados(produto.id, "cultura_principal", `__outro:${e.target.value}`)}
                                required
                              />
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Área de cultivo (ha) *</Label>
                            <Input
                              className="h-9"
                              type="number"
                              step="0.01"
                              value={dados.area_cultivo_ha}
                              onChange={(e) => setProdutoDados(produto.id, "area_cultivo_ha", e.target.value)}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Valor solicitado (R$) *</Label>
                          <Input
                            className="h-9"
                            type="text"
                            inputMode="numeric"
                            placeholder="R$ 0,00"
                            value={dados.valor_solicitado}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              const cents = parseInt(raw || "0", 10);
                              const formatted = new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(cents / 100);
                              setProdutoDados(produto.id, "valor_solicitado", formatted);
                            }}
                            required
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Label>Banco destino</Label>
                <Select value={form.banco_parceiro_id} onValueChange={(v) => setForm((f) => ({ ...f, banco_parceiro_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione o banco..." /></SelectTrigger>
                  <SelectContent>
                    {bancosParceiros?.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProdutos.length > 0 && totalValorEngenheiro > 0 && (
                <div className="text-sm text-muted-foreground bg-muted rounded-md p-2 space-y-1">
                  <p>Valor estimado total dos laudos: <strong className="text-foreground">{formatCurrency(totalValorEngenheiro)}</strong></p>
                  {selectedProdutos.length > 1 && (
                    <div className="text-xs space-y-0.5">
                      {selectedProdutos.map((prod) => {
                        const dados = getProdutoDados(prod.id);
                        const val = prod.tipo_valor_engenheiro === "percentual"
                          ? parseCurrency(dados.valor_solicitado) * (prod.valor_engenheiro / 100)
                          : prod.valor_engenheiro;
                        return (
                          <p key={prod.id}>
                            {prod.nome}: {formatCurrency(val)}
                            {prod.tipo_valor_engenheiro === "percentual" && ` (${prod.valor_engenheiro}%)`}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes_produtor}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes_produtor: e.target.value }))}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>

              {/* Modo assistido */}
              {!editId && (
                <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Preciso de ajuda de um projetista</p>
                        <p className="text-xs text-muted-foreground">Um engenheiro/projetista cuidará da documentação para você.</p>
                      </div>
                    </div>
                    <Switch checked={modoAssistido} onCheckedChange={(v) => { setModoAssistido(v); if (!v) { setEngenheiroAssistenteId(""); setBuscaEngenheiro(""); } }} />
                  </div>

                  {modoAssistido && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-8"
                          placeholder="Buscar por nome do engenheiro/projetista..."
                          value={buscaEngenheiro}
                          onChange={(e) => setBuscaEngenheiro(e.target.value)}
                        />
                      </div>

                      {form.propriedade_id && propriedades && (() => {
                        const prop = propriedades.find((p) => p.id === form.propriedade_id);
                        const uf = (prop as any)?.regioes?.uf;
                        return uf ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Priorizando projetistas da região {uf}
                          </p>
                        ) : null;
                      })()}

                      <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-1">
                        {(() => {
                          const search = buscaEngenheiro.toLowerCase();
                          const propUf = (() => {
                            if (!form.propriedade_id || !propriedades) return null;
                            const prop = propriedades.find((p) => p.id === form.propriedade_id);
                            return (prop as any)?.regioes?.uf ?? null;
                          })();

                          const filtered = (engenheirosDisponiveis ?? [])
                            .filter((e: any) => !search || e.nome.toLowerCase().includes(search) || e.crea?.toLowerCase().includes(search))
                            .sort((a: any, b: any) => {
                              if (propUf) {
                                const aMatch = a.regiao_uf === propUf ? 0 : 1;
                                const bMatch = b.regiao_uf === propUf ? 0 : 1;
                                if (aMatch !== bMatch) return aMatch - bMatch;
                              }
                              return (b.total_laudos_concluidos || 0) - (a.total_laudos_concluidos || 0);
                            });

                          if (!filtered.length) return (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              {engenheirosDisponiveis === undefined ? "Carregando..." : "Nenhum projetista encontrado."}
                            </p>
                          );

                          return filtered.map((eng: any) => (
                            <button
                              key={eng.id}
                              type="button"
                              className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                                engenheiroAssistenteId === eng.id
                                  ? "bg-primary/10 border border-primary/30"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => setEngenheiroAssistenteId(eng.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{eng.nome}</span>
                                  {eng.regiao_uf && (
                                    <Badge variant="outline" className="ml-2 text-xs">{eng.regiao_nome || eng.regiao_uf}</Badge>
                                  )}
                                </div>
                                {engenheiroAssistenteId === eng.id && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
                                {eng.tipo_licenca && <span>{eng.tipo_licenca}: {eng.numero_licenca || eng.crea}</span>}
                                {eng.total_laudos_concluidos > 0 && <span>{eng.total_laudos_concluidos} laudos</span>}
                                {eng.rating && <span>★ {eng.rating}</span>}
                                {eng.area_atuacao && <span>{eng.area_atuacao}</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Valor da assistência: a definir pela Mesa
                              </p>
                            </button>
                          ));
                        })()}
                      </div>

                      {modoAssistido && !engenheiroAssistenteId && (
                        <p className="text-xs text-destructive">Selecione um projetista para continuar.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || form.pronaf_produto_ids.length === 0 || (modoAssistido && !engenheiroAssistenteId)}>
                  {createMutation.isPending ? (editId ? "Salvando..." : "Criando...") : (editId ? "Salvar Alterações" : "Criar Solicitação")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!propriedades?.length && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cadastre uma propriedade antes de solicitar um laudo.</p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = "/propriedades"}>
              Ir para Propriedades
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !solicitacoes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Grouped solicitations */}
          {groupedSolicitacoes.groups.map(([grupoId, subs]) => {
            const first = subs[0];
            const produtos = subs.map((s: any) => (s as any).pronaf_produtos?.nome).filter(Boolean);
            const worstStatus = subs.some((s: any) => s.status_solicitacao === "reprovada") ? "reprovada"
              : subs.every((s: any) => s.status_solicitacao === "pronta_para_banco") ? "pronta_para_banco"
              : subs[0].status_solicitacao;
            const st = statusMap[worstStatus] || { label: worstStatus, variant: "outline" as const };
            return (
              <Card key={grupoId} className="border-l-4 border-l-primary/50">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="font-medium">{(first as any).propriedades?.nome_propriedade}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                    <Badge variant="outline" className="text-xs">{subs.length} produtos</Badge>
                    {(first as any).assistido && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <UserCheck className="h-3 w-3" /> Assistido
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {produtos.map((nome: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{nome}</Badge>
                    ))}
                  </div>
                  <div className="grid gap-2">
                    {subs.map((s: any) => {
                      const subSt = statusMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setDetailSolicitacao(s)}
                        >
                          <StatusIcon status={s.status_solicitacao} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{(s as any).pronaf_produtos?.nome || "—"}</span>
                              <Badge variant={subSt.variant} className="text-xs">{subSt.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {s.cultura_principal} · {s.area_cultivo_ha} ha · {formatCurrency(s.valor_solicitado)}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Standalone (legacy) solicitations */}
          {groupedSolicitacoes.standalone.map((s) => {
            const st = statusMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
            const produtoNome = (s as any).pronaf_produtos?.nome;
            return (
              <Card key={s.id} className="cursor-pointer hover:ring-1 hover:ring-ring transition-shadow" onClick={() => setDetailSolicitacao(s)}>
                <CardContent className="flex items-center gap-4 py-4">
                  <StatusIcon status={s.status_solicitacao} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{(s as any).propriedades?.nome_propriedade}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {produtoNome && <Badge variant="outline">{produtoNome}</Badge>}
                      {s.docs_habilitados && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Upload className="h-3 w-3" /> Docs liberados
                        </Badge>
                      )}
                      {(s as any).assistido && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <UserCheck className="h-3 w-3" /> Assistido
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.cultura_principal} · {s.area_cultivo_ha} ha · {formatCurrency(s.valor_solicitado)}
                      {s.banco_destino ? ` · ${s.banco_destino}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status_solicitacao === "pendente" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Editar solicitação"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditId(s.id);
                          setForm({
                            propriedade_id: s.propriedade_id,
                            pronaf_produto_ids: s.pronaf_produto_id ? [s.pronaf_produto_id] : [],
                            produto_dados: s.pronaf_produto_id ? {
                              [s.pronaf_produto_id]: {
                                cultura_principal: s.cultura_principal || "",
                                area_cultivo_ha: String(s.area_cultivo_ha),
                                valor_solicitado: formatToCurrency(s.valor_solicitado),
                              },
                            } : {},
                            banco_parceiro_id: s.banco_parceiro_id || "",
                            observacoes_produtor: s.observacoes_produtor || "",
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {(() => {
                      const laudoArr = (s as any).laudos;
                      const laudo = Array.isArray(laudoArr) ? laudoArr[0] : laudoArr;
                      if (laudo?.status_laudo === "finalizado" && laudo?.caminho_pdf_laudo) {
                        return (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const { data } = await supabase.storage.from("laudo-pdfs").createSignedUrl(laudo.caminho_pdf_laudo, 300);
                              if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        );
                      }
                      return null;
                    })()}
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
      <Dialog open={!!detailSolicitacao} onOpenChange={(v) => { if (!v) setDetailSolicitacao(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {detailSolicitacao && (() => {
            const produto = (detailSolicitacao as any).pronaf_produtos;
            return (
              <div className="space-y-4">
                <StatusTimeline solicitacao={detailSolicitacao} />

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><span className="font-medium">Propriedade:</span> {(detailSolicitacao as any).propriedades?.nome_propriedade}</div>
                  <div><span className="font-medium">Cultura:</span> {detailSolicitacao.cultura_principal}</div>
                  <div><span className="font-medium">Área:</span> {detailSolicitacao.area_cultivo_ha} ha</div>
                  <div><span className="font-medium">Valor solicitado:</span> {formatCurrency(detailSolicitacao.valor_solicitado)}</div>
                  <div><span className="font-medium">Banco:</span> {(detailSolicitacao as any).bancos_parceiros?.nome || detailSolicitacao.banco_destino || "—"}</div>
                  <div><span className="font-medium">Status:</span> <Badge variant={statusMap[detailSolicitacao.status_solicitacao]?.variant}>{statusMap[detailSolicitacao.status_solicitacao]?.label}</Badge></div>
                </div>

                {produto && (
                  <ProductRulesCard
                    produto={produto}
                    valorSolicitado={detailSolicitacao.valor_solicitado}
                  />
                )}

                {/* Budget section for custeio */}
                {detailSolicitacao.tipo_credito === "custeio" && (
                  <OrcamentoCusteio
                    solicitacaoId={detailSolicitacao.id}
                    culturaPrincipal={detailSolicitacao.cultura_principal}
                    readOnly={!["pendente", "docs_pendentes_produtor", "em_analise_mesa"].includes(detailSolicitacao.status_solicitacao)}
                  />
                )}

                {/* Document upload section */}
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Documentação
                  </h4>

                  {!detailSolicitacao.docs_habilitados ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-md p-3">
                      <FileWarning className="h-4 w-4 shrink-0" />
                      <p>O envio de documentos ainda não foi liberado pela Mesa de Produtos. Aguarde a liberação para enviar sua documentação.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm text-success bg-success/10 rounded-md p-2">
                        <ShieldCheck className="h-4 w-4" />
                        Envio de documentos habilitado!
                      </div>

                      {detailPronafDocs && detailPronafDocs.length > 0 && (
                        <div className="space-y-2">
                          {detailPronafDocs.map((doc) => {
                            const uploaded = uploadedDocs?.find((u) => u.pronaf_documento_id === doc.id);
                            return (
                              <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium">{doc.nome_documento}</span>
                                  {doc.obrigatorio && <span className="text-destructive ml-1 text-xs">(obrigatório)</span>}
                                  {doc.descricao && <p className="text-xs text-muted-foreground">{doc.descricao}</p>}
                                </div>
                                {uploaded ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-xs gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> {uploaded.nome_arquivo}
                                    </Badge>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteDocMutation.mutate(uploaded)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleFileUpload(doc.id)} disabled={uploadDocMutation.isPending}>
                                    <Upload className="h-3 w-3 mr-1" /> Enviar
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <Button size="sm" variant="outline" onClick={() => handleFileUpload()} disabled={uploadDocMutation.isPending}>
                        <Plus className="h-3 w-3 mr-1" /> Enviar outro documento
                      </Button>

                      {uploadedDocs?.filter((d) => !d.pronaf_documento_id).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                          <span className="text-muted-foreground">{doc.nome_arquivo}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant={doc.status_documento === "validado" ? "default" : doc.status_documento === "recusado" ? "destructive" : "secondary"} className="text-xs">
                              {doc.status_documento}
                            </Badge>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteDocMutation.mutate(doc)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Chat section */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Chat
                    </h4>
                    <Button size="sm" variant="ghost" disabled title="Videochamada — em breve" className="gap-1.5 text-xs text-muted-foreground">
                      <Video className="h-3.5 w-3.5" /> Vídeo (em breve)
                    </Button>
                  </div>
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
                            {(msg as any).audio_url ? (
                              <AudioPlayer src={(msg as any).audio_url} />
                            ) : (
                              msg.mensagem
                            )}
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
                      onKeyDown={(e) => { if (e.key === "Enter" && chatMessage.trim()) sendChatMutation.mutate({}); }}
                    />
                    <AudioRecorder onRecordingComplete={handleAudioComplete} disabled={sendChatMutation.isPending} isUploading={isUploadingAudio} />
                    <Button size="icon" onClick={() => sendChatMutation.mutate({})} disabled={!chatMessage.trim() || sendChatMutation.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
