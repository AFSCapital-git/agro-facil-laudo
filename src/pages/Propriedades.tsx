import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

interface PropriedadeForm {
  nome_propriedade: string;
  endereco: string;
  area_total_ha: string;
  latitude: string;
  longitude: string;
  codigo_car: string;
}

const emptyForm: PropriedadeForm = {
  nome_propriedade: "",
  endereco: "",
  area_total_ha: "",
  latitude: "",
  longitude: "",
  codigo_car: "",
};

export default function Propriedades() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropriedadeForm>(emptyForm);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: propriedades, isLoading } = useQuery({
    queryKey: ["propriedades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propriedades")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: produtorId } = useQuery({
    queryKey: ["produtor_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_produtor_id");
      return data as string;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_propriedade: form.nome_propriedade,
        endereco: form.endereco,
        area_total_ha: parseFloat(form.area_total_ha) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        codigo_car: form.codigo_car || null,
      };

      if (editId) {
        const { error } = await supabase
          .from("propriedades")
          .update(payload)
          .eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("propriedades")
          .insert({ ...payload, produtor_id: produtorId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["propriedades"] });
      toast({ title: editId ? "Propriedade atualizada!" : "Propriedade cadastrada!" });
      resetForm();
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("propriedades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["propriedades"] });
      toast({ title: "Propriedade removida." });
    },
    onError: (err: Error) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setOpen(false);
  };

  const openEdit = (p: NonNullable<typeof propriedades>[number]) => {
    setEditId(p.id);
    setForm({
      nome_propriedade: p.nome_propriedade,
      endereco: p.endereco,
      area_total_ha: String(p.area_total_ha),
      latitude: p.latitude ? String(p.latitude) : "",
      longitude: p.longitude ? String(p.longitude) : "",
      codigo_car: p.codigo_car || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const set = (field: keyof PropriedadeForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Minhas Propriedades</h1>
          <p className="text-muted-foreground">Gerencie suas propriedades rurais.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nova Propriedade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "Editar Propriedade" : "Nova Propriedade"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da propriedade *</Label>
                <Input value={form.nome_propriedade} onChange={set("nome_propriedade")} required />
              </div>
              <div className="space-y-2">
                <Label>Endereço *</Label>
                <Input value={form.endereco} onChange={set("endereco")} required placeholder="Cidade, Estado" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Área total (ha) *</Label>
                  <Input type="number" step="0.01" value={form.area_total_ha} onChange={set("area_total_ha")} required />
                </div>
                <div className="space-y-2">
                  <Label>Código CAR</Label>
                  <Input value={form.codigo_car} onChange={set("codigo_car")} placeholder="Opcional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.latitude} onChange={set("latitude")} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.longitude} onChange={set("longitude")} placeholder="Opcional" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !propriedades?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <MapPin className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma propriedade cadastrada.</p>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Cadastrar primeira propriedade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {propriedades.length} propriedade{propriedades.length > 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Área (ha)</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {propriedades.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome_propriedade}</TableCell>
                    <TableCell>{p.endereco}</TableCell>
                    <TableCell className="text-right">{p.area_total_ha}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}
