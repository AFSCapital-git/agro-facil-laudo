import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Bot, User, ChevronDown, ChevronUp, FileSearch } from "lucide-react";

interface EnquadramentoCardProps {
  enquadramentoId: string;
}

export default function EnquadramentoCard({ enquadramentoId }: EnquadramentoCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  const { data: consulta } = useQuery({
    queryKey: ["enquadramento", enquadramentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulta_enquadramento")
        .select("*")
        .eq("id", enquadramentoId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: mensagens } = useQuery({
    queryKey: ["enquadramento_msgs", enquadramentoId],
    enabled: showHistory,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consulta_enquadramento_mensagens")
        .select("*")
        .eq("consulta_id", enquadramentoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (!consulta) return null;

  return (
    <Card className="border-green-500/30 bg-green-50/50 dark:bg-green-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-green-600" />
            Enquadramento IA
          </CardTitle>
          <Badge variant={consulta.status === "finalizado" ? "default" : "outline"} className="text-xs">
            {consulta.status === "finalizado" ? "Concluído" : "Em andamento"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {consulta.produto_sugerido_nome && (
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <strong>{consulta.produto_sugerido_nome}</strong>
            </div>
            {consulta.capitulo_mcr && (
              <p className="text-muted-foreground text-xs">MCR: {consulta.capitulo_mcr}</p>
            )}
            {consulta.condicoes_resumo && (
              <p className="text-xs">{consulta.condicoes_resumo}</p>
            )}
            {consulta.justificativa && (
              <p className="text-xs text-muted-foreground italic">{consulta.justificativa}</p>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-center text-xs gap-1"
        >
          {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showHistory ? "Ocultar conversa" : "Ver conversa completa"}
        </Button>

        {showHistory && mensagens && (
          <ScrollArea className="max-h-60 rounded-lg border bg-background p-3">
            <div className="space-y-2">
              {mensagens.map((m: any) => (
                <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <Bot className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  )}
                  <div
                    className={`text-xs rounded-lg px-2 py-1 max-w-[85%] ${
                      m.role === "user"
                        ? "bg-green-600 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {m.content.replace(/```enquadramento[\s\S]*?```/g, "").substring(0, 500)}
                    {m.content.length > 500 ? "..." : ""}
                  </div>
                  {m.role === "user" && (
                    <User className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
