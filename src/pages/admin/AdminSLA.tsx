import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_analise_mesa: "Em Análise Mesa",
  docs_pendentes_produtor: "Docs Pendentes Produtor",
  docs_em_validacao: "Docs em Validação",
  elegivel: "Elegível",
  aguardando_laudo: "Aguardando Laudo",
  pronta_para_banco: "Pronta para Banco",
};

export default function AdminSLA() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [slaGlobal, setSlaGlobal] = useState("");

  const { data: slaConfig, isLoading } = useQuery({
    queryKey: ["admin_sla"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sla_config").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: config } = useQuery({
    queryKey: ["admin_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracoes_plataforma").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) setSlaGlobal(String((config as any).sla_global_dias ?? 15));
  }, [config]);

  useEffect(() => {
    if (slaConfig) {
      const m: Record<string, number> = {};
      slaConfig.forEach((s) => { m[s.id] = s.prazo_horas; });
      setEdits(m);
    }
  }, [slaConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const promises = Object.entries(edits).map(([id, prazo_horas]) =>
        supabase.from("sla_config").update({ prazo_horas }).eq("id", id)
      );
      if (config) {
        promises.push(
          supabase.from("configuracoes_plataforma").update({ sla_global_dias: parseInt(slaGlobal) || 15 }).eq("id", config.id) as any
        );
      }
      await Promise.all(promises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_sla"] });
      qc.invalidateQueries({ queryKey: ["admin_config"] });
      toast({ title: "SLA salvo com sucesso!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Configuração de SLA</h1>
        <p className="text-muted-foreground">Defina prazos máximos por etapa e o prazo global das solicitações.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Prazo Global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Prazo máximo total (dias)</Label>
            <Input type="number" value={slaGlobal} onChange={(e) => setSlaGlobal(e.target.value)} className="max-w-32" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prazo por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="w-40">Prazo (horas)</TableHead>
                  <TableHead className="w-32">Equivalente</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slaConfig?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{statusLabels[s.status_solicitacao] ?? s.status_solicitacao}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={edits[s.id] ?? s.prazo_horas}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: parseInt(e.target.value) || 0 }))}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {((edits[s.id] ?? s.prazo_horas) / 24).toFixed(1)} dias
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Salvando..." : "Salvar SLA"}
      </Button>
    </div>
  );
}
