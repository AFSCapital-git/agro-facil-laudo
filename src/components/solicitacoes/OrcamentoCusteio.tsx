import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ShoppingCart, Calculator } from "lucide-react";

interface OrcamentoCusteioProps {
  solicitacaoId: string;
  culturaPrincipal: string;
  readOnly?: boolean;
}

const CATEGORIAS = [
  { value: "insumo", label: "Insumo" },
  { value: "semente", label: "Semente" },
  { value: "fertilizante", label: "Fertilizante" },
  { value: "defensivo", label: "Defensivo" },
  { value: "mao_de_obra", label: "Mão de obra" },
  { value: "mecanizacao", label: "Mecanização" },
  { value: "outros", label: "Outros" },
];

const UNIDADES = ["un", "kg", "t", "L", "sc (60kg)", "ha", "horas", "diárias"];

// Sugestões de itens comuns por cultura
const SUGESTOES_POR_CULTURA: Record<string, { descricao: string; categoria: string; unidade: string }[]> = {
  "Soja": [
    { descricao: "Sementes de soja", categoria: "semente", unidade: "sc (60kg)" },
    { descricao: "Inoculante", categoria: "insumo", unidade: "L" },
    { descricao: "Adubo NPK 02-20-20", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida glifosato", categoria: "defensivo", unidade: "L" },
    { descricao: "Fungicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
    { descricao: "Dessecante", categoria: "defensivo", unidade: "L" },
    { descricao: "Plantio mecanizado", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Pulverização", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Colheita mecanizada", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Milho": [
    { descricao: "Sementes de milho híbrido", categoria: "semente", unidade: "sc (60kg)" },
    { descricao: "Adubo NPK 08-28-16", categoria: "fertilizante", unidade: "t" },
    { descricao: "Ureia (cobertura)", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida atrazina", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
    { descricao: "Plantio mecanizado", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Colheita mecanizada", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Arroz": [
    { descricao: "Sementes de arroz", categoria: "semente", unidade: "kg" },
    { descricao: "Adubo NPK", categoria: "fertilizante", unidade: "t" },
    { descricao: "Ureia (cobertura)", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
    { descricao: "Preparo de solo", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Colheita", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Feijão": [
    { descricao: "Sementes de feijão", categoria: "semente", unidade: "kg" },
    { descricao: "Adubo NPK 04-14-08", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Fungicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
    { descricao: "Plantio", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Colheita", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Café": [
    { descricao: "Adubo NPK", categoria: "fertilizante", unidade: "t" },
    { descricao: "Calcário", categoria: "fertilizante", unidade: "t" },
    { descricao: "Fungicida (ferrugem)", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida (broca)", categoria: "defensivo", unidade: "L" },
    { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Mão de obra colheita", categoria: "mao_de_obra", unidade: "diárias" },
    { descricao: "Pulverização", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Mandioca": [
    { descricao: "Manivas (mudas)", categoria: "semente", unidade: "un" },
    { descricao: "Adubo NPK", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Preparo de solo", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Mão de obra plantio", categoria: "mao_de_obra", unidade: "diárias" },
    { descricao: "Mão de obra colheita", categoria: "mao_de_obra", unidade: "diárias" },
  ],
  "Cana-de-açúcar": [
    { descricao: "Mudas de cana", categoria: "semente", unidade: "t" },
    { descricao: "Adubo NPK", categoria: "fertilizante", unidade: "t" },
    { descricao: "Calcário", categoria: "fertilizante", unidade: "t" },
    { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
    { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
    { descricao: "Preparo de solo", categoria: "mecanizacao", unidade: "ha" },
    { descricao: "Plantio mecanizado", categoria: "mecanizacao", unidade: "ha" },
  ],
  "Bovinocultura de leite": [
    { descricao: "Ração concentrada", categoria: "insumo", unidade: "t" },
    { descricao: "Sal mineral", categoria: "insumo", unidade: "kg" },
    { descricao: "Medicamentos veterinários", categoria: "insumo", unidade: "un" },
    { descricao: "Sementes de pastagem", categoria: "semente", unidade: "kg" },
    { descricao: "Adubo para pastagem", categoria: "fertilizante", unidade: "t" },
    { descricao: "Mão de obra", categoria: "mao_de_obra", unidade: "diárias" },
  ],
  "Bovinocultura de corte": [
    { descricao: "Sal mineral", categoria: "insumo", unidade: "kg" },
    { descricao: "Ração suplementar", categoria: "insumo", unidade: "t" },
    { descricao: "Medicamentos veterinários", categoria: "insumo", unidade: "un" },
    { descricao: "Sementes de pastagem", categoria: "semente", unidade: "kg" },
    { descricao: "Adubo para pastagem", categoria: "fertilizante", unidade: "t" },
    { descricao: "Mão de obra", categoria: "mao_de_obra", unidade: "diárias" },
  ],
};

// Default items when no culture-specific suggestions exist
const SUGESTOES_GENERICAS = [
  { descricao: "Sementes", categoria: "semente", unidade: "kg" },
  { descricao: "Adubo NPK", categoria: "fertilizante", unidade: "t" },
  { descricao: "Calcário", categoria: "fertilizante", unidade: "t" },
  { descricao: "Herbicida", categoria: "defensivo", unidade: "L" },
  { descricao: "Inseticida", categoria: "defensivo", unidade: "L" },
  { descricao: "Preparo de solo", categoria: "mecanizacao", unidade: "ha" },
  { descricao: "Mão de obra", categoria: "mao_de_obra", unidade: "diárias" },
];

interface ItemForm {
  descricao: string;
  unidade: string;
  quantidade: string;
  valor_unitario: string;
  categoria: string;
}

const emptyItem: ItemForm = {
  descricao: "",
  unidade: "un",
  quantidade: "",
  valor_unitario: "",
  categoria: "insumo",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OrcamentoCusteio({ solicitacaoId, culturaPrincipal, readOnly }: OrcamentoCusteioProps) {
  const [newItem, setNewItem] = useState<ItemForm>(emptyItem);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: itens, isLoading } = useQuery({
    queryKey: ["orcamento_custeio", solicitacaoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamento_custeio_itens" as any)
        .select("*")
        .eq("solicitacao_id", solicitacaoId)
        .order("created_at");
      if (error) throw error;
      return data as any[];
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: ItemForm) => {
      const { error } = await supabase.from("orcamento_custeio_itens" as any).insert({
        solicitacao_id: solicitacaoId,
        descricao: item.descricao,
        unidade: item.unidade,
        quantidade: parseFloat(item.quantidade) || 1,
        valor_unitario: parseFloat(item.valor_unitario.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
        categoria: item.categoria,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamento_custeio", solicitacaoId] });
      setNewItem(emptyItem);
      toast({ title: "Item adicionado!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orcamento_custeio_itens" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamento_custeio", solicitacaoId] });
      toast({ title: "Item removido." });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const sugestoes = SUGESTOES_POR_CULTURA[culturaPrincipal] || SUGESTOES_GENERICAS;
  const totalOrcamento = (itens || []).reduce((sum: number, item: any) => sum + (item.valor_total || 0), 0);

  const handleAddSugestao = (sug: typeof sugestoes[0]) => {
    setNewItem({
      descricao: sug.descricao,
      unidade: sug.unidade,
      quantidade: "",
      valor_unitario: "",
      categoria: sug.categoria,
    });
    setShowSugestoes(false);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.descricao.trim()) return;
    addItemMutation.mutate(newItem);
  };

  const categoriaLabel = (cat: string) => CATEGORIAS.find((c) => c.value === cat)?.label || cat;

  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" /> Orçamento de Custeio
        </h4>
        {totalOrcamento > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Calculator className="h-3 w-3" />
            Total: {formatCurrency(totalOrcamento)}
          </Badge>
        )}
      </div>

      {/* Items list */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : itens && itens.length > 0 ? (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 text-xs font-medium text-muted-foreground px-1">
            <span>Item</span>
            <span>Qtd</span>
            <span>Unidade</span>
            <span>Vlr. Unit.</span>
            <span>Subtotal</span>
            <span />
          </div>
          {itens.map((item: any) => (
            <div key={item.id} className="grid grid-cols-[1fr_80px_80px_80px_90px_32px] gap-1 items-center text-sm border rounded-md p-1.5 bg-muted/20">
              <div className="min-w-0">
                <span className="truncate block">{item.descricao}</span>
                <Badge variant="outline" className="text-[10px] mt-0.5">{categoriaLabel(item.categoria)}</Badge>
              </div>
              <span>{item.quantidade}</span>
              <span className="text-xs">{item.unidade}</span>
              <span>{formatCurrency(item.valor_unitario)}</span>
              <span className="font-medium">{formatCurrency(item.valor_total)}</span>
              {!readOnly && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => deleteItemMutation.mutate(item.id)}
                  disabled={deleteItemMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <div className="flex justify-end pt-2 border-t">
            <span className="text-sm font-semibold">Total: {formatCurrency(totalOrcamento)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhum item adicionado ao orçamento.</p>
      )}

      {/* Add item form */}
      {!readOnly && (
        <div className="space-y-3 border-t pt-3">
          {/* Suggestions */}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setShowSugestoes(!showSugestoes)}
            >
              <Plus className="h-3 w-3" />
              {showSugestoes ? "Ocultar sugestões" : `Sugestões para ${culturaPrincipal || "sua cultura"}`}
            </Button>
            {showSugestoes && (
              <div className="mt-2 flex flex-wrap gap-1">
                {sugestoes.map((sug, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleAddSugestao(sug)}
                  >
                    {sug.descricao}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitItem} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Descrição do item *</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Ex: Sementes de soja"
                  value={newItem.descricao}
                  onChange={(e) => setNewItem((n) => ({ ...n, descricao: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={newItem.categoria} onValueChange={(v) => setNewItem((n) => ({ ...n, categoria: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unidade</Label>
                <Select value={newItem.unidade} onValueChange={(v) => setNewItem((n) => ({ ...n, unidade: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={newItem.quantidade}
                  onChange={(e) => setNewItem((n) => ({ ...n, quantidade: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor unitário (R$) *</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={newItem.valor_unitario}
                  onChange={(e) => setNewItem((n) => ({ ...n, valor_unitario: e.target.value }))}
                  required
                />
              </div>
            </div>
            <Button type="submit" size="sm" className="gap-1" disabled={addItemMutation.isPending || !newItem.descricao.trim()}>
              <Plus className="h-3 w-3" /> Adicionar item
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
