import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, ShieldCheck, TrendingUp, FileText } from "lucide-react";
import ProductRulesCard from "@/components/solicitacoes/ProductRulesCard";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  em_analise_mesa: { label: "Em Análise", variant: "default" },
  docs_pendentes_produtor: { label: "Docs Pendentes", variant: "outline" },
  aguardando_laudo: { label: "Aguardando Laudo", variant: "secondary" },
  pronta_para_banco: { label: "Pronta p/ Banco", variant: "default" },
  aprovada: { label: "Aprovada", variant: "default" },
  reprovada: { label: "Reprovada", variant: "destructive" },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AgroBankerCaptacoes() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form
  const [produtorId, setProdutorId] = useState("");
  const [propriedadeId, setPropriedadeId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [bancoParcId, setBancoParcId] = useState("");
  const [culturaPrincipal, setCulturaPrincipal] = useState("");
  const [areaCultivo, setAreaCultivo] = useState("");
  const [valorSolicitado, setValorSolicitado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: agrobankerId } = useQuery({
    queryKey: ["agrobanker_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_agrobanker_id");
      return data as string;
    },
  });

  // Products available to this AgroBanker
  const { data: meusProducts = [] } = useQuery({
    queryKey: ["ab_produtos", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agrobanker_produtos" as any)
        .select("*, pronaf_produtos(*)")
        .eq("agrobanker_id", agrobankerId!)
        .eq("ativo", true);
      return (data || []) as any[];
    },
  });

  // Producers in portfolio
  const { data: meusProdutores = [] } = useQuery({
    queryKey: ["ab_carteira_simple", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data: links } = await supabase
        .from("agrobanker_produtores")
        .select("produtor_id, nivel_acesso, produtores(id, user_id)")
        .eq("agrobanker_id", agrobankerId!)
        .eq("status", "ativo");
      if (!links) return [];
      const userIds = links.map((l: any) => l.produtores?.user_id).filter(Boolean);
      const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", userIds);
      return links.map((l: any) => ({
        produtor_id: l.produtor_id,
        nivel_acesso: l.nivel_acesso,
        nome: profiles?.find((p) => p.id === l.produtores?.user_id)?.nome || "Sem nome",
      }));
    },
  });

  // Properties of selected producer
  const { data: propriedades = [] } = useQuery({
    queryKey: ["ab_propriedades", produtorId],
    enabled: !!produtorId,
    queryFn: async () => {
      const { data } = await supabase
        .from("propriedades")
        .select("id, nome_propriedade, municipio, uf")
        .eq("produtor_id", produtorId);
      return data || [];
    },
  });

  // Banks
  const { data: bancos = [] } = useQuery({
    queryKey: ["bancos_parceiros"],
    queryFn: async () => {
      const { data } = await supabase.from("bancos_parceiros").select("id, nome").eq("ativo", true);
      return data || [];
    },
  });

  // Solicitations originated by this AgroBanker
  const { data: solicitacoes = [], isLoading } = useQuery({
    queryKey: ["ab_solicitacoes", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("solicitacoes_laudo")
        .select("*, pronaf_produtos(nome), propriedades(nome_propriedade, municipio, uf)")
        .eq("agrobanker_id", agrobankerId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const selectedProduct = meusProducts.find((p: any) => p.pronaf_produto_id === produtoId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("solicitacoes_laudo").insert({
        produtor_id: produtorId,
        propriedade_id: propriedadeId,
        pronaf_produto_id: produtoId,
        banco_parceiro_id: bancoParcId || null,
        cultura_principal: culturaPrincipal,
        area_cultivo_ha: parseFloat(areaCultivo) || 0,
        valor_solicitado: parseFloat(valorSolicitado.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
        observacoes_produtor: observacoes,
        agrobanker_id: agrobankerId,
        tipo_credito: selectedProduct?.pronaf_produtos?.finalidade || "custeio",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ab_solicitacoes"] });
      toast({ title: "Solicitação criada com sucesso!" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setProdutorId(""); setPropriedadeId(""); setProdutoId(""); setBancoParcId("");
    setCulturaPrincipal(""); setAreaCultivo(""); setValorSolicitado(""); setObservacoes("");
  };

  const gestaoAtivaProds = meusProdutores.filter((p: any) => p.nivel_acesso === "gestao_ativa");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Captações"
        description="Produtos disponíveis e solicitações originadas"
      />

      {/* Products catalog */}
      <div>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
          <Package className="h-4 w-4" /> Produtos Habilitados
        </h3>
        {meusProducts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum produto habilitado para seu perfil ainda. Entre em contato com a Mesa de Produtos.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meusProducts.map((mp: any) => {
              const p = mp.pronaf_produtos;
              return (
                <Card key={mp.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{p.nome}</CardTitle>
                    <CardDescription className="capitalize">{p.finalidade}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Limite:</span>
                      <span className="font-medium">{p.limite_valor || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Juros:</span>
                      <span className="font-medium">{p.juros || "—"}</span>
                    </div>
                    {mp.comissao_percentual > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comissão:</span>
                        <span className="font-medium text-primary">{mp.comissao_percentual}%</span>
                      </div>
                    )}
                    {mp.comissao_fixa > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comissão fixa:</span>
                        <span className="font-medium text-primary">{formatCurrency(mp.comissao_fixa)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New solicitation */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" /> Solicitações Originadas
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" disabled={gestaoAtivaProds.length === 0 && meusProdutores.length === 0}>
              <Plus className="h-4 w-4" /> Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova Solicitação de Laudo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Produtor</Label>
                <Select value={produtorId} onValueChange={(v) => { setProdutorId(v); setPropriedadeId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o produtor" /></SelectTrigger>
                  <SelectContent>
                    {meusProdutores.map((p: any) => (
                      <SelectItem key={p.produtor_id} value={p.produtor_id}>
                        {p.nome} {p.nivel_acesso === "gestao_ativa" ? "(Gestão Ativa)" : "(Indicação)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {produtorId && (
                <div className="space-y-2">
                  <Label>Propriedade</Label>
                  <Select value={propriedadeId} onValueChange={setPropriedadeId}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {propriedades.map((pr: any) => (
                        <SelectItem key={pr.id} value={pr.id}>
                          {pr.nome_propriedade} — {pr.municipio}/{pr.uf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Produto PRONAF</Label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {meusProducts.map((mp: any) => (
                      <SelectItem key={mp.pronaf_produto_id} value={mp.pronaf_produto_id}>
                        {mp.pronaf_produtos.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <ProductRulesCard
                  produto={selectedProduct.pronaf_produtos}
                  valorSolicitado={parseFloat(valorSolicitado.replace(/[^\d.,]/g, "").replace(",", ".")) || 0}
                />
              )}

              <div className="space-y-2">
                <Label>Banco Parceiro (opcional)</Label>
                <Select value={bancoParcId} onValueChange={setBancoParcId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {bancos.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cultura / Atividade</Label>
                  <Input value={culturaPrincipal} onChange={(e) => setCulturaPrincipal(e.target.value)} placeholder="Ex: Mandioca" />
                </div>
                <div className="space-y-2">
                  <Label>Área (ha)</Label>
                  <Input type="number" value={areaCultivo} onChange={(e) => setAreaCultivo(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor Solicitado (R$)</Label>
                <Input value={valorSolicitado} onChange={(e) => setValorSolicitado(e.target.value)} placeholder="Ex: 50.000,00" />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
              </div>

              <Button
                className="w-full"
                disabled={!produtorId || !propriedadeId || !produtoId || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Criando..." : "Criar Solicitação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Solicitations table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Propriedade</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação originada.
                  </TableCell>
                </TableRow>
              ) : (
                solicitacoes.map((s: any) => {
                  const st = statusMap[s.status_solicitacao] || { label: s.status_solicitacao, variant: "outline" as const };
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.pronaf_produtos?.nome || "—"}</TableCell>
                      <TableCell>{s.propriedades?.nome_propriedade || "—"}</TableCell>
                      <TableCell>{formatCurrency(s.valor_solicitado)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
