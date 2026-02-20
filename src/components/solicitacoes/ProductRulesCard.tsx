import { ShieldCheck, Banknote, Info, AlertCircle } from "lucide-react";

interface ProductRulesCardProps {
  produto: {
    nome: string;
    finalidade: string;
    grupo_alvo: string;
    o_que_financia: string;
    limite_valor: string;
    juros: string;
    prazo_reembolso: string;
    carencia: string;
    bonus_adimplencia: string;
    valor_engenheiro: number;
    tipo_valor_engenheiro: string;
  };
  valorSolicitado: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function ProductRulesCard({ produto, valorSolicitado }: ProductRulesCardProps) {
  // Parse limit for financial adequacy check
  const limiteStr = produto.limite_valor?.replace(/[^\d.,]/g, "").replace(".", "").replace(",", ".");
  const limiteNum = parseFloat(limiteStr) || 0;
  const dentroDoLimite = limiteNum === 0 || valorSolicitado <= limiteNum;

  return (
    <div className="rounded-md border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h4 className="font-display font-semibold text-sm">Regras do Produto: {produto.nome}</h4>
      </div>

      {/* Rules grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Finalidade:</span>
          <p className="font-medium capitalize">{produto.finalidade}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Público-alvo:</span>
          <p className="font-medium">{produto.grupo_alvo || "Todos os grupos"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">O que financia:</span>
          <p className="font-medium">{produto.o_que_financia || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Limite de valor:</span>
          <p className="font-medium">{produto.limite_valor || "Sem limite definido"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Juros:</span>
          <p className="font-medium">{produto.juros || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Prazo de reembolso:</span>
          <p className="font-medium">{produto.prazo_reembolso || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Carência:</span>
          <p className="font-medium">{produto.carencia || "—"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Bônus adimplência:</span>
          <p className="font-medium">{produto.bonus_adimplencia || "—"}</p>
        </div>
      </div>

      {/* Financial adequacy indicator */}
      {valorSolicitado > 0 && (
        <div className={`flex items-center gap-2 rounded-md p-2 text-sm ${dentroDoLimite ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
          {dentroDoLimite ? (
            <>
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Valor solicitado ({formatCurrency(valorSolicitado)}) está dentro do limite do produto.</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Valor solicitado ({formatCurrency(valorSolicitado)}) <strong>excede</strong> o limite do produto ({produto.limite_valor}).
                Ajuste o valor para se adequar às regras do PRONAF.
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
