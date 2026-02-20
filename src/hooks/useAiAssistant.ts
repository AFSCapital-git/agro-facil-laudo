import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AiAction = "resumo_solicitacao" | "analise_documentos" | "sugestao_engenheiro" | "analise_banco";

export function useAiAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const { toast } = useToast();

  const analyze = async (action: AiAction, data: any) => {
    setIsLoading(true);
    setResult(null);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, data },
      });
      if (error) throw error;
      if (fnData?.error) throw new Error(fnData.error);
      setResult(fnData.content);
      return fnData.content;
    } catch (err: any) {
      toast({
        title: "Erro na análise IA",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => setResult(null);

  return { analyze, isLoading, result, clear };
}
