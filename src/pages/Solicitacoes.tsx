import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberta: { label: "Aberta", variant: "default" },
  aceita: { label: "Aceita", variant: "secondary" },
  em_vistoria: { label: "Em vistoria", variant: "secondary" },
  aguardando_assinatura: { label: "Aguardando assinatura", variant: "outline" },
  finalizada: { label: "Finalizada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

interface SolicitacaoForm {
  propriedade_id: string;
  tipo_credito: string;
  cultura_principal: string;
  area_cultivo_ha: string;
  valor_solicitado: string;
  banco_destino: string;
  observacoes_produtor: string;
}

const emptyForm: SolicitacaoForm = {
  propriedade_id: "",
  tipo_credito: "custeio",
  cultura_principal: "",
  area_cultivo_ha: "",
  valor_solicitado: "",
  banco_destino: "",
  observacoes_produtor: "",
};

export default function Solicitacoes() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SolicitacaoForm>(emptyForm);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: produtorId } = useQuery({
    queryKey: ["produtor_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_produtor_id");
      return data as string;
    },
  });

  const { data: propriedades } = useQuery({
    queryKey: ["propriedades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("propriedades").select("id, nome_propriedade").order("nome_propriedade");
      if (error) throw error;
      return data;
    },
  });

  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_laudo")
        .select("*, propriedades(nome_propriedade)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("solicitacoes_laudo").insert({
        produtor_id: produtorId!,
        propriedade_id: form.propriedade_id,
        tipo_credito: form.tipo_credito,
        cultura_principal: form.cultura_principal,
        area_cultivo_ha: parseFloat(form.area_cultivo_ha) || 0,
        valor_solicitado: parseFloat(form.valor_solicitado) || 0,
        banco_destino: form.banco_destino,
        observacoes_produtor: form.observacoes_produtor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast({ title: "Solicitação criada com sucesso!" });
      setForm(emptyForm);
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "finalizada") return <CheckCircle2 className="h-4 w-4 text-success" />;
    if (status === "cancelada") return <AlertCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Minhas Solicitações</h1>
          <p className="text-muted-foreground">Acompanhe suas solicitações de laudo.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={!propriedades?.length}>
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Solicitação de Laudo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Propriedade *</Label>
                <Select value={form.propriedade_id} onValueChange={(v) => setForm((f) => ({ ...f, propriedade_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {propriedades?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nome_propriedade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de crédito *</Label>
                  <Select value={form.tipo_credito} onValueChange={(v) => setForm((f) => ({ ...f, tipo_credito: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custeio">Custeio</SelectItem>
                      <SelectItem value="investimento">Investimento</SelectItem>
                      <SelectItem value="comercializacao">Comercialização</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cultura principal *</Label>
                  <Input
                    value={form.cultura_principal}
                    onChange={(e) => setForm((f) => ({ ...f, cultura_principal: e.target.value }))}
                    placeholder="Ex: Soja, Milho"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área de cultivo (ha) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.area_cultivo_ha}
                    onChange={(e) => setForm((f) => ({ ...f, area_cultivo_ha: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor solicitado (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valor_solicitado}
                    onChange={(e) => setForm((f) => ({ ...f, valor_solicitado: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Banco destino</Label>
                <Input
                  value={form.banco_destino}
                  onChange={(e) => setForm((f) => ({ ...f, banco_destino: e.target.value }))}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes_produtor}
                  onChange={(e) => setForm((f) => ({ ...f, observacoes_produtor: e.target.value }))}
                  placeholder="Informações adicionais..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Solicitação"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!propriedades?.length && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Cadastre uma propriedade antes de solicitar um laudo.</p>
            <Button variant="link" className="mt-2" onClick={() => window.location.href = "/propriedades"}>
              Ir para Propriedades
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !solicitacoes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {solicitacoes.map((s) => {
            const st = statusMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <StatusIcon status={s.status_solicitacao} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{(s as any).propriedades?.nome_propriedade}</span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.cultura_principal} · {s.area_cultivo_ha} ha · {formatCurrency(s.valor_solicitado)}
                      {s.banco_destino ? ` · ${s.banco_destino}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(s.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
