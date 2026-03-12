import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard, Building2, Clock, CheckCircle2, UserPlus, XCircle } from "lucide-react";
import { STATUS_LABELS, TIPO_LABELS } from "@/types/onboarding";
import type { OnboardingEmpresa } from "@/types/onboarding";

export default function OnboardingDashboard() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<OnboardingEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmpresas();
  }, []);

  async function loadEmpresas() {
    const { data } = await onboardingDb.empresas()
      .select("*")
      .neq("tipo", "master")
      .order("created_at", { ascending: false });
    setEmpresas((data as OnboardingEmpresa[]) || []);
    setLoading(false);
  }

  const total = empresas.length;
  const pendentes = empresas.filter((e) => e.status === "pendente" || e.status === "em_analise").length;
  const aprovadas = empresas.filter((e) => e.status === "aprovado" || e.status === "ativo").length;
  const rejeitadas = empresas.filter((e) => e.status === "rejeitado").length;
  const recentes = empresas.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Onboarding"
        description="Gestão de cadastros, estrutura comercial e compliance"
        icon={<LayoutDashboard className="h-5 w-5" />}
        actions={
          <Button onClick={() => navigate("/onboarding/cadastro")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Cadastro
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatCard title="Total Empresas" value={String(total)} icon={<Building2 className="h-5 w-5" />} />
            <StatCard title="Pendentes" value={String(pendentes)} icon={<Clock className="h-5 w-5" />} />
            <StatCard title="Aprovadas / Ativas" value={String(aprovadas)} icon={<CheckCircle2 className="h-5 w-5" />} />
            <StatCard title="Rejeitadas" value={String(rejeitadas)} icon={<XCircle className="h-5 w-5" />} />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cadastros Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum cadastro ainda. Clique em "Novo Cadastro" para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((empresa) => {
                  const statusInfo = STATUS_LABELS[empresa.status] || { label: empresa.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <TableRow key={empresa.id} className="cursor-pointer" onClick={() => navigate("/onboarding/empresas")}>
                      <TableCell className="font-medium">{empresa.nome_fantasia || empresa.razao_social}</TableCell>
                      <TableCell>{TIPO_LABELS[empresa.tipo] || empresa.tipo}</TableCell>
                      <TableCell>{empresa.uf}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(empresa.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
