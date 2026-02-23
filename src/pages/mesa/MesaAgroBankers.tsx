import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Package, MapPin, Target, Users, Settings, Plus, Trash2, Save } from "lucide-react";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const TIPO_ENTIDADE_LABELS: Record<string, string> = {
  revenda_agricola: "Revenda Agrícola",
  cooperativa: "Cooperativa",
  sindicato_rural: "Sindicato Rural",
  associacao_produtores: "Associação de Produtores",
  consultoria_agronomica: "Consultoria Agronômica",
  escritorio_contabilidade: "Escritório de Contabilidade Rural",
  corretora_seguros: "Corretora de Seguros",
  casa_agropecuaria: "Casa Agropecuária",
  ater: "ATER",
  trading_cerealista: "Trading / Cerealista",
  outro: "Outro",
};

export default function MesaAgroBankers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedAb, setSelectedAb] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // All AgroBankers
  const { data: agrobankers = [] } = useQuery({
    queryKey: ["mesa_agrobankers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobankers")
        .select("*, profiles:user_id(nome, email)")
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // All products
  const { data: produtos = [] } = useQuery({
    queryKey: ["pronaf_produtos_all"],
    queryFn: async () => {
      const { data } = await supabase.from("pronaf_produtos").select("*").eq("ativo", true).order("nome");
      return data || [];
    },
  });

  // Products assigned to selected AgroBanker
  const { data: abProdutos = [], refetch: refetchAbProd } = useQuery({
    queryKey: ["mesa_ab_produtos", selectedAb?.id],
    enabled: !!selectedAb,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_produtos" as any)
        .select("*")
        .eq("agrobanker_id", selectedAb.id);
      return (data || []) as any[];
    },
  });

  // Regions assigned
  const { data: abRegioes = [], refetch: refetchAbReg } = useQuery({
    queryKey: ["mesa_ab_regioes", selectedAb?.id],
    enabled: !!selectedAb,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_regioes" as any)
        .select("*")
        .eq("agrobanker_id", selectedAb.id);
      return (data || []) as any[];
    },
  });

  // Metas
  const { data: abMetas = [], refetch: refetchAbMetas } = useQuery({
    queryKey: ["mesa_ab_metas", selectedAb?.id],
    enabled: !!selectedAb,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_metas" as any)
        .select("*")
        .eq("agrobanker_id", selectedAb.id)
        .order("periodo_inicio", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Portfolio count
  const { data: abCarteira = [] } = useQuery({
    queryKey: ["mesa_ab_carteira", selectedAb?.id],
    enabled: !!selectedAb,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_produtores")
        .select("id")
        .eq("agrobanker_id", selectedAb.id);
      return data || [];
    },
  });

  // Toggle product for AgroBanker
  const toggleProductMutation = useMutation({
    mutationFn: async ({ produtoId, enabled }: { produtoId: string; enabled: boolean }) => {
      const existing = abProdutos.find((p: any) => p.pronaf_produto_id === produtoId);
      if (existing) {
        await supabase.from("agrobanker_produtos" as any).update({ ativo: enabled } as any).eq("id", existing.id);
      } else {
        await supabase.from("agrobanker_produtos" as any).insert({
          agrobanker_id: selectedAb.id,
          pronaf_produto_id: produtoId,
          ativo: enabled,
        } as any);
      }
    },
    onSuccess: () => refetchAbProd(),
  });

  // Update commission
  const updateComissaoMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: number }) => {
      await supabase.from("agrobanker_produtos" as any).update({ [field]: value } as any).eq("id", id);
    },
    onSuccess: () => {
      refetchAbProd();
      toast({ title: "Comissão atualizada" });
    },
  });

  // Add region
  const addRegiaoMutation = useMutation({
    mutationFn: async ({ uf, municipio }: { uf: string; municipio?: string }) => {
      const { error } = await supabase.from("agrobanker_regioes" as any).insert({
        agrobanker_id: selectedAb.id,
        uf,
        municipio: municipio || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAbReg();
      toast({ title: "Região adicionada" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const removeRegiaoMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("agrobanker_regioes" as any).delete().eq("id", id);
    },
    onSuccess: () => refetchAbReg(),
  });

  // Add meta
  const [metaInicio, setMetaInicio] = useState("");
  const [metaFim, setMetaFim] = useState("");
  const [metaCaptacoes, setMetaCaptacoes] = useState("0");
  const [metaValor, setMetaValor] = useState("0");

  const addMetaMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agrobanker_metas" as any).insert({
        agrobanker_id: selectedAb.id,
        periodo_inicio: metaInicio,
        periodo_fim: metaFim,
        meta_captacoes: parseInt(metaCaptacoes) || 0,
        meta_valor: parseFloat(metaValor) || 0,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchAbMetas();
      toast({ title: "Meta criada" });
      setMetaInicio(""); setMetaFim(""); setMetaCaptacoes("0"); setMetaValor("0");
    },
  });

  const [newUf, setNewUf] = useState("");

  // Verification status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await supabase.from("agrobankers").update({ status_verificacao: status }).eq("id", selectedAb.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mesa_agrobankers"] });
      toast({ title: "Status atualizado" });
      setSelectedAb((prev: any) => prev ? { ...prev, status_verificacao: prev.status_verificacao } : null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de AgroBankers"
        description="Configure produtos, regiões, comissões e metas para cada parceiro"
      />

      <div className="grid gap-4 md:grid-cols-3">
        {/* List */}
        <div className="space-y-2">
          <h3 className="font-display font-semibold text-sm mb-2">Parceiros ({agrobankers.length})</h3>
          {agrobankers.map((ab: any) => (
            <Card
              key={ab.id}
              className={`cursor-pointer transition-colors ${selectedAb?.id === ab.id ? "border-primary" : ""}`}
              onClick={() => { setSelectedAb(ab); setDialogOpen(false); }}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{ab.nome_fantasia || ab.razao_social}</p>
                    <p className="text-xs text-muted-foreground">{TIPO_ENTIDADE_LABELS[ab.tipo_entidade] || ab.tipo_entidade}</p>
                    <p className="text-xs text-muted-foreground">{ab.municipio}/{ab.uf}</p>
                  </div>
                  <Badge variant={ab.status_verificacao === "aprovado" ? "default" : ab.status_verificacao === "pendente" ? "secondary" : "destructive"}>
                    {ab.status_verificacao}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail */}
        <div className="md:col-span-2">
          {!selectedAb ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um AgroBanker à esquerda para gerenciar.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold">{selectedAb.nome_fantasia}</h3>
                      <p className="text-sm text-muted-foreground">{selectedAb.razao_social} — CNPJ: {selectedAb.cnpj}</p>
                      <p className="text-sm text-muted-foreground">{selectedAb.profiles?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={selectedAb.status_verificacao}
                        onValueChange={(v) => {
                          setSelectedAb((prev: any) => ({ ...prev, status_verificacao: v }));
                          updateStatusMutation.mutate(v);
                        }}
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem>
                          <SelectItem value="rejeitado">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{abCarteira.length} produtores</Badge>
                    <Badge variant="outline"><Package className="mr-1 h-3 w-3" />{abProdutos.filter((p: any) => p.ativo).length} produtos</Badge>
                    <Badge variant="outline"><MapPin className="mr-1 h-3 w-3" />{abRegioes.length} regiões</Badge>
                  </div>
                </CardContent>
              </Card>

              <Accordion type="multiple" defaultValue={["produtos"]} className="space-y-2">
                {/* PRODUCTS */}
                <AccordionItem value="produtos" className="border rounded-lg">
                  <AccordionTrigger className="px-4"><div className="flex items-center gap-2"><Package className="h-4 w-4" /> Produtos Habilitados</div></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Habilitado</TableHead>
                          <TableHead>Comissão %</TableHead>
                          <TableHead>Comissão Fixa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtos.map((p: any) => {
                          const abp = abProdutos.find((a: any) => a.pronaf_produto_id === p.id);
                          return (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.nome}</TableCell>
                              <TableCell>
                                <Switch
                                  checked={abp?.ativo ?? false}
                                  onCheckedChange={(v) => toggleProductMutation.mutate({ produtoId: p.id, enabled: v })}
                                />
                              </TableCell>
                              <TableCell>
                                {abp && (
                                  <Input
                                    type="number"
                                    className="w-20 h-8"
                                    defaultValue={abp.comissao_percentual}
                                    onBlur={(e) => updateComissaoMutation.mutate({ id: abp.id, field: "comissao_percentual", value: parseFloat(e.target.value) || 0 })}
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {abp && (
                                  <Input
                                    type="number"
                                    className="w-24 h-8"
                                    defaultValue={abp.comissao_fixa}
                                    onBlur={(e) => updateComissaoMutation.mutate({ id: abp.id, field: "comissao_fixa", value: parseFloat(e.target.value) || 0 })}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>

                {/* REGIONS */}
                <AccordionItem value="regioes" className="border rounded-lg">
                  <AccordionTrigger className="px-4"><div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Regiões Permitidas</div></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-3">
                    <div className="flex gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">UF</Label>
                        <Select value={newUf} onValueChange={setNewUf}>
                          <SelectTrigger className="w-20 h-8"><SelectValue placeholder="UF" /></SelectTrigger>
                          <SelectContent>
                            {UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" disabled={!newUf} onClick={() => { addRegiaoMutation.mutate({ uf: newUf }); setNewUf(""); }}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {abRegioes.map((r: any) => (
                        <Badge key={r.id} variant="secondary" className="gap-1">
                          {r.uf}{r.municipio ? ` — ${r.municipio}` : " (Todo estado)"}
                          <button onClick={() => removeRegiaoMutation.mutate(r.id)} className="ml-1 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {abRegioes.length === 0 && <p className="text-xs text-muted-foreground">Sem restrição regional (todas UFs)</p>}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* METAS */}
                <AccordionItem value="metas" className="border rounded-lg">
                  <AccordionTrigger className="px-4"><div className="flex items-center gap-2"><Target className="h-4 w-4" /> Metas & Quotas</div></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Início</Label>
                        <Input type="date" className="h-8" value={metaInicio} onChange={(e) => setMetaInicio(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Fim</Label>
                        <Input type="date" className="h-8" value={metaFim} onChange={(e) => setMetaFim(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Meta Captações</Label>
                        <Input type="number" className="h-8" value={metaCaptacoes} onChange={(e) => setMetaCaptacoes(e.target.value)} />
                      </div>
                      <Button size="sm" disabled={!metaInicio || !metaFim} onClick={() => addMetaMutation.mutate()}>
                        <Plus className="h-3 w-3 mr-1" /> Criar
                      </Button>
                    </div>
                    {abMetas.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Período</TableHead>
                            <TableHead>Meta</TableHead>
                            <TableHead>Realizado</TableHead>
                            <TableHead>%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {abMetas.map((m: any) => {
                            const pct = m.meta_captacoes > 0 ? Math.round((m.realizado_captacoes / m.meta_captacoes) * 100) : 0;
                            return (
                              <TableRow key={m.id}>
                                <TableCell className="text-sm">
                                  {new Date(m.periodo_inicio).toLocaleDateString("pt-BR")} — {new Date(m.periodo_fim).toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell>{m.meta_captacoes}</TableCell>
                                <TableCell>{m.realizado_captacoes}</TableCell>
                                <TableCell>
                                  <Badge variant={pct >= 100 ? "default" : "secondary"}>{pct}%</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
