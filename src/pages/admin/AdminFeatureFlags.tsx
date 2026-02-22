import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ToggleLeft, Settings } from "lucide-react";

interface FeatureFlag {
  id: string;
  chave: string;
  valor: any;
  escopo_tipo: string;
  escopo_id: string | null;
  descricao: string;
  ativo: boolean;
}

const ESCOPO_LABELS: Record<string, string> = {
  global: "Global",
  banco: "Banco",
  uf: "UF",
  produto: "Produto",
};

export default function AdminFeatureFlags() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<FeatureFlag | null>(null);
  const [form, setForm] = useState({ chave: "", descricao: "", escopo_tipo: "global", escopo_id: "", valor: "true" });
  const [filterEscopo, setFilterEscopo] = useState("all");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature_flags"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feature_flags")
        .select("*")
        .order("chave");
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const { data: bancos } = useQuery({
    queryKey: ["bancos_parceiros_all"],
    queryFn: async () => {
      const { data } = await supabase.from("bancos_parceiros").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  const { data: produtos } = useQuery({
    queryKey: ["pronaf_produtos_all"],
    queryFn: async () => {
      const { data } = await supabase.from("pronaf_produtos").select("id, nome").order("nome");
      return data ?? [];
    },
  });

  const UF_LIST = [
    "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
    "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
  ];

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsedValor: any;
      try {
        parsedValor = JSON.parse(form.valor);
      } catch {
        parsedValor = form.valor;
      }
      const payload = {
        chave: form.chave,
        descricao: form.descricao,
        escopo_tipo: form.escopo_tipo,
        escopo_id: form.escopo_tipo === "global" ? null : form.escopo_id || null,
        valor: parsedValor,
      };
      if (editing) {
        const { error } = await (supabase as any).from("feature_flags").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("feature_flags").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature_flags"] });
      setOpenDialog(false);
      toast({ title: editing ? "Flag atualizada!" : "Flag criada!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await (supabase as any).from("feature_flags").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature_flags"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("feature_flags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature_flags"] });
      toast({ title: "Flag removida!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ chave: "", descricao: "", escopo_tipo: "global", escopo_id: "", valor: "true" });
    setOpenDialog(true);
  };

  const openEdit = (f: FeatureFlag) => {
    setEditing(f);
    setForm({
      chave: f.chave,
      descricao: f.descricao,
      escopo_tipo: f.escopo_tipo,
      escopo_id: f.escopo_id ?? "",
      valor: JSON.stringify(f.valor),
    });
    setOpenDialog(true);
  };

  const getEscopoLabel = (f: FeatureFlag) => {
    if (f.escopo_tipo === "global") return "Global";
    if (f.escopo_tipo === "banco") return bancos?.find((b) => b.id === f.escopo_id)?.nome ?? f.escopo_id;
    if (f.escopo_tipo === "produto") return produtos?.find((p) => p.id === f.escopo_id)?.nome ?? f.escopo_id;
    if (f.escopo_tipo === "uf") return f.escopo_id;
    return f.escopo_id ?? "";
  };

  const filtered = (flags ?? []).filter((f) => filterEscopo === "all" || f.escopo_tipo === filterEscopo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Feature Flags</h1>
          <p className="text-muted-foreground">Gerencie funcionalidades por escopo (global, banco, UF, produto).</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Flag
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={filterEscopo} onValueChange={setFilterEscopo}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="global">Global</SelectItem>
            <SelectItem value="banco">Banco</SelectItem>
            <SelectItem value="uf">UF</SelectItem>
            <SelectItem value="produto">Produto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ToggleLeft className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma flag configurada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chave</TableHead>
                  <TableHead>Escopo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-20">Ativo</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer" onClick={() => openEdit(f)}>
                    <TableCell className="font-mono text-sm">{f.chave}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ESCOPO_LABELS[f.escopo_tipo] ?? f.escopo_tipo}
                      </Badge>
                      {f.escopo_id && <span className="ml-1 text-xs text-muted-foreground">{getEscopoLabel(f)}</span>}
                    </TableCell>
                    <TableCell className="text-xs max-w-32 truncate">{JSON.stringify(f.valor)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{f.descricao}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={f.ativo}
                        onCheckedChange={(v) => toggleMutation.mutate({ id: f.id, ativo: v })}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir flag "{f.chave}"?</AlertDialogTitle>
                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(f.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Flag" : "Nova Feature Flag"}</DialogTitle>
            <DialogDescription>Configure a flag e seu escopo de aplicação.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div>
              <Label>Chave *</Label>
              <Input
                value={form.chave}
                onChange={(e) => setForm({ ...form, chave: e.target.value })}
                placeholder="ex: exige_car, valida_zarc"
                required
                className="font-mono"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="O que essa flag controla?"
              />
            </div>
            <div>
              <Label>Escopo</Label>
              <Select value={form.escopo_tipo} onValueChange={(v) => setForm({ ...form, escopo_tipo: v, escopo_id: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="uf">UF</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.escopo_tipo === "banco" && (
              <div>
                <Label>Banco</Label>
                <Select value={form.escopo_id} onValueChange={(v) => setForm({ ...form, escopo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {bancos?.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.escopo_tipo === "uf" && (
              <div>
                <Label>UF</Label>
                <Select value={form.escopo_id} onValueChange={(v) => setForm({ ...form, escopo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {UF_LIST.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.escopo_tipo === "produto" && (
              <div>
                <Label>Produto</Label>
                <Select value={form.escopo_id} onValueChange={(v) => setForm({ ...form, escopo_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {produtos?.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Valor (JSON)</Label>
              <Input
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder='true, false, {"key": "value"}'
                className="font-mono"
              />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={saveMutation.isPending || !form.chave}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
