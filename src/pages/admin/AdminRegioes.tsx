import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

export default function AdminRegioes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [uf, setUf] = useState("SP");

  const { data: regioes, isLoading } = useQuery({
    queryKey: ["admin_regioes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regioes").select("*").order("uf").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("regioes").update({ nome, uf }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("regioes").insert({ nome, uf });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_regioes"] });
      toast({ title: editing ? "Região atualizada!" : "Região criada!" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("regioes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_regioes"] });
      toast({ title: "Região removida." });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setNome(""); setUf("SP"); setOpen(true); };
  const openEdit = (r: any) => { setEditing(r); setNome(r.nome); setUf(r.uf); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Regiões</h1>
          <p className="text-muted-foreground">Gerencie as regiões de atuação para atribuição automática de engenheiros.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Nova Região</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !regioes?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma região cadastrada.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {regioes.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.uf}</TableCell>
                    <TableCell>{r.nome}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Região" : "Nova Região"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>UF</Label>
              <select value={uf} onChange={(e) => setUf(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nome da Região</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ribeirão Preto" />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={!nome.trim() || saveMutation.isPending} className="w-full">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
