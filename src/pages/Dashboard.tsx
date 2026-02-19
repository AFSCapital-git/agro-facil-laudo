import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MapPin, ClipboardCheck, CreditCard } from "lucide-react";

export default function Dashboard() {
  const { role, user } = useAuth();
  const nome = user?.user_metadata?.nome || "Usuário";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Olá, {nome}!</h1>
        <p className="text-muted-foreground">
          {role === "produtor" && "Gerencie suas propriedades e solicitações de laudo."}
          {role === "engenheiro" && "Veja demandas disponíveis e gerencie seus laudos."}
          {role === "admin" && "Painel de controle da plataforma AgroLaudo."}
          {!role && "Carregando informações..."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === "produtor" && (
          <>
            <DashCard icon={MapPin} title="Propriedades" value="—" desc="cadastradas" />
            <DashCard icon={FileText} title="Solicitações" value="—" desc="ativas" />
            <DashCard icon={ClipboardCheck} title="Laudos" value="—" desc="finalizados" />
          </>
        )}
        {role === "engenheiro" && (
          <>
            <DashCard icon={ClipboardCheck} title="Demandas" value="—" desc="disponíveis" />
            <DashCard icon={FileText} title="Meus Laudos" value="—" desc="em andamento" />
            <DashCard icon={CreditCard} title="Pagamentos" value="—" desc="pendentes" />
          </>
        )}
        {role === "admin" && (
          <>
            <DashCard icon={MapPin} title="Produtores" value="—" desc="cadastrados" />
            <DashCard icon={ClipboardCheck} title="Engenheiros" value="—" desc="cadastrados" />
            <DashCard icon={FileText} title="Laudos" value="—" desc="total" />
            <DashCard icon={CreditCard} title="Pgto pendente" value="—" desc="total R$" />
          </>
        )}
      </div>
    </div>
  );
}

function DashCard({ icon: Icon, title, value, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string; desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display">{value}</div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
