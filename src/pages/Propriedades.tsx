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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import PropriedadeForm from "@/components/propriedades/PropriedadeForm";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const TIPO_POSSE_LABELS: Record<string, string> = {
  propria: "Própria",
  arrendada: "Arrendada",
  parceria: "Parceria",
  comodato: "Comodato",
  posse: "Posse",
  assentamento: "Assentamento",
};

export interface PropriedadeFormData {
  nome_propriedade: string;
  endereco: string;
  municipio: string;
  uf: string;
  area_total_ha: string;
  latitude: string;
  longitude: string;
  codigo_car: string;
  matricula_imovel: string;
  numero_ccir: string;
  numero_itr: string;
  tipo_posse: string;
  area_reserva_legal_ha: string;
  area_app_ha: string;
  fonte_agua: string;
  tipo_solo: string;
}

export const emptyForm: PropriedadeFormData = {
  nome_propriedade: "",
  endereco: "",
  municipio: "",
  uf: "",
  area_total_ha: "",
  latitude: "",
  longitude: "",
  codigo_car: "",
  matricula_imovel: "",
  numero_ccir: "",
  numero_itr: "",
  tipo_posse: "propria",
  area_reserva_legal_ha: "",
  area_app_ha: "",
  fonte_agua: "",
  tipo_solo: "",
};

export { UF_LIST, TIPO_POSSE_LABELS };

export default function Propriedades() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PropriedadeFormData>(emptyForm);
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

  const up = (v: string) => v.toUpperCase().trim();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome_propriedade: up(form.nome_propriedade),
        endereco: up(form.endereco),
        municipio: up(form.municipio),
        uf: up(form.uf),
        area_total_ha: parseFloat(form.area_total_ha) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        codigo_car: up(form.codigo_car) || null,
        matricula_imovel: up(form.matricula_imovel) || "",
        numero_ccir: up(form.numero_ccir) || "",
        numero_itr: up(form.numero_itr) || "",
        tipo_posse: form.tipo_posse,
        area_reserva_legal_ha: parseFloat(form.area_reserva_legal_ha) || 0,
        area_app_ha: parseFloat(form.area_app_ha) || 0,
        fonte_agua: form.fonte_agua || "",
        tipo_solo: form.tipo_solo || "",
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
      municipio: (p as any).municipio || "",
      uf: (p as any).uf || "",
      area_total_ha: String(p.area_total_ha),
      latitude: p.latitude ? String(p.latitude) : "",
      longitude: p.longitude ? String(p.longitude) : "",
      codigo_car: p.codigo_car || "",
      matricula_imovel: (p as any).matricula_imovel || "",
      numero_ccir: (p as any).numero_ccir || "",
      numero_itr: (p as any).numero_itr || "",
      tipo_posse: (p as any).tipo_posse || "propria",
      area_reserva_legal_ha: String((p as any).area_reserva_legal_ha || ""),
      area_app_ha: String((p as any).area_app_ha || ""),
      fonte_agua: (p as any).fonte_agua || "",
      tipo_solo: (p as any).tipo_solo || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

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
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editId ? "Editar Propriedade" : "Nova Propriedade"}
              </DialogTitle>
            </DialogHeader>
            <PropriedadeForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              onCancel={resetForm}
              isPending={saveMutation.isPending}
              isEdit={!!editId}
            />
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
                  <TableHead>Município/UF</TableHead>
                  <TableHead className="text-right">Área (ha)</TableHead>
                  <TableHead>Posse</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {propriedades.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nome_propriedade}</TableCell>
                    <TableCell>
                      {(p as any).municipio ? `${(p as any).municipio}/${(p as any).uf}` : p.endereco}
                    </TableCell>
                    <TableCell className="text-right">{p.area_total_ha}</TableCell>
                    <TableCell>{TIPO_POSSE_LABELS[(p as any).tipo_posse] || (p as any).tipo_posse}</TableCell>
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
