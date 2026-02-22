import { useState, useMemo } from "react";
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
import { StatCard } from "@/components/ui/stat-card";
import {
  ClipboardCheck, MapPin, Sprout, Banknote, Check, X, Send, MessageCircle,
  Sparkles, FileSearch, UserCheck, Loader2, FolderOpen, FileText, CheckCircle2,
  XCircle, Eye, Video, RotateCcw, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Layers, Search, Download, ArrowUpDown, Clock, Users, TrendingUp,
  Filter,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { AudioRecorder } from "@/components/chat/AudioRecorder";
import { AudioPlayer } from "@/components/chat/AudioPlayer";
import StatusTimeline from "@/components/solicitacoes/StatusTimeline";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusSolicitacaoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  em_analise_mesa: { label: "Em Análise", variant: "secondary" },
  docs_pendentes_produtor: { label: "Docs Pendentes", variant: "outline" },
  docs_em_validacao: { label: "Docs em Validação", variant: "secondary" },
  elegivel: { label: "Elegível", variant: "secondary" },
  reprovada: { label: "Reprovada", variant: "destructive" },
  aguardando_laudo: { label: "Aguard. Laudo", variant: "secondary" },
  pronta_para_banco: { label: "Pronta p/ Banco", variant: "default" },
};

const pipelineStages = [
  { key: "pendente", label: "Pendentes" },
  { key: "em_analise_mesa", label: "Em Análise" },
  { key: "docs_pendentes_produtor", label: "Docs Pendentes" },
  { key: "docs_em_validacao", label: "Docs Validação" },
  { key: "elegivel", label: "Elegível" },
  { key: "aguardando_laudo", label: "Aguard. Laudo" },
  { key: "pronta_para_banco", label: "Pronto p/ Banco" },
];

type SortOption = "recente" | "antigo" | "valor_desc" | "valor_asc" | "sla_urgente";

function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MesaProdutos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const ai = useAiAssistant();
  const qc = useQueryClient();
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [notas, setNotas] = useState("");
  const [engenheiroAtribuidoId, setEngenheiroAtribuidoId] = useState("");
  
  const [tipoValorOverride, setTipoValorOverride] = useState<"produto" | "fixo" | "percentual">("produto");
  const [valorOverride, setValorOverride] = useState("");
  const [showPropDetails, setShowPropDetails] = useState(false);

  // Group assistant fee state
  const [tipoValorAssistencia, setTipoValorAssistencia] = useState<"fixo" | "percentual">("fixo");
  const [valorAssistencia, setValorAssistencia] = useState("");

  // ─── Filters & Search State ───
  const [searchText, setSearchText] = useState("");
  const [filterUF, setFilterUF] = useState<string>("todas");
  const [filterCliente, setFilterCliente] = useState<string>("todos");
  const [filterProduto, setFilterProduto] = useState<string>("todos");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [sortBy, setSortBy] = useState<SortOption>("recente");
  const [showFilters, setShowFilters] = useState(false);
  const [groupByCliente, setGroupByCliente] = useState(false);

  // ─── Data Queries ───
  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["mesa_solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade, endereco, area_total_ha, regiao_id, municipio, uf, latitude, longitude, codigo_car, matricula_imovel, numero_ccir, numero_itr, tipo_posse, area_reserva_legal_ha, area_app_ha, fonte_agua, tipo_solo), pronaf_produtos(nome, finalidade, valor_engenheiro, tipo_valor_engenheiro), produtores(user_id), laudos(id, status_laudo, caminho_pdf_laudo), engenheiros!solicitacoes_laudo_engenheiro_assistente_id_fkey(id, user_id, crea)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const produtorUserIds = [...new Set(data?.map((s: any) => s.produtores?.user_id).filter(Boolean))];
      const assistenteUserIds = [...new Set(data?.filter((s: any) => s.assistido && s.engenheiros).map((s: any) => s.engenheiros?.user_id).filter(Boolean))];
      const allUserIds = [...new Set([...produtorUserIds, ...assistenteUserIds])];
      let profileMap: Record<string, string> = {};
      if (allUserIds.length) {
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", allUserIds);
        profiles?.forEach((p) => { profileMap[p.id] = p.nome; });
      }
      return data?.map((s: any) => ({
        ...s,
        produtor_nome: s.produtores?.user_id ? profileMap[s.produtores.user_id] || "—" : "—",
        assistente_nome: s.assistido && s.engenheiros?.user_id ? profileMap[s.engenheiros.user_id] || "—" : null,
      })) ?? [];
    },
  });

  const { data: grupos } = useQuery({
    queryKey: ["mesa_grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos_solicitacao")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: slaConfig } = useQuery({
    queryKey: ["sla_config_mesa"],
    queryFn: async () => {
      const { data } = await supabase.from("sla_config").select("*");
      return data ?? [];
    },
  });

  const { data: engenheiros } = useQuery({
    queryKey: ["lista_engenheiros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engenheiros")
        .select("id, crea, user_id, area_atuacao, regiao_id")
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

  const { data: detailPronafDocs } = useQuery({
    queryKey: ["pronaf_documentos_mesa", selectedSolicitacao?.pronaf_produto_id],
    enabled: !!selectedSolicitacao?.pronaf_produto_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_documentos")
        .select("*")
        .eq("produto_id", selectedSolicitacao.pronaf_produto_id)
        .order("ordem");
      if (error) throw error;
      return data;
    },
  });

  const { data: uploadedDocs } = useQuery({
    queryKey: ["solicitacao_documentos_mesa", selectedSolicitacao?.id],
    enabled: !!selectedSolicitacao,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_documentos")
        .select("*")
        .eq("solicitacao_id", selectedSolicitacao.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const selectedGrupoId = selectedSolicitacao?.grupo_id;
  const { data: grupoDocsCompartilhados } = useQuery({
    queryKey: ["grupo_docs_compartilhados_mesa", selectedGrupoId],
    enabled: !!selectedGrupoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupo_documentos_compartilhados")
        .select("*")
        .eq("grupo_id", selectedGrupoId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: grupoSiblings } = useQuery({
    queryKey: ["grupo_siblings_mesa", selectedGrupoId],
    enabled: !!selectedGrupoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("id, pronaf_produto_id, status_solicitacao, valor_solicitado, pronaf_produtos(nome)")
        .eq("grupo_id", selectedGrupoId)
        .order("created_at");
      if (error) throw error;
      return data;
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

  // ─── Derived data for filters ───
  const availableUFs = useMemo(() => {
    if (!solicitacoes) return [];
    const ufs = [...new Set(solicitacoes.map((s: any) => s.propriedades?.uf).filter(Boolean))].sort();
    return ufs as string[];
  }, [solicitacoes]);

  const availableClientes = useMemo(() => {
    if (!solicitacoes) return [];
    const map = new Map<string, string>();
    solicitacoes.forEach((s: any) => {
      if (s.produtor_id && s.produtor_nome !== "—") {
        map.set(s.produtor_id, s.produtor_nome);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [solicitacoes]);

  const availableProdutos = useMemo(() => {
    if (!solicitacoes) return [];
    const map = new Map<string, string>();
    solicitacoes.forEach((s: any) => {
      if (s.pronaf_produto_id && s.pronaf_produtos?.nome) {
        map.set(s.pronaf_produto_id, s.pronaf_produtos.nome);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [solicitacoes]);

  // ─── SLA helper ───
  const getSlaStatus = (s: any): { overdue: boolean; hoursLeft: number } | null => {
    if (!slaConfig?.length) return null;
    const cfg = slaConfig.find((c) => c.status_solicitacao === s.status_solicitacao);
    if (!cfg) return null;
    const created = new Date(s.updated_at || s.created_at).getTime();
    const deadline = created + cfg.prazo_horas * 3600000;
    const now = Date.now();
    return { overdue: now > deadline, hoursLeft: Math.round((deadline - now) / 3600000) };
  };

  // ─── Filtered + sorted data ───
  const filteredSolicitacoes = useMemo(() => {
    if (!solicitacoes) return [];
    let items = [...solicitacoes];

    // Text search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      items = items.filter((s: any) =>
        s.produtor_nome?.toLowerCase().includes(q) ||
        s.propriedades?.nome_propriedade?.toLowerCase().includes(q) ||
        s.pronaf_produtos?.nome?.toLowerCase().includes(q) ||
        s.cultura_principal?.toLowerCase().includes(q) ||
        s.propriedades?.municipio?.toLowerCase().includes(q)
      );
    }

    // UF
    if (filterUF !== "todas") {
      items = items.filter((s: any) => s.propriedades?.uf === filterUF);
    }

    // Cliente
    if (filterCliente !== "todos") {
      items = items.filter((s: any) => s.produtor_id === filterCliente);
    }

    // Produto
    if (filterProduto !== "todos") {
      items = items.filter((s: any) => s.pronaf_produto_id === filterProduto);
    }

    // Date range
    if (filterDateFrom) {
      items = items.filter((s) => new Date(s.created_at) >= filterDateFrom!);
    }
    if (filterDateTo) {
      const end = new Date(filterDateTo);
      end.setHours(23, 59, 59, 999);
      items = items.filter((s) => new Date(s.created_at) <= end);
    }

    // Sort
    switch (sortBy) {
      case "antigo":
        items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "valor_desc":
        items.sort((a, b) => b.valor_solicitado - a.valor_solicitado);
        break;
      case "valor_asc":
        items.sort((a, b) => a.valor_solicitado - b.valor_solicitado);
        break;
      case "sla_urgente":
        items.sort((a, b) => {
          const slaA = getSlaStatus(a);
          const slaB = getSlaStatus(b);
          const urgA = slaA ? (slaA.overdue ? -99999 : slaA.hoursLeft) : 99999;
          const urgB = slaB ? (slaB.overdue ? -99999 : slaB.hoursLeft) : 99999;
          return urgA - urgB;
        });
        break;
      default: // recente
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return items;
  }, [solicitacoes, searchText, filterUF, filterCliente, filterProduto, filterDateFrom, filterDateTo, sortBy, slaConfig]);

  // ─── KPIs ───
  const kpis = useMemo(() => {
    if (!filteredSolicitacoes.length) return { total: 0, valorTotal: 0, slaVencidos: 0, assistidos: 0 };
    let slaVencidos = 0;
    let assistidos = 0;
    let valorTotal = 0;
    filteredSolicitacoes.forEach((s: any) => {
      valorTotal += s.valor_solicitado || 0;
      if (s.assistido) assistidos++;
      const sla = getSlaStatus(s);
      if (sla?.overdue) slaVencidos++;
    });
    return { total: filteredSolicitacoes.length, valorTotal, slaVencidos, assistidos };
  }, [filteredSolicitacoes, slaConfig]);

  const hasActiveFilters = searchText || filterUF !== "todas" || filterCliente !== "todos" || filterProduto !== "todos" || filterDateFrom || filterDateTo;

  const clearFilters = () => {
    setSearchText("");
    setFilterUF("todas");
    setFilterCliente("todos");
    setFilterProduto("todos");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  // ─── CSV Export ───
  const handleExportCSV = () => {
    const headers = ["Data", "Status", "Produtor", "Propriedade", "UF", "Município", "Produto", "Cultura", "Área (ha)", "Valor Solicitado", "Pgto Eng.", "Assistido", "SLA"];
    const rows = filteredSolicitacoes.map((s: any) => {
      const sla = getSlaStatus(s);
      return [
        new Date(s.created_at).toLocaleDateString("pt-BR"),
        statusSolicitacaoMap[s.status_solicitacao]?.label || s.status_solicitacao,
        s.produtor_nome || "—",
        s.propriedades?.nome_propriedade || "—",
        s.propriedades?.uf || "—",
        s.propriedades?.municipio || "—",
        s.pronaf_produtos?.nome || "—",
        s.cultura_principal || "—",
        String(s.area_cultivo_ha || 0),
        String(s.valor_solicitado || 0),
        String(s.valor_pagamento_engenheiro || 0),
        s.assistido ? "Sim" : "Não",
        sla ? (sla.overdue ? "Vencido" : `${sla.hoursLeft}h`) : "—",
      ];
    });
    exportCSV(headers, rows, `mesa-solicitacoes-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  // ─── Mutations (unchanged) ───
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status_solicitacao, extra, skipPaymentCalc }: { id: string; status_solicitacao: string; extra?: any; skipPaymentCalc?: boolean }) => {
      const updateData: any = { status_solicitacao, notas_mesa: notas, ...extra };
      if (engenheiroAtribuidoId) updateData.engenheiro_atribuido_id = engenheiroAtribuidoId;
      // Only recalculate payment fields when explicitly changing status (not just toggling docs)
      if (!skipPaymentCalc) {
        if (tipoValorOverride !== "produto" && valorOverride) {
          updateData.tipo_valor_engenheiro_override = tipoValorOverride;
          updateData.valor_engenheiro_override = parseFloat(valorOverride) || 0;
          if (tipoValorOverride === "fixo") {
            updateData.valor_pagamento_engenheiro = parseFloat(valorOverride) || 0;
          } else if (tipoValorOverride === "percentual") {
            updateData.valor_pagamento_engenheiro = (selectedSolicitacao.valor_solicitado * (parseFloat(valorOverride) || 0)) / 100;
          }
        } else if (tipoValorOverride === "produto") {
          const produto = (selectedSolicitacao as any).pronaf_produtos;
          if (produto) {
            updateData.valor_pagamento_engenheiro = produto.tipo_valor_engenheiro === "fixo"
              ? produto.valor_engenheiro
              : (selectedSolicitacao.valor_solicitado * produto.valor_engenheiro) / 100;
          }
          updateData.tipo_valor_engenheiro_override = null;
          updateData.valor_engenheiro_override = null;
        }
      }
      const { error } = await supabase.from("solicitacoes_laudo").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mesa_solicitacoes"] }); toast({ title: "Atualizado com sucesso!" }); },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateGrupoMutation = useMutation({
    mutationFn: async ({ grupoId, tipo, valor }: { grupoId: string; tipo: string; valor: number }) => {
      const { error } = await supabase.from("grupos_solicitacao").update({ tipo_valor_assistencia: tipo, valor_assistencia: valor }).eq("id", grupoId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mesa_grupos"] }); toast({ title: "Taxa do assistente atualizada!" }); },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const updateGrupoDocStatusMutation = useMutation({
    mutationFn: async ({ docId, status }: { docId: string; status: string }) => {
      const { error } = await supabase.from("grupo_documentos_compartilhados").update({ status_documento: status }).eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["grupo_docs_compartilhados_mesa", selectedGrupoId] }); toast({ title: "Status do documento atualizado!" }); },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const sendChatMutation = useMutation({
    mutationFn: async ({ audioUrl }: { audioUrl?: string } = {}) => {
      const { error } = await supabase.from("chat_mensagens").insert({
        solicitacao_id: selectedSolicitacao.id,
        remetente_id: user!.id,
        remetente_role: "mesa_produtos",
        mensagem: audioUrl ? "🎤 Mensagem de áudio" : chatMessage,
        audio_url: audioUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat_mesa", selectedSolicitacao?.id] }); setChatMessage(""); },
    onError: (err: Error) => toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" }),
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
      toast({ title: "Erro ao enviar áudio", description: err.message, variant: "destructive" });
    } finally { setIsUploadingAudio(false); }
  };

  const updateDocStatusMutation = useMutation({
    mutationFn: async ({ docId, status }: { docId: string; status: string }) => {
      const { error } = await supabase.from("solicitacao_documentos").update({ status_documento: status }).eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["solicitacao_documentos_mesa", selectedSolicitacao?.id] }); toast({ title: "Status do documento atualizado!" }); },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // ─── Helpers ───
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const openDetail = (s: any) => {
    setSelectedSolicitacao(s);
    setShowPropDetails(false);
    setNotas(s.notas_mesa || "");
    setEngenheiroAtribuidoId(s.engenheiro_atribuido_id || "");
    if ((s as any).tipo_valor_engenheiro_override) {
      setTipoValorOverride((s as any).tipo_valor_engenheiro_override);
      setValorOverride(String((s as any).valor_engenheiro_override ?? ""));
    } else {
      setTipoValorOverride("produto");
      setValorOverride("");
    }
    if (s.grupo_id && grupos) {
      const grupo = grupos.find((g: any) => g.id === s.grupo_id);
      if (grupo) {
        setTipoValorAssistencia((grupo.tipo_valor_assistencia === "percentual" ? "percentual" : "fixo") as "fixo" | "percentual");
        setValorAssistencia(grupo.valor_assistencia ? String(grupo.valor_assistencia) : "");
      } else { setTipoValorAssistencia("fixo"); setValorAssistencia(""); }
    } else { setTipoValorAssistencia("fixo"); setValorAssistencia(""); }
  };

  const filterByStage = (stage: string) =>
    filteredSolicitacoes.filter((s) => s.status_solicitacao === stage);

  const getLaudoStatus = (s: any): string | null => {
    const laudos = (s as any).laudos;
    if (!laudos) return null;
    if (Array.isArray(laudos)) return laudos.length === 0 ? null : laudos[0].status_laudo;
    return laudos.status_laudo;
  };

  const sortedEngenheiros = (propRegiaoId: string | null) => {
    if (!engenheiros) return [];
    if (!propRegiaoId) return engenheiros;
    return [...engenheiros].sort((a, b) => {
      const aMatch = (a as any).regiao_id === propRegiaoId ? 0 : 1;
      const bMatch = (b as any).regiao_id === propRegiaoId ? 0 : 1;
      return aMatch - bMatch;
    });
  };

  const getGroupSize = (grupoId: string | null) => {
    if (!grupoId || !solicitacoes) return 0;
    return solicitacoes.filter((s) => s.grupo_id === grupoId).length;
  };

  // ─── Grouped by client ───
  const groupedByCliente = useMemo(() => {
    if (!groupByCliente) return null;
    const map = new Map<string, { nome: string; items: any[] }>();
    filteredSolicitacoes.forEach((s: any) => {
      const key = s.produtor_id || "desconhecido";
      if (!map.has(key)) map.set(key, { nome: s.produtor_nome || "—", items: [] });
      map.get(key)!.items.push(s);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [filteredSolicitacoes, groupByCliente]);

  const renderCard = (s: any) => {
    const prop = (s as any).propriedades;
    const produto = (s as any).pronaf_produtos;
    const st = statusSolicitacaoMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
    const laudoSt = getLaudoStatus(s);
    const sla = getSlaStatus(s);
    const groupSize = getGroupSize(s.grupo_id);
    return (
      <Card key={s.id} className={`cursor-pointer hover:ring-1 hover:ring-ring transition-shadow ${sla?.overdue ? "border-destructive/50" : ""}`} onClick={() => openDetail(s)}>
        <CardContent className="py-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-display font-semibold text-sm">{prop?.nome_propriedade}</span>
              {!groupByCliente && <span className="text-xs text-muted-foreground">· {s.produtor_nome}</span>}
              {produto && <Badge variant="outline" className="text-xs">{produto.nome}</Badge>}
              {groupSize > 1 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Layers className="h-3 w-3" /> {groupSize} produtos
                </Badge>
              )}
              {laudoSt && (
                <Badge variant={laudoSt === "finalizado" ? "default" : "secondary"} className="text-xs">
                  Laudo: {laudoSt === "em_vistoria" ? "em vistoria" : laudoSt === "aguardando_assinatura" ? "aguard. assin." : laudoSt}
                </Badge>
              )}
              {sla?.overdue && <Badge variant="destructive" className="text-xs">SLA vencido</Badge>}
              {sla && !sla.overdue && sla.hoursLeft < 12 && <Badge variant="secondary" className="text-xs">⚠ {sla.hoursLeft}h restantes</Badge>}
              {s.assistido && <Badge variant="secondary" className="text-xs gap-1"><UserCheck className="h-3 w-3" /> Assistido</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={st.variant} className="text-xs whitespace-nowrap">{st.label}</Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {prop?.municipio}/{prop?.uf}</span>
            <span className="flex items-center gap-1"><Banknote className="h-3 w-3" /> {formatCurrency(s.valor_solicitado)}</span>
            <span className="flex items-center gap-1"><Sprout className="h-3 w-3" /> {s.cultura_principal} · {s.area_cultivo_ha}ha</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStageContent = (stage: string) => {
    const items = filterByStage(stage);
    if (!items.length) {
      return (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma solicitação nesta etapa.</p>
        </CardContent></Card>
      );
    }

    if (groupByCliente) {
      const grouped = new Map<string, { nome: string; items: any[] }>();
      items.forEach((s: any) => {
        const key = s.produtor_id || "x";
        if (!grouped.has(key)) grouped.set(key, { nome: s.produtor_nome, items: [] });
        grouped.get(key)!.items.push(s);
      });
      return (
        <div className="space-y-4">
          {Array.from(grouped.values()).sort((a, b) => a.nome.localeCompare(b.nome)).map((g) => (
            <div key={g.nome} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{g.nome}</span>
                <Badge variant="outline" className="text-xs">{g.items.length} solicitaç{g.items.length > 1 ? "ões" : "ão"}</Badge>
              </div>
              <div className="grid gap-2 pl-6 border-l-2 border-muted">
                {g.items.map(renderCard)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return <div className="grid gap-3">{items.map(renderCard)}</div>;
  };

  const selectedGrupo = selectedGrupoId && grupos ? grupos.find((g: any) => g.id === selectedGrupoId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Esteira de Solicitações</h1>
          <p className="text-muted-foreground">Pipeline completo: documentação → elegibilidade → laudo → banco.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setGroupByCliente(!groupByCliente)} className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {groupByCliente ? "Desagrupar" : "Agrupar por Cliente"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filteredSolicitacoes.length} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<ClipboardCheck className="h-4 w-4" />} title="Total Solicitações" value={String(kpis.total)} delay={0} />
          <StatCard icon={<Banknote className="h-4 w-4" />} title="Valor Total" value={formatCurrency(kpis.valorTotal)} delay={50} />
          <StatCard icon={<Clock className="h-4 w-4" />} title="SLA Vencido" value={String(kpis.slaVencidos)} className={kpis.slaVencidos > 0 ? "border-destructive/40" : ""} delay={100} />
          <StatCard icon={<UserCheck className="h-4 w-4" />} title="Assistidos" value={String(kpis.assistidos)} delay={150} />
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por produtor, propriedade, produto, município..."
              className="pl-9"
            />
          </div>
          <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {hasActiveFilters && <Badge variant="default" className="text-[10px] px-1.5 py-0 ml-1">!</Badge>}
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-auto min-w-[180px] shrink-0">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recente">Mais recente</SelectItem>
              <SelectItem value="antigo">Mais antigo</SelectItem>
              <SelectItem value="valor_desc">Maior valor</SelectItem>
              <SelectItem value="valor_asc">Menor valor</SelectItem>
              <SelectItem value="sla_urgente">SLA mais urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-md border bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">UF / Estado</Label>
              <Select value={filterUF} onValueChange={setFilterUF}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {availableUFs.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente (Produtor)</Label>
              <Select value={filterCliente} onValueChange={setFilterCliente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {availableClientes.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Produto</Label>
              <Select value={filterProduto} onValueChange={setFilterProduto}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {availableProdutos.map(([id, nome]) => <SelectItem key={id} value={id}>{nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Período</Label>
              <div className="flex gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-xs font-normal h-9">
                      {filterDateFrom ? format(filterDateFrom, "dd/MM/yy") : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-xs font-normal h-9">
                      {filterDateTo ? format(filterDateTo, "dd/MM/yy") : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} locale={ptBR} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="col-span-full flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1">
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Tabs */}
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
            <TabsTrigger value="reprovada">Reprovadas ({filterByStage("reprovada").length})</TabsTrigger>
          </TabsList>
          {pipelineStages.map((stage) => (
            <TabsContent key={stage.key} value={stage.key}>
              {renderStageContent(stage.key)}
            </TabsContent>
          ))}
          <TabsContent value="reprovada">
            {renderStageContent("reprovada")}
          </TabsContent>
        </Tabs>
      )}

      {/* Detail dialog — unchanged */}
      <Dialog open={!!selectedSolicitacao} onOpenChange={(v) => { if (!v) setSelectedSolicitacao(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Análise da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-4">
              <StatusTimeline solicitacao={selectedSolicitacao} />

              {/* Group info banner */}
              {selectedGrupo && grupoSiblings && grupoSiblings.length > 1 && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Layers className="h-4 w-4 text-primary" />
                    Grupo multi-produto ({grupoSiblings.length} produtos)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {grupoSiblings.map((sib: any) => (
                      <Badge
                        key={sib.id}
                        variant={sib.id === selectedSolicitacao.id ? "default" : "outline"}
                        className="text-xs cursor-pointer"
                        onClick={() => {
                          const full = solicitacoes?.find((s) => s.id === sib.id);
                          if (full) openDetail(full);
                        }}
                      >
                        {(sib as any).pronaf_produtos?.nome || "Produto"}
                        {" · "}
                        {statusSolicitacaoMap[sib.status_solicitacao]?.label || sib.status_solicitacao}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div><span className="font-medium">Propriedade:</span> {(selectedSolicitacao as any).propriedades?.nome_propriedade}</div>
                <div><span className="font-medium">Endereço:</span> {(selectedSolicitacao as any).propriedades?.endereco}</div>
                <div><span className="font-medium">Cultura:</span> {selectedSolicitacao.cultura_principal}</div>
                <div><span className="font-medium">Área:</span> {selectedSolicitacao.area_cultivo_ha} ha</div>
                <div><span className="font-medium">Valor solicitado:</span> {formatCurrency(selectedSolicitacao.valor_solicitado)}</div>
                <div><span className="font-medium">Produto:</span> {(selectedSolicitacao as any).pronaf_produtos?.nome || "—"}</div>
                <div><span className="font-medium">Status:</span> <Badge variant={statusSolicitacaoMap[selectedSolicitacao.status_solicitacao]?.variant}>{statusSolicitacaoMap[selectedSolicitacao.status_solicitacao]?.label}</Badge></div>
                <div><span className="font-medium">Pgto Eng. atual:</span> {formatCurrency(selectedSolicitacao.valor_pagamento_engenheiro)}</div>
              </div>

              {/* Modo assistido info */}
              {selectedSolicitacao.assistido && (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                  <UserCheck className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="font-medium">Solicitação assistida</span>
                    {selectedSolicitacao.assistente_nome && (
                      <span className="text-muted-foreground"> — Projetista: <strong className="text-foreground">{selectedSolicitacao.assistente_nome}</strong></span>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">O projetista é responsável por subir a documentação em nome do produtor.</p>
                  </div>
                </div>
              )}

              {/* Assistant fee management (only for groups with assistido) */}
              {selectedGrupo && selectedSolicitacao.assistido && (
                <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> Remuneração do Assistente (Grupo)
                  </h4>
                  <RadioGroup
                    value={tipoValorAssistencia}
                    onValueChange={(v: string) => setTipoValorAssistencia(v as "fixo" | "percentual")}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="fixo" id="assist-fixo" />
                      <Label htmlFor="assist-fixo" className="text-sm">Valor fixo (R$)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="percentual" id="assist-pct" />
                      <Label htmlFor="assist-pct" className="text-sm">Percentual (%)</Label>
                    </div>
                  </RadioGroup>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={valorAssistencia}
                      onChange={(e) => setValorAssistencia(e.target.value)}
                      placeholder={tipoValorAssistencia === "fixo" ? "Ex: 500.00" : "Ex: 1.5"}
                      className="max-w-[200px]"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!valorAssistencia || updateGrupoMutation.isPending}
                      onClick={() => updateGrupoMutation.mutate({
                        grupoId: selectedGrupoId,
                        tipo: tipoValorAssistencia,
                        valor: parseFloat(valorAssistencia) || 0,
                      })}
                    >
                      {updateGrupoMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar Taxa"}
                    </Button>
                  </div>
                  {valorAssistencia && (
                    <p className="text-xs font-medium text-foreground">
                      Valor: {tipoValorAssistencia === "fixo"
                        ? formatCurrency(parseFloat(valorAssistencia) || 0)
                        : `${valorAssistencia}% do projeto (${formatCurrency((selectedSolicitacao.valor_solicitado * (parseFloat(valorAssistencia) || 0)) / 100)})`}
                    </p>
                  )}
                  {selectedGrupo.valor_assistencia != null && (
                    <p className="text-xs text-muted-foreground">
                      Salvo: {selectedGrupo.tipo_valor_assistencia === "fixo"
                        ? formatCurrency(selectedGrupo.valor_assistencia)
                        : `${selectedGrupo.valor_assistencia}%`}
                    </p>
                  )}
                </div>
              )}

              {/* Property details collapsible */}
              {(() => {
                const prop = (selectedSolicitacao as any).propriedades;
                if (!prop) return null;

                const TIPO_POSSE_LABELS: Record<string, string> = {
                  propria: "Própria", arrendada: "Arrendada", parceria: "Parceria",
                  comodato: "Comodato", posse: "Posse", assentamento: "Assentamento",
                };
                const FONTE_AGUA_LABELS: Record<string, string> = {
                  rio: "Rio", nascente: "Nascente", "poço_artesiano": "Poço artesiano",
                  represa: "Represa / Açude", irrigacao: "Irrigação", sequeiro: "Sequeiro", outro: "Outro",
                };
                const TIPO_SOLO_LABELS: Record<string, string> = {
                  argiloso: "Argiloso", arenoso: "Arenoso", siltoso: "Siltoso",
                  humifero: "Humífero", misto: "Misto",
                };

                const checks = [
                  { label: "Município/UF", ok: !!prop.municipio && !!prop.uf, value: prop.municipio ? `${prop.municipio}/${prop.uf}` : "Não informado" },
                  { label: "Matrícula do imóvel", ok: !!prop.matricula_imovel, value: prop.matricula_imovel || "Não informado" },
                  { label: "Código CAR", ok: !!prop.codigo_car, value: prop.codigo_car || "Não informado" },
                  { label: "Nº CCIR (INCRA)", ok: !!prop.numero_ccir, value: prop.numero_ccir || "Não informado" },
                  { label: "Nº ITR", ok: !!prop.numero_itr, value: prop.numero_itr || "Não informado" },
                  { label: "Tipo de posse", ok: !!prop.tipo_posse, value: TIPO_POSSE_LABELS[prop.tipo_posse] || prop.tipo_posse || "Não informado" },
                  { label: "Área total (ha)", ok: prop.area_total_ha > 0, value: prop.area_total_ha ? `${prop.area_total_ha} ha` : "Não informado" },
                  { label: "Reserva legal (ha)", ok: prop.area_reserva_legal_ha != null, value: prop.area_reserva_legal_ha != null ? `${prop.area_reserva_legal_ha} ha` : "Não informado" },
                  { label: "APP (ha)", ok: prop.area_app_ha != null, value: prop.area_app_ha != null ? `${prop.area_app_ha} ha` : "Não informado" },
                  { label: "Tipo de solo", ok: !!prop.tipo_solo, value: TIPO_SOLO_LABELS[prop.tipo_solo] || prop.tipo_solo || "Não informado" },
                  { label: "Fonte de água", ok: !!prop.fonte_agua, value: FONTE_AGUA_LABELS[prop.fonte_agua] || prop.fonte_agua || "Não informado" },
                  { label: "Geolocalização", ok: prop.latitude != null && prop.longitude != null, value: prop.latitude != null ? `${prop.latitude}, ${prop.longitude}` : "Não informado" },
                ];

                const missing = checks.filter(c => !c.ok).length;
                const allOk = missing === 0;

                return (
                  <div className="border rounded-md overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      onClick={() => setShowPropDetails(!showPropDetails)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Dados Cadastrais da Propriedade</span>
                        {allOk ? (
                          <Badge variant="default" className="text-xs gap-1"><CheckCircle className="h-3 w-3" /> Completo</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" /> {missing} campo{missing > 1 ? "s" : ""} pendente{missing > 1 ? "s" : ""}</Badge>
                        )}
                      </div>
                      {showPropDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showPropDetails && (
                      <div className="p-3 space-y-1">
                        <div className="grid gap-1 sm:grid-cols-2">
                          {checks.map((c) => (
                            <div key={c.label} className="flex items-start gap-2 text-xs py-1">
                              {c.ok ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                              )}
                              <div>
                                <span className="font-medium">{c.label}:</span>{" "}
                                <span className={c.ok ? "text-muted-foreground" : "text-destructive"}>{c.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {!allOk && (
                          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Cadastro incompleto — solicite ao produtor a atualização dos dados via chat.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

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
                  <Button size="sm" variant="outline" disabled={ai.isLoading}
                    onClick={() => ai.analyze("resumo_solicitacao", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                      status: selectedSolicitacao.status_solicitacao,
                    })}>
                    {ai.isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Resumo IA
                  </Button>
                  <Button size="sm" variant="outline" disabled={ai.isLoading}
                    onClick={() => ai.analyze("analise_documentos", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                      tipo_credito: selectedSolicitacao.tipo_credito,
                    })}>
                    <FileSearch className="h-3.5 w-3.5 mr-1" /> Análise Docs
                  </Button>
                  <Button size="sm" variant="outline" disabled={ai.isLoading}
                    onClick={() => ai.analyze("sugestao_engenheiro", {
                      propriedade: (selectedSolicitacao as any).propriedades,
                      cultura: selectedSolicitacao.cultura_principal,
                      area: selectedSolicitacao.area_cultivo_ha,
                      valor: selectedSolicitacao.valor_solicitado,
                      produto: (selectedSolicitacao as any).pronaf_produtos,
                    })}>
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

              {/* Shared group documents */}
              {selectedGrupoId && grupoDocsCompartilhados && grupoDocsCompartilhados.length > 0 && (
                <div className="border rounded-md p-4 space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Documentos Compartilhados do Grupo
                  </h4>
                  <div className="space-y-2">
                    {grupoDocsCompartilhados.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{doc.nome_documento || doc.nome_arquivo}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge
                            variant={doc.status_documento === "validado" ? "default" : doc.status_documento === "recusado" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {doc.status_documento}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateGrupoDocStatusMutation.mutate({ docId: doc.id, status: "validado" })} disabled={updateGrupoDocStatusMutation.isPending}>
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateGrupoDocStatusMutation.mutate({ docId: doc.id, status: "recusado" })} disabled={updateGrupoDocStatusMutation.isPending}>
                            <XCircle className="h-3 w-3 text-destructive" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                            const { data } = await supabase.storage.from("solicitacao-docs").createSignedUrl(doc.caminho_arquivo, 300);
                            if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          }}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents section (per-solicitation) */}
              <div className="border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Documentação do Produtor
                  </h4>
                  <Badge variant={selectedSolicitacao.docs_habilitados ? "default" : "outline"} className="text-xs">
                    {selectedSolicitacao.docs_habilitados ? "Upload liberado" : "Upload bloqueado"}
                  </Badge>
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
                          </div>
                          {uploaded ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{uploaded.nome_arquivo}</span>
                              <Badge
                                variant={uploaded.status_documento === "validado" ? "default" : uploaded.status_documento === "recusado" ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {uploaded.status_documento}
                              </Badge>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateDocStatusMutation.mutate({ docId: uploaded.id, status: "validado" })} disabled={updateDocStatusMutation.isPending}>
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateDocStatusMutation.mutate({ docId: uploaded.id, status: "recusado" })} disabled={updateDocStatusMutation.isPending}>
                                <XCircle className="h-3 w-3 text-destructive" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                                const { data } = await supabase.storage.from("solicitacao-docs").createSignedUrl(uploaded.caminho_arquivo, 300);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Não enviado</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {uploadedDocs?.filter((d) => !d.pronaf_documento_id).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                    <span className="text-muted-foreground truncate">{doc.nome_arquivo}</span>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={doc.status_documento === "validado" ? "default" : doc.status_documento === "recusado" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {doc.status_documento}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateDocStatusMutation.mutate({ docId: doc.id, status: "validado" })} disabled={updateDocStatusMutation.isPending}>
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateDocStatusMutation.mutate({ docId: doc.id, status: "recusado" })} disabled={updateDocStatusMutation.isPending}>
                        <XCircle className="h-3 w-3 text-destructive" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                        const { data } = await supabase.storage.from("solicitacao-docs").createSignedUrl(doc.caminho_arquivo, 300);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {!uploadedDocs?.length && (!detailPronafDocs?.length) && (
                  <p className="text-xs text-muted-foreground text-center py-2">Nenhum documento exigido ou enviado.</p>
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
                    {sortedEngenheiros((selectedSolicitacao as any)?.propriedades?.regiao_id).map((eng) => (
                      <SelectItem key={eng.id} value={eng.id}>
                        {eng.nome} (CREA: {eng.crea})
                        {(eng as any).regiao_id === (selectedSolicitacao as any)?.propriedades?.regiao_id && (selectedSolicitacao as any)?.propriedades?.regiao_id ? " ★" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action buttons — sequential flow */}
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {selectedSolicitacao.status_solicitacao === "pendente" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "em_analise_mesa" })} disabled={updateStatusMutation.isPending}>
                    Iniciar Análise
                  </Button>
                )}

                {selectedSolicitacao.status_solicitacao === "em_analise_mesa" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ 
                      id: selectedSolicitacao.id, 
                      status_solicitacao: "docs_pendentes_produtor",
                      extra: { docs_habilitados: true },
                      skipPaymentCalc: true,
                    })} disabled={updateStatusMutation.isPending}>
                      <FolderOpen className="h-3.5 w-3.5 mr-1" /> Solicitar Docs ao Produtor
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "docs_em_validacao" })} disabled={updateStatusMutation.isPending}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Docs já enviados, validar
                    </Button>
                  </>
                )}

                {selectedSolicitacao.status_solicitacao === "docs_pendentes_produtor" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "docs_em_validacao" })} disabled={updateStatusMutation.isPending}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Docs Recebidos, Validar
                  </Button>
                )}

                {selectedSolicitacao.status_solicitacao === "docs_em_validacao" && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "elegivel" })} disabled={updateStatusMutation.isPending}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Elegível
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ 
                      id: selectedSolicitacao.id, 
                      status_solicitacao: "docs_pendentes_produtor"
                    })} disabled={updateStatusMutation.isPending}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Docs Insuficientes
                    </Button>
                  </>
                )}

                {selectedSolicitacao.status_solicitacao === "elegivel" && (
                  <>
                    <Button size="sm" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "aguardando_laudo" })} disabled={updateStatusMutation.isPending}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Liberar p/ Engenheiro
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "pronta_para_banco" })} disabled={updateStatusMutation.isPending}>
                      <Send className="h-3.5 w-3.5 mr-1" /> Pronta p/ Banco
                    </Button>
                  </>
                )}

                {selectedSolicitacao.status_solicitacao === "aguardando_laudo" && (
                  <Button size="sm" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "pronta_para_banco" })} disabled={updateStatusMutation.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Marcar Pronta p/ Banco
                  </Button>
                )}

                {selectedSolicitacao.status_solicitacao === "pronta_para_banco" && selectedSolicitacao.status_banco === "nao_enviado" && (
                  <Button size="sm" onClick={() => {
                    updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "pronta_para_banco", extra: { status_banco: "enviado", data_envio_banco: new Date().toISOString() } });
                  }} disabled={updateStatusMutation.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Enviar ao Banco
                  </Button>
                )}
                {selectedSolicitacao.status_banco === "enviado" && (
                  <>
                    <Button size="sm" variant="destructive" onClick={() => {
                      updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: selectedSolicitacao.status_solicitacao, extra: { status_banco: "devolvido", data_retorno_banco: new Date().toISOString() } });
                    }} disabled={updateStatusMutation.isPending}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Devolvido pelo Banco
                    </Button>
                    <Button size="sm" onClick={() => {
                      updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: selectedSolicitacao.status_solicitacao, extra: { status_banco: "aprovado", data_retorno_banco: new Date().toISOString() } });
                    }} disabled={updateStatusMutation.isPending}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Aprovado pelo Banco
                    </Button>
                  </>
                )}
                {selectedSolicitacao.status_banco === "devolvido" && (
                  <Button size="sm" onClick={() => {
                    updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: selectedSolicitacao.status_solicitacao, extra: { status_banco: "enviado", data_envio_banco: new Date().toISOString() } });
                  }} disabled={updateStatusMutation.isPending}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Reenviar ao Banco
                  </Button>
                )}

                {!["reprovada", "pronta_para_banco"].includes(selectedSolicitacao.status_solicitacao) && (
                  <Button size="sm" variant="destructive" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: "reprovada" })} disabled={updateStatusMutation.isPending}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reprovar
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={selectedSolicitacao.docs_habilitados ? "secondary" : "outline"}
                  onClick={() => updateStatusMutation.mutate({
                    id: selectedSolicitacao.id,
                    status_solicitacao: selectedSolicitacao.status_solicitacao,
                    extra: { docs_habilitados: !selectedSolicitacao.docs_habilitados },
                    skipPaymentCalc: true,
                  })}
                  disabled={updateStatusMutation.isPending}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  {selectedSolicitacao.docs_habilitados ? "Docs Liberados ✓" : "Liberar Documentos"}
                </Button>

                <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: selectedSolicitacao.id, status_solicitacao: selectedSolicitacao.status_solicitacao })} disabled={updateStatusMutation.isPending}>
                  Salvar Alterações
                </Button>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
