import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Landmark, Plus, Pencil } from "lucide-react";

export default function AdminBancos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ativo, setAtivo] = useState(true);

  const { data: bancos, isLoading } = useQuery({
    queryKey: ["admin_bancos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bancos_parceiros").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("bancos_parceiros").update({ nome, codigo, ativo }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bancos_parceiros").insert({ nome, codigo, ativo });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_bancos"] });
      toast({ title: editing ? "Banco atualizado!" : "Banco adicionado!" });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openNew = () => { setEditing(null); setNome(""); setCodigo(""); setAtivo(true); setOpen(true); };
  const openEdit = (b: any) => { setEditing(b); setNome(b.nome); setCodigo(b.codigo); setAtivo(b.ativo); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditing(null); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Bancos Parceiros</h1>
          <p className="text-muted-foreground">Gerencie os bancos disponíveis para envio de solicitações.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Novo Banco</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !bancos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Landmark className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum banco cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {bancos.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{b.codigo || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={b.ativo ? "default" : "outline"}>{b.ativo ? "Ativo" : "Inativo"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
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
            <DialogTitle>{editing ? "Editar Banco" : "Novo Banco"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Banco</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Banco do Brasil" />
            </div>
            <div className="space-y-2">
              <Label>Código (opcional)</Label>
              <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: 001" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
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
