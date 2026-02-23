import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, TrendingUp, DollarSign, Package, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function AgroBankerDashboard() {
  const navigate = useNavigate();

  const { data: agrobankerId } = useQuery({
    queryKey: ["agrobanker_id"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_agrobanker_id");
      return data as string;
    },
  });

  const { data: carteira = [] } = useQuery({
    queryKey: ["ab_carteira_count", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase.from("agrobanker_produtores").select("id").eq("agrobanker_id", agrobankerId!).eq("status", "ativo");
      return data || [];
    },
  });

  const { data: solicitacoes = [] } = useQuery({
    queryKey: ["ab_sol_count", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase.from("solicitacoes_laudo").select("id, status_solicitacao, valor_solicitado").eq("agrobanker_id", agrobankerId!);
      return data || [];
    },
  });

  const { data: comissoes = [] } = useQuery({
    queryKey: ["ab_com_count", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase.from("agrobanker_comissoes").select("valor, status").eq("agrobanker_id", agrobankerId!);
      return data || [];
    },
  });

  const { data: meusProducts = [] } = useQuery({
    queryKey: ["ab_prod_count", agrobankerId],
    enabled: !!agrobankerId,
    queryFn: async () => {
      const { data } = await supabase.from("agrobanker_produtos" as any).select("id").eq("agrobanker_id", agrobankerId!).eq("ativo", true);
      return (data || []) as any[];
    },
  });

  const ativas = solicitacoes.filter((s) => !["aprovada", "reprovada", "cancelada"].includes(s.status_solicitacao));
  const aprovadas = solicitacoes.filter((s) => s.status_solicitacao === "aprovada");
  const taxa = solicitacoes.length > 0 ? Math.round((aprovadas.length / solicitacoes.length) * 100) : 0;
  const comPendente = comissoes.filter((c) => c.status === "pendente").reduce((s, c) => s + Number(c.valor), 0);

  const quickCards = [
    { label: "Carteira", icon: Users, value: `${carteira.length} produtores`, onClick: () => navigate("/agrobanker/carteira") },
    { label: "Produtos", icon: Package, value: `${meusProducts.length} habilitados`, onClick: () => navigate("/agrobanker/captacoes") },
    { label: "Captações", icon: FileText, value: `${ativas.length} ativas`, onClick: () => navigate("/agrobanker/captacoes") },
    { label: "Comissões", icon: DollarSign, value: formatCurrency(comPendente), onClick: () => navigate("/agrobanker/comissoes") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel AgroBanker"
        description="Gerencie sua carteira de produtores e acompanhe captações"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produtores na Carteira" value={String(carteira.length)} icon={<Users className="h-4 w-4" />} />
        <StatCard title="Solicitações Ativas" value={String(ativas.length)} icon={<FileText className="h-4 w-4" />} />
        <StatCard title="Taxa de Conversão" value={`${taxa}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Comissões Pendentes" value={formatCurrency(comPendente)} icon={<DollarSign className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickCards.map((c) => (
          <Card key={c.label} className="cursor-pointer hover:border-primary transition-colors" onClick={c.onClick}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
