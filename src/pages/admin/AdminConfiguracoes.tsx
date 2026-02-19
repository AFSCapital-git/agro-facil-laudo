import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [valorBase, setValorBase] = useState("");
  const [prazoDias, setPrazoDias] = useState("");

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
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!config) return;
      const { error } = await supabase
        .from("configuracoes_plataforma")
        .update({
          valor_base_laudo: parseFloat(valorBase) || 500,
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
        <h1 className="font-display text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure os parâmetros da plataforma.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Parâmetros de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Valor base por laudo (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={valorBase}
              onChange={(e) => setValorBase(e.target.value)}
            />
          </div>
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
