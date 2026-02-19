import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";

interface PronafProduto {
  id: string;
  nome: string;
  finalidade: string;
  grupo_alvo: string;
  o_que_financia: string;
  limite_valor: string;
  juros: string;
  prazo_reembolso: string;
  carencia: string;
  bonus_adimplencia: string;
  ativo: boolean;
}

interface PronafDocumento {
  id: string;
  produto_id: string;
  nome_documento: string;
  descricao: string;
  obrigatorio: boolean;
  ordem: number;
}

const emptyProduto = {
  nome: "",
  finalidade: "investimento",
  grupo_alvo: "",
  o_que_financia: "",
  limite_valor: "",
  juros: "",
  prazo_reembolso: "",
  carencia: "",
  bonus_adimplencia: "",
};

export default function AdminProdutosPronaf() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openProduto, setOpenProduto] = useState(false);
  const [editingProduto, setEditingProduto] = useState<PronafProduto | null>(null);
  const [form, setForm] = useState(emptyProduto);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Doc form
  const [openDoc, setOpenDoc] = useState(false);
  const [docForm, setDocForm] = useState({ nome_documento: "", descricao: "", obrigatorio: true, ordem: 0 });
  const [docProdutoId, setDocProdutoId] = useState<string | null>(null);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["pronaf_produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_produtos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as PronafProduto[];
    },
  });

  const { data: documentos } = useQuery({
    queryKey: ["pronaf_documentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pronaf_documentos")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data as PronafDocumento[];
    },
  });

  const saveProduto = useMutation({
    mutationFn: async () => {
      if (editingProduto) {
        const { error } = await supabase.from("pronaf_produtos").update(form).eq("id", editingProduto.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pronaf_produtos").insert(form);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pronaf_produtos"] });
      setOpenProduto(false);
      setEditingProduto(null);
      setForm(emptyProduto);
      toast({ title: editingProduto ? "Produto atualizado!" : "Produto criado!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteProduto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pronaf_produtos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pronaf_produtos"] });
      qc.invalidateQueries({ queryKey: ["pronaf_documentos"] });
      toast({ title: "Produto removido!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("pronaf_produtos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pronaf_produtos"] });
    },
  });

  const saveDoc = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pronaf_documentos").insert({
        ...docForm,
        produto_id: docProdutoId!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pronaf_documentos"] });
      setOpenDoc(false);
      setDocForm({ nome_documento: "", descricao: "", obrigatorio: true, ordem: 0 });
      toast({ title: "Documento adicionado!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteDoc = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pronaf_documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pronaf_documentos"] });
      toast({ title: "Documento removido!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const openEdit = (p: PronafProduto) => {
    setEditingProduto(p);
    setForm({
      nome: p.nome,
      finalidade: p.finalidade,
      grupo_alvo: p.grupo_alvo,
      o_que_financia: p.o_que_financia,
      limite_valor: p.limite_valor,
      juros: p.juros,
      prazo_reembolso: p.prazo_reembolso,
      carencia: p.carencia,
      bonus_adimplencia: p.bonus_adimplencia,
    });
    setOpenProduto(true);
  };

  const openNew = () => {
    setEditingProduto(null);
    setForm(emptyProduto);
    setOpenProduto(true);
  };

  const getDocsForProduct = (produtoId: string) =>
    documentos?.filter((d) => d.produto_id === produtoId) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Produtos PRONAF</h1>
          <p className="text-muted-foreground">Gerencie modalidades e documentações exigidas.</p>
        </div>
        <Dialog open={openProduto} onOpenChange={setOpenProduto}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduto ? "Editar Produto" : "Novo Produto PRONAF"}</DialogTitle>
              <DialogDescription>Preencha os dados da modalidade PRONAF.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProduto.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <Label>Finalidade</Label>
                <Select value={form.finalidade} onValueChange={(v) => setForm({ ...form, finalidade: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investimento">Investimento</SelectItem>
                    <SelectItem value="custeio">Custeio</SelectItem>
                    <SelectItem value="capital_de_giro">Capital de Giro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Grupo Alvo</Label>
                <Textarea value={form.grupo_alvo} onChange={(e) => setForm({ ...form, grupo_alvo: e.target.value })} />
              </div>
              <div>
                <Label>O que financia</Label>
                <Textarea value={form.o_que_financia} onChange={(e) => setForm({ ...form, o_que_financia: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Limite de Valor</Label>
                  <Input value={form.limite_valor} onChange={(e) => setForm({ ...form, limite_valor: e.target.value })} />
                </div>
                <div>
                  <Label>Juros</Label>
                  <Input value={form.juros} onChange={(e) => setForm({ ...form, juros: e.target.value })} />
                </div>
                <div>
                  <Label>Prazo de Reembolso</Label>
                  <Input value={form.prazo_reembolso} onChange={(e) => setForm({ ...form, prazo_reembolso: e.target.value })} />
                </div>
                <div>
                  <Label>Carência</Label>
                  <Input value={form.carencia} onChange={(e) => setForm({ ...form, carencia: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Bônus de Adimplência</Label>
                <Input value={form.bonus_adimplencia} onChange={(e) => setForm({ ...form, bonus_adimplencia: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={saveProduto.isPending}>
                  {saveProduto.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !produtos?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum produto cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {produtos.map((p) => {
            const docs = getDocsForProduct(p.id);
            const isExpanded = expandedId === p.id;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{p.nome}</CardTitle>
                        <Badge variant={p.ativo ? "default" : "secondary"}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">{p.finalidade}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {p.grupo_alvo}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleAtivo.mutate({ id: p.id, ativo: !p.ativo })}
                      >
                        {p.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso removerá o produto e todas as documentações associadas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProduto.mutate(p.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      <div><span className="font-medium">Limite:</span> {p.limite_valor || "—"}</div>
                      <div><span className="font-medium">Juros:</span> {p.juros || "—"}</div>
                      <div><span className="font-medium">Prazo:</span> {p.prazo_reembolso || "—"}</div>
                      <div><span className="font-medium">Carência:</span> {p.carencia || "—"}</div>
                      <div><span className="font-medium">Bônus:</span> {p.bonus_adimplencia || "—"}</div>
                    </div>
                    {p.o_que_financia && (
                      <div className="text-sm">
                        <span className="font-medium">O que financia:</span> {p.o_que_financia}
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Documentações Exigidas ({docs.length})</h4>
                        <Dialog open={openDoc && docProdutoId === p.id} onOpenChange={(v) => { setOpenDoc(v); if (v) setDocProdutoId(p.id); }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setDocProdutoId(p.id)}>
                              <Plus className="mr-1 h-3 w-3" /> Documento
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar Documento</DialogTitle>
                              <DialogDescription>Documentação exigida para {p.nome}.</DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                saveDoc.mutate();
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <Label>Nome do Documento</Label>
                                <Input
                                  value={docForm.nome_documento}
                                  onChange={(e) => setDocForm({ ...docForm, nome_documento: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label>Descrição</Label>
                                <Textarea
                                  value={docForm.descricao}
                                  onChange={(e) => setDocForm({ ...docForm, descricao: e.target.value })}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Ordem</Label>
                                  <Input
                                    type="number"
                                    value={docForm.ordem}
                                    onChange={(e) => setDocForm({ ...docForm, ordem: parseInt(e.target.value) || 0 })}
                                  />
                                </div>
                                <div className="flex items-end gap-2">
                                  <input
                                    type="checkbox"
                                    id={`obrigatorio-${p.id}`}
                                    checked={docForm.obrigatorio}
                                    onChange={(e) => setDocForm({ ...docForm, obrigatorio: e.target.checked })}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor={`obrigatorio-${p.id}`}>Obrigatório</Label>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <DialogClose asChild>
                                  <Button variant="outline" type="button">Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={saveDoc.isPending}>
                                  {saveDoc.isPending ? "Salvando..." : "Salvar"}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      {docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum documento cadastrado.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>#</TableHead>
                              <TableHead>Documento</TableHead>
                              <TableHead>Obrigatório</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docs.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell className="text-muted-foreground">{doc.ordem}</TableCell>
                                <TableCell>
                                  <div>
                                    <span className="font-medium">{doc.nome_documento}</span>
                                    {doc.descricao && (
                                      <p className="text-xs text-muted-foreground">{doc.descricao}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={doc.obrigatorio ? "default" : "outline"}>
                                    {doc.obrigatorio ? "Sim" : "Não"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="text-destructive">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Remover "{doc.nome_documento}" da lista de documentações.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteDoc.mutate(doc.id)}>
                                          Excluir
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
