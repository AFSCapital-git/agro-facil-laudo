import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Users, FileText, TrendingUp, DollarSign } from "lucide-react";

export default function AgroBankerDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel AgroBanker"
        description="Gerencie sua carteira de produtores e acompanhe captações"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Produtores na Carteira" value="0" icon={<Users className="h-4 w-4" />} />
        <StatCard title="Solicitações Ativas" value="0" icon={<FileText className="h-4 w-4" />} />
        <StatCard title="Taxa de Conversão" value="0%" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="Comissões Pendentes" value="R$ 0,00" icon={<DollarSign className="h-4 w-4" />} />
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Comece adicionando produtores à sua carteira para acompanhar solicitações e comissões.
        </p>
      </div>
    </div>
  );
}
