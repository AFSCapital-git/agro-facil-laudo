import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoIcon = (tipo: string) => {
  switch (tipo) {
    case "sucesso": return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case "alerta": return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    case "erro": return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    default: return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
};

export function NotificacoesBell() {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();
  const navigate = useNavigate();

  const handleClick = (n: typeof notificacoes[0]) => {
    if (!n.lida) marcarLida(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {naoLidas > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {naoLidas > 99 ? "99+" : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">Notificações</h4>
          {naoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => marcarTodasLidas()}
            >
              <CheckCheck className="h-3 w-3 mr-1" /> Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((n) => (
                <button
                  key={n.id}
                  className={cn(
                    "flex gap-3 w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                    !n.lida && "bg-primary/5"
                  )}
                  onClick={() => handleClick(n)}
                >
                  {tipoIcon(n.tipo)}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm leading-tight", !n.lida && "font-medium")}>
                      {n.titulo}
                    </p>
                    {n.mensagem && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {n.mensagem}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!n.lida && (
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
