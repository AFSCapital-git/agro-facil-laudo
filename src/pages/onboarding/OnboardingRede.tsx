import { useEffect, useState } from "react";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Filter, Eye, Building2 } from "lucide-react";
import { SEGMENTOS, STATUS_MEMBRO_LABELS } from "@/types/rede-membro";
import type { RedeMembro } from "@/types/rede-membro";
import { CadastroMembroWizard } from "@/components/onboarding/CadastroMembroWizard";

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
}

export default function OnboardingRede() {
  const [membros, setMembros] = useState<RedeMembro[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSegmento, setFilterSegmento] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMembro, setViewMembro] = useState<RedeMembro | null>(null);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [{ data: memData, error }, { data: empData }] = await Promise.all([
      (onboardingDb as any).redeMembros().select("*").order("created_at", { ascending: false }),
      (onboardingDb as any).empresas().select("id, razao_social, nome_fantasia"),
    ]);
    if (error) {
      toast({ title: "Erro ao carregar rede", description: error.message, variant: "destructive" });
    }
    setMembros((memData as RedeMembro[]) || []);
    setEmpresas((empData as Empresa[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getEmpresaNome = (empresaId: string) => {
    const emp = empresas.find(e => e.id === empresaId);
    return emp ? (emp.nome_fantasia || emp.razao_social) : "";
  };

  const filtered = membros.filter((m) => {
    const name = m.tipo_pessoa === 'pj' ? (m.nome_fantasia || m.razao_social) : m.nome_completo;
    const matchSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) || m.cpf?.includes(searchTerm) || m.cnpj?.includes(searchTerm);
    const matchSegmento = filterSegmento === "todos" || m.segmento === filterSegmento;
    const matchStatus = filterStatus === "todos" || m.status === filterStatus;
    return matchSearch && matchSegmento && matchStatus;
  });

  const stats = {
    total: membros.length,
    ativos: membros.filter(m => m.status === 'ativo').length,
    pendentes: membros.filter(m => m.status === 'pendente').length,
    pf: membros.filter(m => m.tipo_pessoa === 'pf').length,
    pj: membros.filter(m => m.tipo_pessoa === 'pj').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Minha Rede"
        description="Gerencie agrobankers, engenheiros, revendas e demais parceiros da sua rede"
        icon={<Users className="h-5 w-5" />}
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total },
          { label: "Ativos", value: stats.ativos },
          { label: "Pendentes", value: stats.pendentes },
          { label: "Pessoa Física", value: stats.pf },
          { label: "Pessoa Jurídica", value: stats.pj },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + New */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou CNPJ..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterSegmento} onValueChange={setFilterSegmento}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Segmentos</SelectItem>
            {SEGMENTOS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {Object.entries(STATUS_MEMBRO_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo Membro</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastro de Novo Membro da Rede</DialogTitle>
            </DialogHeader>
            <CadastroMembroWizard
              onSuccess={() => {
                setDialogOpen(false);
                loadData();
                toast({ title: "Membro cadastrado!", description: "O membro foi adicionado à sua rede." });
              }}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum membro encontrado.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((m) => {
                const statusInfo = STATUS_MEMBRO_LABELS[m.status] || { label: m.status, color: '' };
                const segLabel = SEGMENTOS.find(s => s.value === m.segmento)?.label || m.segmento;
                const displayName = m.tipo_pessoa === 'pj' ? (m.nome_fantasia || m.razao_social) : m.nome_completo;
                const displayDoc = m.tipo_pessoa === 'pj' ? m.cnpj : m.cpf;

                return (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{displayName || "Sem nome"}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.tipo_pessoa === 'pj' ? 'PJ' : 'PF'}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{segLabel}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground font-mono">{displayDoc || "—"}</p>
                        {getEmpresaNome(m.empresa_id) && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {getEmpresaNome(m.empresa_id)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.uf && <span className="text-xs text-muted-foreground">{m.uf}</span>}
                      <Badge variant="secondary" className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>
                      {m.user_criado && <Badge variant="outline" className="text-[10px] text-primary border-primary">Conta ativa</Badge>}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMembro(m)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View detail dialog */}
      <Dialog open={!!viewMembro} onOpenChange={(o) => !o && setViewMembro(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Membro</DialogTitle>
          </DialogHeader>
          {viewMembro && (
            <div className="grid gap-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-4 rounded-lg">
                {viewMembro.tipo_pessoa === 'pj' && (
                  <>
                    <span className="text-muted-foreground">CNPJ:</span><span>{viewMembro.cnpj}</span>
                    <span className="text-muted-foreground">Razão Social:</span><span>{viewMembro.razao_social}</span>
                    <span className="text-muted-foreground">Nome Fantasia:</span><span>{viewMembro.nome_fantasia}</span>
                  </>
                )}
                <span className="text-muted-foreground">Nome:</span><span>{viewMembro.nome_completo}</span>
                <span className="text-muted-foreground">CPF:</span><span>{viewMembro.cpf}</span>
                <span className="text-muted-foreground">Email:</span><span>{viewMembro.email}</span>
                <span className="text-muted-foreground">Telefone:</span><span>({viewMembro.ddd}) {viewMembro.telefone}</span>
                <span className="text-muted-foreground">Segmento:</span><span>{SEGMENTOS.find(s => s.value === viewMembro.segmento)?.label}</span>
                <span className="text-muted-foreground">Status:</span><span>{STATUS_MEMBRO_LABELS[viewMembro.status]?.label}</span>
                <span className="text-muted-foreground">Endereço:</span><span>{viewMembro.logradouro}, {viewMembro.numero} - {viewMembro.bairro}, {viewMembro.cidade}/{viewMembro.uf}</span>
                {viewMembro.crea && <><span className="text-muted-foreground">CREA:</span><span>{viewMembro.crea}</span></>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
