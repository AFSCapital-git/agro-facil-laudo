import { CheckCircle2, Circle, Clock, Send, FileText, Pen, ShieldCheck, Banknote, RotateCcw } from "lucide-react";

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

export default function StatusTimeline({ solicitacao, laudo }: StatusTimelineProps) {
  const events: TimelineEvent[] = [];

  // 1. Solicitação criada
  events.push({
    label: "Solicitação criada",
    date: solicitacao.created_at,
    icon: <FileText className="h-3.5 w-3.5" />,
    status: "done",
  });

  // 2. Aprovada pela Mesa
  events.push({
    label: "Aprovada pela Mesa",
    date: solicitacao.aprovado_mesa_em,
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    status: solicitacao.aprovado_mesa_em ? "done" : solicitacao.status_mesa === "rejeitada" ? "pending" : "active",
  });

  // 3. Vistoria / Laudo
  const laudoObj = laudo || (Array.isArray(solicitacao.laudos) ? solicitacao.laudos[0] : solicitacao.laudos);
  const laudoFinalizado = laudoObj?.status_laudo === "finalizado";
  const laudoEmAndamento = laudoObj && !laudoFinalizado;

  events.push({
    label: laudoFinalizado ? "Laudo finalizado" : laudoEmAndamento ? `Laudo: ${laudoObj.status_laudo === "em_vistoria" ? "em vistoria" : laudoObj.status_laudo === "aguardando_assinatura" ? "aguard. assinatura" : laudoObj.status_laudo}` : "Laudo técnico",
    date: laudoFinalizado ? laudoObj.updated_at : laudoEmAndamento ? laudoObj.created_at : null,
    icon: laudoFinalizado ? <Pen className="h-3.5 w-3.5" /> : <Pen className="h-3.5 w-3.5" />,
    status: laudoFinalizado ? "done" : laudoEmAndamento ? "active" : "pending",
  });

  // 4. Enviado ao Banco
  events.push({
    label: "Enviado ao Banco",
    date: solicitacao.data_envio_banco,
    icon: <Send className="h-3.5 w-3.5" />,
    status: solicitacao.data_envio_banco ? "done" : "pending",
  });

  // 5. Retorno do Banco
  if (solicitacao.data_retorno_banco || solicitacao.status_banco === "devolvido_banco" || solicitacao.status_banco === "aprovado_banco") {
    events.push({
      label: solicitacao.status_banco === "aprovado_banco" ? "Aprovado pelo Banco" : solicitacao.status_banco === "devolvido_banco" ? "Devolvido pelo Banco" : "Retorno do Banco",
      date: solicitacao.data_retorno_banco,
      icon: solicitacao.status_banco === "aprovado_banco" ? <Banknote className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />,
      status: solicitacao.data_retorno_banco ? "done" : "pending",
    });
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
