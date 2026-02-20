import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [valorBase, setValorBase] = useState("");
  const [prazoDias, setPrazoDias] = useState("");
  const [percentualTaxa, setPercentualTaxa] = useState("");
  const [tipoRemuneracao, setTipoRemuneracao] = useState<"fixo" | "percentual">("fixo");

  const { data: config } = useQuery({
    queryKey: ["admin_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_plataforma")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setValorBase(String(config.valor_base_laudo));
      setPrazoDias(String(config.prazo_padrao_pagamento_dias));
      setPercentualTaxa(String(config.percentual_taxa_plataforma));
      setTipoRemuneracao(config.percentual_taxa_plataforma > 0 ? "percentual" : "fixo");
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const { error } = await supabase
        .from("configuracoes_plataforma")
        .update({
          valor_base_laudo: tipoRemuneracao === "fixo" ? (parseFloat(valorBase) || 500) : 0,
          percentual_taxa_plataforma: tipoRemuneracao === "percentual" ? (parseFloat(percentualTaxa) || 0) : 0,
          prazo_padrao_pagamento_dias: parseInt(prazoDias) || 7,
        })
        .eq("id", config.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_config"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configurações Gerais</h1>
        <p className="text-muted-foreground">
          Valores padrão da plataforma. A remuneração do engenheiro é configurada individualmente por produto na aba{" "}
          <span className="font-medium text-foreground">Produtos PRONAF</span>.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Remuneração do Engenheiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={tipoRemuneracao}
            onValueChange={(v) => setTipoRemuneracao(v as "fixo" | "percentual")}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="fixo" id="tipo-fixo" />
              <Label htmlFor="tipo-fixo">Valor fixo (R$)</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="percentual" id="tipo-pct" />
              <Label htmlFor="tipo-pct">Percentual da receita (%)</Label>
            </div>
          </RadioGroup>

          {tipoRemuneracao === "fixo" ? (
            <div className="space-y-2">
              <Label>Valor base por laudo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorBase}
                onChange={(e) => setValorBase(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Percentual sobre o valor solicitado (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentualTaxa}
                onChange={(e) => setPercentualTaxa(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Prazos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Prazo padrão de pagamento (dias)</Label>
            <Input
              type="number"
              value={prazoDias}
              onChange={(e) => setPrazoDias(e.target.value)}
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}