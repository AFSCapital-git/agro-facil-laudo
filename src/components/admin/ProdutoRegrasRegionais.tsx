import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, MapPin } from "lucide-react";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const CAMPOS_DISPONIVEIS = [
  { key: "codigo_car", label: "CAR (Cadastro Ambiental Rural)" },
  { key: "titulo_posse", label: "Título de Posse / Escritura" },
  { key: "licenca_ambiental", label: "Licença Ambiental" },
  { key: "outorga_agua", label: "Outorga de Uso de Água" },
  { key: "dap_caf", label: "DAP/CAF" },
  { key: "geo_referenciamento", label: "Georreferenciamento" },
  { key: "plano_manejo", label: "Plano de Manejo" },
  { key: "ater", label: "Declaração ATER" },
];

interface RegraRegional {
  id: string;
  produto_id: string;
  uf: string;
  campos_obrigatorios: string[];
  documentos_adicionais: { nome: string; descricao: string; obrigatorio: boolean }[];
  ativo: boolean;
}

interface Props {
  produtoId: string;
  produtoNome: string;
}

export default function ProdutoRegrasRegionais({ produtoId, produtoNome }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraRegional | null>(null);
  const [formUf, setFormUf] = useState("");
  const [formCampos, setFormCampos] = useState<string[]>([]);
  const [formDocs, setFormDocs] = useState<{ nome: string; descricao: string; obrigatorio: boolean }[]>([]);

  const { data: regras } = useQuery({
    queryKey: ["produto_regras_regionais", produtoId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("produto_regras_regionais")
        .select("*")
        .eq("produto_id", produtoId)
        .order("uf");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        campos_obrigatorios: (r.campos_obrigatorios as string[]) ?? [],
        documentos_adicionais: (r.documentos_adicionais as any[]) ?? [],
      })) as RegraRegional[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        produto_id: produtoId,
        uf: formUf,
        campos_obrigatorios: formCampos,
        documentos_adicionais: formDocs,
      };
      if (editingRegra) {
        const { error } = await (supabase as any).from("produto_regras_regionais").update(payload).eq("id", editingRegra.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("produto_regras_regionais").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produto_regras_regionais", produtoId] });
      setOpenDialog(false);
      toast({ title: editingRegra ? "Regra atualizada!" : "Regra criada!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("produto_regras_regionais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["produto_regras_regionais", produtoId] });
      toast({ title: "Regra removida!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openNew = () => {
    setEditingRegra(null);
    setFormUf("");
    setFormCampos([]);
    setFormDocs([]);
    setOpenDialog(true);
  };

  const openEdit = (r: RegraRegional) => {
    setEditingRegra(r);
    setFormUf(r.uf);
    setFormCampos(r.campos_obrigatorios);
    setFormDocs(r.documentos_adicionais);
    setOpenDialog(true);
  };

  const toggleCampo = (key: string) => {
    setFormCampos((prev) => prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]);
  };

  const addDoc = () => {
    setFormDocs((prev) => [...prev, { nome: "", descricao: "", obrigatorio: true }]);
  };

  const removeDoc = (idx: number) => {
    setFormDocs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateDoc = (idx: number, field: string, value: any) => {
    setFormDocs((prev) => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const usedUfs = (regras ?? []).filter((r) => !editingRegra || r.id !== editingRegra.id).map((r) => r.uf);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Regras por Região ({regras?.length ?? 0})
        </h4>
        <Button size="sm" variant="outline" onClick={openNew}>
          <Plus className="mr-1 h-3 w-3" /> Regra Regional
        </Button>
      </div>

      {!regras?.length ? (
        <p className="text-sm text-muted-foreground">Nenhuma regra regional configurada. As regras globais do produto se aplicam a todas as UFs.</p>
      ) : (
        <div className="space-y-2">
          {regras.map((r) => (
            <div key={r.id} className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="font-mono">{r.uf}</Badge>
                  <Badge variant={r.ativo ? "default" : "secondary"} className="text-xs">
                    {r.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {r.campos_obrigatorios.length > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Campos: {r.campos_obrigatorios.map((c) => CAMPOS_DISPONIVEIS.find((cd) => cd.key === c)?.label ?? c).join(", ")}
                  </p>
                )}
                {r.documentos_adicionais.length > 0 && (
                  <p className="text-muted-foreground text-xs">
                    +{r.documentos_adicionais.length} documento(s) adicional(is)
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>Editar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir regra para {r.uf}?</AlertDialogTitle>
                      <AlertDialogDescription>A regra regional será removida.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(r.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRegra ? `Editar Regra — ${formUf}` : "Nova Regra Regional"}</DialogTitle>
            <DialogDescription>Configure campos e documentos obrigatórios por UF para {produtoNome}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            <div>
              <Label>UF *</Label>
              <Select value={formUf} onValueChange={setFormUf} disabled={!!editingRegra}>
                <SelectTrigger><SelectValue placeholder="Selecione a UF..." /></SelectTrigger>
                <SelectContent>
                  {UF_LIST.filter((uf) => !usedUfs.includes(uf)).map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Campos Obrigatórios</Label>
              <div className="grid grid-cols-2 gap-2">
                {CAMPOS_DISPONIVEIS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer rounded-md border p-2 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={formCampos.includes(c.key)}
                      onChange={() => toggleCampo(c.key)}
                      className="h-4 w-4"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Documentos Adicionais por UF</Label>
                <Button type="button" size="sm" variant="outline" onClick={addDoc}>
                  <Plus className="mr-1 h-3 w-3" /> Doc
                </Button>
              </div>
              {formDocs.map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2 mb-2 rounded-md border p-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Nome do documento"
                      value={doc.nome}
                      onChange={(e) => updateDoc(idx, "nome", e.target.value)}
                    />
                    <Input
                      placeholder="Descrição (opcional)"
                      value={doc.descricao}
                      onChange={(e) => updateDoc(idx, "descricao", e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={doc.obrigatorio}
                        onChange={(e) => updateDoc(idx, "obrigatorio", e.target.checked)}
                        className="h-3 w-3"
                      />
                      Obrigatório
                    </label>
                  </div>
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeDoc(idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={saveMutation.isPending || !formUf}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
