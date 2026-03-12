import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, ChevronDown, ChevronRight, Building2, Users, Leaf } from "lucide-react";
import { STATUS_LABELS, TIPO_LABELS } from "@/types/onboarding";
import type { OnboardingEmpresa } from "@/types/onboarding";

function TreeNode({ empresa, children, level = 0 }: { empresa: OnboardingEmpresa; children: OnboardingEmpresa[]; level?: number }) {
  const [open, setOpen] = useState(true);
  const kids = children.filter((c) => c.parent_id === empresa.id);
  const statusInfo = STATUS_LABELS[empresa.status] || { label: empresa.status, color: "" };
  const isMaster = empresa.tipo === "master";

  return (
    <div className={level > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}>
      <div
        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
          isMaster ? "bg-primary/5 border border-primary/20" : "bg-card border"
        }`}
        onClick={() => setOpen(!open)}
      >
        {kids.length > 0 ? (
          open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <div className="w-4" />
        )}

        <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
          isMaster ? "bg-primary text-primary-foreground" : empresa.tipo === "subestabelecido" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
        }`}>
          {isMaster ? <Leaf className="h-4 w-4" /> : empresa.tipo === "subestabelecido" ? <Building2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{empresa.nome_fantasia || empresa.razao_social}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {TIPO_LABELS[empresa.tipo] || empresa.tipo}
            </Badge>
          </div>
          {empresa.cnpj && <p className="text-xs text-muted-foreground font-mono">{empresa.cnpj}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {empresa.uf && <span className="text-xs text-muted-foreground">{empresa.uf}</span>}
          <Badge variant="secondary" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
          {kids.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{kids.length}</span>
          )}
        </div>
      </div>

      {open && kids.length > 0 && (
        <div className="mt-1 space-y-1">
          {kids.map((kid) => (
            <TreeNode key={kid.id} empresa={kid} children={children} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OnboardingEstrutura() {
  const [empresas, setEmpresas] = useState<OnboardingEmpresa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("onboarding_empresas")
      .select("*")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setEmpresas((data as OnboardingEmpresa[]) || []);
        setLoading(false);
      });
  }, []);

  const master = empresas.find((e) => e.tipo === "master");
  const totalSubs = empresas.filter((e) => e.tipo === "subestabelecido").length;
  const totalABs = empresas.filter((e) => e.tipo === "agrobanker").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Estrutura Comercial"
        description="Visualização hierárquica do ecossistema Guatã"
        icon={<GitBranch className="h-5 w-5" />}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">COBAN Master</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSubs}</p>
              <p className="text-xs text-muted-foreground">Subestabelecidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalABs}</p>
              <p className="text-xs text-muted-foreground">Agrobankers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !master ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma estrutura encontrada.</p>
          ) : (
            <div className="space-y-1">
              <TreeNode empresa={master} children={empresas} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
