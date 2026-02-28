import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, ShieldCheck, Search, AlertTriangle, Leaf } from "lucide-react";

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface ZarcRegra {
  id: string;
  cultura: string;
  uf: string;
  municipio: string;
  tipo_solo: string;
  ciclo: string;
  periodo_plantio_inicio: number | null;
  periodo_plantio_fim: number | null;
  risco: string;
  safra: string;
  observacoes: string;
  ativo: boolean;
}

const emptyForm = {
  cultura: "",
  uf: "",
  municipio: "",
  tipo_solo: "",
  ciclo: "",
  periodo_plantio_inicio: "",
  periodo_plantio_fim: "",
  risco: "medio",
  safra: "",
  observacoes: "",
};

export default function AdminZarc() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ZarcRegra | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterUf, setFilterUf] = useState("all");
  const [filterCultura, setFilterCultura] = useState("");

  const { data: regras, isLoading } = useQuery({
    queryKey: ["zarc_regras"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("zarc_regras")
        .select("*")
        .order("cultura")
        .order("uf");
      if (error) throw error;
      return data as ZarcRegra[];
    },
  });

  const filtered = regras?.filter((r) => {
    if (filterUf !== "all" && r.uf !== filterUf) return false;
    if (filterCultura && !r.cultura.toLowerCase().includes(filterCultura.toLowerCase())) return false;
    return true;
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        cultura: form.cultura,
        uf: form.uf,
        municipio: form.municipio,
        tipo_solo: form.tipo_solo,
        ciclo: form.ciclo,
        periodo_plantio_inicio: form.periodo_plantio_inicio ? parseInt(form.periodo_plantio_inicio) : null,
        periodo_plantio_fim: form.periodo_plantio_fim ? parseInt(form.periodo_plantio_fim) : null,
        risco: form.risco,
        safra: form.safra,
        observacoes: form.observacoes,
      };
      if (editing) {
        const { error } = await (supabase as any).from("zarc_regras").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("zarc_regras").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zarc_regras"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: editing ? "Regra atualizada!" : "Regra criada!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("zarc_regras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zarc_regras"] });
      toast({ title: "Regra removida!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (r: ZarcRegra) => {
    setEditing(r);
    setForm({
      cultura: r.cultura,
      uf: r.uf,
      municipio: r.municipio,
      tipo_solo: r.tipo_solo,
      ciclo: r.ciclo,
      periodo_plantio_inicio: r.periodo_plantio_inicio?.toString() ?? "",
      periodo_plantio_fim: r.periodo_plantio_fim?.toString() ?? "",
      risco: r.risco,
      safra: r.safra,
      observacoes: r.observacoes ?? "",
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const riscoBadge = (risco: string) => {
    if (risco === "baixo") return <Badge variant="default">Baixo</Badge>;
    if (risco === "alto") return <Badge variant="destructive">Alto</Badge>;
    return <Badge variant="secondary">Médio</Badge>;
  };

  const totalRegras = regras?.length ?? 0;
  const riscoBaixo = regras?.filter((r) => r.risco === "baixo").length ?? 0;
  const riscoAlto = regras?.filter((r) => r.risco === "alto").length ?? 0;
  const culturas = new Set(regras?.map((r) => r.cultura)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Motor ZARC"
        description="Gerencie regras de zoneamento agrícola de risco climático."
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Nova Regra</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Regra ZARC" : "Nova Regra ZARC"}</DialogTitle>
                <DialogDescription>Defina os parâmetros de zoneamento.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cultura *</Label>
                    <Input value={form.cultura} onChange={(e) => setForm({ ...form, cultura: e.target.value })} required />
                  </div>
                  <div>
                    <Label>UF *</Label>
                    <Select value={form.uf} onValueChange={(v) => setForm({ ...form, uf: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Município</Label>
                    <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tipo de Solo</Label>
                    <Input value={form.tipo_solo} onChange={(e) => setForm({ ...form, tipo_solo: e.target.value })} placeholder="Ex: Arenoso, Argiloso" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ciclo</Label>
                    <Input value={form.ciclo} onChange={(e) => setForm({ ...form, ciclo: e.target.value })} placeholder="Ex: Precoce, Médio" />
                  </div>
                  <div>
                    <Label>Safra</Label>
                    <Input value={form.safra} onChange={(e) => setForm({ ...form, safra: e.target.value })} placeholder="Ex: 2025/2026" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Decêndio Início</Label>
                    <Input type="number" min={1} max={36} value={form.periodo_plantio_inicio} onChange={(e) => setForm({ ...form, periodo_plantio_inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Decêndio Fim</Label>
                    <Input type="number" min={1} max={36} value={form.periodo_plantio_fim} onChange={(e) => setForm({ ...form, periodo_plantio_fim: e.target.value })} />
                  </div>
                  <div>
                    <Label>Risco *</Label>
                    <Select value={form.risco} onValueChange={(v) => setForm({ ...form, risco: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixo">Baixo</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={saveMutation.isPending || !form.cultura || !form.uf}>
                    {saveMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} title="Total Regras" value={String(totalRegras)} loading={isLoading} delay={0} />
        <StatCard icon={<Leaf className="h-4 w-4" />} title="Culturas Distintas" value={String(culturas)} loading={isLoading} delay={100} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} title="Risco Baixo" value={String(riscoBaixo)} loading={isLoading} delay={200} />
        <StatCard icon={<AlertTriangle className="h-4 w-4" />} title="Risco Alto" value={String(riscoAlto)} loading={isLoading} delay={300} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 flex gap-3 items-end">
          <div className="w-40">
            <Label className="text-xs font-medium text-muted-foreground">Filtrar UF</Label>
            <Select value={filterUf} onValueChange={setFilterUf}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {UFS.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 max-w-xs">
            <Label className="text-xs font-medium text-muted-foreground">Filtrar Cultura</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9"
                placeholder="Buscar cultura..."
                value={filterCultura}
                onChange={(e) => setFilterCultura(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
        </CardContent></Card>
      ) : !filtered?.length ? (
        <EmptyState icon={<ShieldCheck className="h-6 w-6" />} title="Nenhuma regra ZARC encontrada" description={filterUf !== "all" || filterCultura ? "Tente ajustar os filtros." : "Cadastre a primeira regra de zoneamento."} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cultura</TableHead>
                <TableHead>UF</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Solo</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead>Decêndios</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Safra</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.cultura}</TableCell>
                  <TableCell>{r.uf}</TableCell>
                  <TableCell>{r.municipio || "—"}</TableCell>
                  <TableCell>{r.tipo_solo || "—"}</TableCell>
                  <TableCell>{r.ciclo || "—"}</TableCell>
                  <TableCell>
                    {r.periodo_plantio_inicio && r.periodo_plantio_fim
                      ? `${r.periodo_plantio_inicio}–${r.periodo_plantio_fim}`
                      : "—"}
                  </TableCell>
                  <TableCell>{riscoBadge(r.risco)}</TableCell>
                  <TableCell>{r.safra || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
