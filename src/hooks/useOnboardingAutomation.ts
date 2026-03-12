import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  endereco: string;
  municipio: string;
  uf: string;
  telefone: string;
  email: string;
  situacao_cadastral: string;
  data_situacao_cadastral: string;
  data_inicio_atividade: string;
  natureza_juridica: string;
  porte: string;
  cnae_fiscal_descricao: string;
  dados_completos: Record<string, any>;
}

export function useCnpjLookup() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CnpjData | null>(null);
  const { toast } = useToast();

  const lookup = useCallback(async (cnpj: string): Promise<CnpjData | null> => {
    const clean = cnpj.replace(/\D/g, "");
    if (clean.length !== 14) {
      toast({ title: "CNPJ inválido", description: "Deve ter 14 dígitos", variant: "destructive" });
      return null;
    }

    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("consulta-cnpj", {
        body: { cnpj: clean },
      });

      if (error) throw error;
      if (result?.error) {
        toast({ title: "Erro na consulta", description: result.error, variant: "destructive" });
        return null;
      }

      setData(result);
      toast({ title: "CNPJ encontrado!", description: `${result.razao_social} — ${result.situacao_cadastral}` });
      return result;
    } catch (err: any) {
      toast({ title: "Erro ao consultar CNPJ", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { lookup, loading, data };
}

export function useDocumentExtraction() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const extract = useCallback(async (file: File, tipoDocumento: string) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tipo_documento", tipoDocumento);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/extract-document-data`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Falha na extração");

      const result = await response.json();
      if (result.extracted) {
        toast({ title: "Dados extraídos!", description: "Campos preenchidos automaticamente a partir do documento." });
      }
      return result.extracted || null;
    } catch (err: any) {
      toast({ title: "Erro na extração", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { extract, loading };
}

export function useComplianceValidation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validate = useCallback(async (empresaId: string, cnpj?: string) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("validate-compliance", {
        body: { empresa_id: empresaId, cnpj, action: "validate_all" },
      });

      if (error) throw error;

      if (result?.has_expired) {
        toast({
          title: "⚠️ Documentos vencidos detectados",
          description: "A empresa foi marcada como pendente de renovação.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Validação concluída", description: "Itens de compliance atualizados automaticamente." });
      }

      return result;
    } catch (err: any) {
      toast({ title: "Erro na validação", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return { validate, loading };
}
