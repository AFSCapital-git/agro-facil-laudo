import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle, Clock, Send, FileText, Pen, ShieldCheck, Banknote, RotateCcw, XCircle, ClipboardCheck, FolderOpen } from "lucide-react";

interface TimelineEvent {
  label: string;
  date: string | null;
  icon: React.ReactNode;
  status: "done" | "active" | "pending";
}

interface StatusTimelineProps {
  solicitacao: any;
  laudo?: any;
}

const eventLabels: Record<string, string> = {
  SOLICITACAO_CRIADA: "Solicitação criada",
  STATUS_SOLICITACAO_MUDOU: "Solicitação",
  STATUS_LAUDO_MUDOU: "Laudo",
  STATUS_BANCO_MUDOU: "Banco",
  LAUDO_CRIADO: "Laudo criado",
  ENGENHEIRO_ATRIBUIDO: "Engenheiro atribuído",
};

const solicitacaoLabels: Record<string, string> = {
  pendente: "Pendente",
  em_analise_mesa: "Em Análise",
  docs_pendentes_produtor: "Docs Pendentes",
  docs_em_validacao: "Validando Docs",
  elegivel: "Elegível",
  reprovada: "Reprovada",
  aguardando_laudo: "Aguard. Laudo",
  pronta_para_banco: "Pronta p/ Banco",
};

const bancoLabels: Record<string, string> = {
  nao_enviado: "Não enviado",
  enviado: "Enviado",
  devolvido: "Devolvido",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
};

const laudoLabels: Record<string, string> = {
  em_vistoria: "Em vistoria",
  aguardando_assinatura: "Aguard. assinatura",
  finalizado: "Finalizado",
};

export default function StatusTimeline({ solicitacao, laudo }: StatusTimelineProps) {
  const { data: eventos } = useQuery({
    queryKey: ["solicitacao_eventos", solicitacao?.id],
    enabled: !!solicitacao?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacao_eventos")
        .select("*")
        .eq("solicitacao_id", solicitacao.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const events: TimelineEvent[] = [];

  if (eventos && eventos.length > 0) {
    eventos.forEach((ev: any) => {
      let label = eventLabels[ev.tipo_evento] || ev.tipo_evento;
      let icon: React.ReactNode = <Circle className="h-3.5 w-3.5" />;

      if (ev.tipo_evento === "SOLICITACAO_CRIADA") {
        icon = <FileText className="h-3.5 w-3.5" />;
        label = "Solicitação criada";
      } else if (ev.tipo_evento === "STATUS_SOLICITACAO_MUDOU") {
        label = solicitacaoLabels[ev.valor_novo] || ev.valor_novo;
        icon = ev.valor_novo === "reprovada" ? <XCircle className="h-3.5 w-3.5" /> :
               ev.valor_novo === "elegivel" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
               ev.valor_novo === "pronta_para_banco" ? <Send className="h-3.5 w-3.5" /> :
               ev.valor_novo === "docs_pendentes_produtor" ? <FolderOpen className="h-3.5 w-3.5" /> :
               <ClipboardCheck className="h-3.5 w-3.5" />;
      } else if (ev.tipo_evento === "STATUS_LAUDO_MUDOU" || ev.tipo_evento === "LAUDO_CRIADO") {
        label = ev.tipo_evento === "LAUDO_CRIADO" ? "Laudo criado" : (laudoLabels[ev.valor_novo] || ev.valor_novo);
        icon = ev.valor_novo === "finalizado" ? <ShieldCheck className="h-3.5 w-3.5" /> : <Pen className="h-3.5 w-3.5" />;
      } else if (ev.tipo_evento === "STATUS_BANCO_MUDOU") {
        label = bancoLabels[ev.valor_novo] || ev.valor_novo;
        icon = ev.valor_novo === "aprovado" ? <Banknote className="h-3.5 w-3.5" /> :
               ev.valor_novo === "devolvido" ? <RotateCcw className="h-3.5 w-3.5" /> :
               ev.valor_novo === "reprovado" ? <XCircle className="h-3.5 w-3.5" /> :
               <Send className="h-3.5 w-3.5" />;
      } else if (ev.tipo_evento === "ENGENHEIRO_ATRIBUIDO") {
        label = "Eng. atribuído";
        icon = <CheckCircle2 className="h-3.5 w-3.5" />;
      }

      events.push({ label, date: ev.created_at, icon, status: "done" });
    });

    const laudoObj = laudo || (Array.isArray(solicitacao.laudos) ? solicitacao.laudos?.[0] : solicitacao.laudos);
    if (laudoObj && laudoObj.status_laudo !== "finalizado") {
      events.push({
        label: laudoLabels[laudoObj.status_laudo] || laudoObj.status_laudo,
        date: null,
        icon: <Pen className="h-3.5 w-3.5" />,
        status: "active",
      });
    }
    if (solicitacao.status_banco === "nao_enviado" && solicitacao.status_solicitacao === "pronta_para_banco") {
      events.push({ label: "Envio ao Banco", date: null, icon: <Send className="h-3.5 w-3.5" />, status: "pending" });
    }
  } else {
    // Fallback: build from current status fields
    events.push({ label: "Solicitação criada", date: solicitacao.created_at, icon: <FileText className="h-3.5 w-3.5" />, status: "done" });

    const solStatus = solicitacao.status_solicitacao;
    const solDone = ["elegivel", "aguardando_laudo", "pronta_para_banco"].includes(solStatus);
    events.push({
      label: solicitacaoLabels[solStatus] || solStatus,
      date: solicitacao.aprovado_mesa_em,
      icon: solStatus === "reprovada" ? <XCircle className="h-3.5 w-3.5" /> : <ClipboardCheck className="h-3.5 w-3.5" />,
      status: solDone ? "done" : solStatus === "pendente" ? "pending" : "active",
    });

    const laudoObj = laudo || (Array.isArray(solicitacao.laudos) ? solicitacao.laudos?.[0] : solicitacao.laudos);
    const laudoFinalizado = laudoObj?.status_laudo === "finalizado";
    const laudoEmAndamento = laudoObj && !laudoFinalizado;
    events.push({
      label: laudoFinalizado ? "Laudo finalizado" : laudoEmAndamento ? (laudoLabels[laudoObj.status_laudo] || laudoObj.status_laudo) : "Laudo técnico",
      date: laudoFinalizado ? laudoObj.updated_at : laudoEmAndamento ? laudoObj.created_at : null,
      icon: laudoFinalizado ? <ShieldCheck className="h-3.5 w-3.5" /> : <Pen className="h-3.5 w-3.5" />,
      status: laudoFinalizado ? "done" : laudoEmAndamento ? "active" : "pending",
    });

    events.push({
      label: bancoLabels[solicitacao.status_banco] || "Envio ao Banco",
      date: solicitacao.data_envio_banco,
      icon: solicitacao.status_banco === "aprovado" ? <Banknote className="h-3.5 w-3.5" /> :
            solicitacao.status_banco === "devolvido" ? <RotateCcw className="h-3.5 w-3.5" /> :
            <Send className="h-3.5 w-3.5" />,
      status: solicitacao.status_banco !== "nao_enviado" ? "done" : "pending",
    });

    if (solicitacao.data_retorno_banco) {
      events.push({
        label: solicitacao.status_banco === "aprovado" ? "Aprovado pelo Banco" :
               solicitacao.status_banco === "reprovado" ? "Reprovado pelo Banco" :
               solicitacao.status_banco === "devolvido" ? "Devolvido pelo Banco" : "Retorno do Banco",
        date: solicitacao.data_retorno_banco,
        icon: solicitacao.status_banco === "aprovado" ? <Banknote className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />,
        status: "done",
      });
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex items-start gap-0 overflow-x-auto py-2">
      {events.map((event, i) => (
        <div key={i} className="flex items-start min-w-0">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex items-center justify-center rounded-full h-7 w-7 shrink-0 ${
                event.status === "done"
                  ? "bg-primary text-primary-foreground"
                  : event.status === "active"
                  ? "bg-primary/20 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {event.icon}
            </div>
            <div className="text-center max-w-[100px]">
              <p className={`text-[10px] leading-tight font-medium ${event.status === "pending" ? "text-muted-foreground" : "text-foreground"}`}>
                {event.label}
              </p>
              {event.date && (
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{formatDate(event.date)}</p>
              )}
            </div>
          </div>
          {i < events.length - 1 && (
            <div className={`h-[2px] w-8 mt-3.5 shrink-0 ${event.status === "done" ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
