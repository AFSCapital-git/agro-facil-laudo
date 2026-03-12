import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useComplianceValidation } from "@/hooks/useOnboardingAutomation";
import { ShieldCheck, CheckCircle2, XCircle, Clock, RefreshCw, Loader2, Sparkles, AlertTriangle, CalendarClock } from "lucide-react";
import { STATUS_LABELS } from "@/types/onboarding";
import type { OnboardingEmpresa, OnboardingComplianceItem } from "@/types/onboarding";

type ComplianceWithMeta = OnboardingComplianceItem & {
  empresa_nome?: string;
  fonte_validacao?: string;
  ultima_verificacao_auto?: string;
  valido_ate?: string;
  dados_validacao?: Record<string, any>;
};

export default function OnboardingCompliance() {
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<OnboardingEmpresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("all");
  const [compliance, setCompliance] = useState<ComplianceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const { validate, loading: validating } = useComplianceValidation();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [empRes, compRes] = await Promise.all([
      onboardingDb.empresas().select("id, nome_fantasia, razao_social, status, cnpj").neq("tipo", "master"),
      onboardingDb.compliance().select("*").order("created_at"),
    ]);
    const emps = (empRes.data as OnboardingEmpresa[]) || [];
    const comps = (compRes.data as ComplianceWithMeta[]) || [];
    setEmpresas(emps);
    setCompliance(
      comps.map((c) => ({
        ...c,
        empresa_nome: emps.find((e) => e.id === c.empresa_id)?.nome_fantasia || emps.find((e) => e.id === c.empresa_id)?.razao_social || "—",
      }))
    );
    setLoading(false);
  }

  async function updateItemStatus(itemId: string, newStatus: "aprovado" | "rejeitado") {
    const { data: user } = await supabase.auth.getUser();
    await onboardingDb.compliance()
      .update({ status: newStatus, verificado_por: user.user?.id, verificado_em: new Date().toISOString(), fonte_validacao: "manual" })
      .eq("id", itemId);
    toast({ title: `Item ${newStatus === "aprovado" ? "aprovado" : "rejeitado"} com sucesso` });
    loadData();
  }

  async function runAutoValidation(empresaId: string) {
    const empresa = empresas.find(e => e.id === empresaId);
    await validate(empresaId, (empresa as any)?.cnpj);
    loadData();
  }

  async function runAllValidations() {
    for (const empresa of empresas) {
      await validate(empresa.id, (empresa as any)?.cnpj);
    }
    loadData();
  }

  const filtered = selectedEmpresa === "all" ? compliance : compliance.filter((c) => c.empresa_id === selectedEmpresa);
  const totalPendente = filtered.filter((c) => c.status === "pendente").length;
  const totalAprovado = filtered.filter((c) => c.status === "aprovado").length;
  const totalRejeitado = filtered.filter((c) => c.status === "rejeitado").length;
  const totalVencendo = filtered.filter((c) => {
    if (!c.valido_ate) return false;
    const dias = Math.ceil((new Date(c.valido_ate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 30;
  }).length;

  const grouped = filtered.reduce<Record<string, ComplianceWithMeta[]>>((acc, item) => {
    const key = item.empresa_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance"
        description="Verificação automática e manual de conformidade"
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={
          <Button variant="outline" onClick={runAllValidations} disabled={validating}>
            {validating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Revalidar Todos
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <Clock className="h-8 w-8 text-accent-foreground" />
          <div><p className="text-2xl font-bold">{totalPendente}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-primary" />
          <div><p className="text-2xl font-bold">{totalAprovado}</p><p className="text-xs text-muted-foreground">Aprovados</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-destructive" />
          <div><p className="text-2xl font-bold">{totalRejeitado}</p><p className="text-xs text-muted-foreground">Rejeitados</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div><p className="text-2xl font-bold">{totalVencendo}</p><p className="text-xs text-muted-foreground">Vencendo em 30d</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
          <SelectTrigger className="w-[280px]"><SelectValue placeholder="Filtrar por empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Empresas</SelectItem>
            {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Nenhum item de compliance encontrado.</CardContent></Card>
      ) : (
        Object.entries(grouped).map(([empresaId, items]) => {
          const empresaNome = items[0]?.empresa_nome || "—";
          const allApproved = items.every((i) => i.status === "aprovado");
          return (
            <Card key={empresaId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{empresaNome}</CardTitle>
                  <div className="flex items-center gap-2">
                    {allApproved && <Badge className="bg-primary/10 text-primary">✓ Conforme</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => runAutoValidation(empresaId)} disabled={validating}>
                      {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      <span className="ml-1 text-xs">Revalidar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => {
                  const diasVencimento = item.valido_ate
                    ? Math.ceil((new Date(item.valido_ate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`h-4 w-4 rounded-full shrink-0 ${
                        item.status === "aprovado" ? "bg-primary" : item.status === "rejeitado" ? "bg-destructive" : "bg-accent"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm">{item.descricao || item.item}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.fonte_validacao && item.fonte_validacao !== "manual" && (
                            <span className="text-[10px] flex items-center gap-0.5 text-primary">
                              <Sparkles className="h-2.5 w-2.5" /> {item.fonte_validacao}
                            </span>
                          )}
                          {item.ultima_verificacao_auto && (
                            <span className="text-[10px] text-muted-foreground">
                              Última: {new Date(item.ultima_verificacao_auto).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {diasVencimento !== null && diasVencimento <= 30 && diasVencimento >= 0 && (
                            <span className="text-[10px] flex items-center gap-0.5 text-yellow-600">
                              <CalendarClock className="h-2.5 w-2.5" /> Vence em {diasVencimento}d
                            </span>
                          )}
                          {diasVencimento !== null && diasVencimento < 0 && (
                            <span className="text-[10px] flex items-center gap-0.5 text-destructive font-medium">
                              <AlertTriangle className="h-2.5 w-2.5" /> Vencido há {Math.abs(diasVencimento)}d
                            </span>
                          )}
                        </div>
                      </div>
                      {item.status === "pendente" ? (
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, "aprovado")}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => updateItemStatus(item.id, "rejeitado")}>
                            <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className={STATUS_LABELS[item.status]?.color || ""}>
                            {STATUS_LABELS[item.status]?.label || item.status}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateItemStatus(item.id, item.status === "aprovado" ? "rejeitado" : "aprovado")}>
                            Alterar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
