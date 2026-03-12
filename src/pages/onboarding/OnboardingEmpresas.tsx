import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardingDb } from "@/lib/onboarding-db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, Search, UserPlus, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { STATUS_LABELS, TIPO_LABELS } from "@/types/onboarding";
import type { OnboardingEmpresa, OnboardingResponsavel, OnboardingDocumento, OnboardingComplianceItem } from "@/types/onboarding";

export default function OnboardingEmpresas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<OnboardingEmpresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTipo, setFilterTipo] = useState("all");
  const [selected, setSelected] = useState<OnboardingEmpresa | null>(null);
  const [detailData, setDetailData] = useState<{
    responsaveis: OnboardingResponsavel[];
    documentos: OnboardingDocumento[];
    compliance: OnboardingComplianceItem[];
  } | null>(null);

  useEffect(() => { loadEmpresas(); }, []);

  async function loadEmpresas() {
    const { data } = await onboardingDb.empresas()
      .select("*")
      .neq("tipo", "master")
      .order("created_at", { ascending: false });
    setEmpresas((data as OnboardingEmpresa[]) || []);
    setLoading(false);
  }

  async function openDetail(empresa: OnboardingEmpresa) {
    setSelected(empresa);
    const [resp, docs, comp] = await Promise.all([
      onboardingDb.responsaveis().select("*").eq("empresa_id", empresa.id),
      onboardingDb.documentos().select("*").eq("empresa_id", empresa.id),
      onboardingDb.compliance().select("*").eq("empresa_id", empresa.id),
    ]);
    setDetailData({
      responsaveis: (resp.data as OnboardingResponsavel[]) || [],
      documentos: (docs.data as OnboardingDocumento[]) || [],
      compliance: (comp.data as OnboardingComplianceItem[]) || [],
    });
  }

  async function toggleStatus(empresa: OnboardingEmpresa) {
    const newStatus = empresa.status === "ativo" ? "inativo" : "ativo";
    await onboardingDb.empresas().update({ status: newStatus }).eq("id", empresa.id);
    toast({ title: `Status alterado para ${STATUS_LABELS[newStatus]?.label || newStatus}` });
    loadEmpresas();
  }

  const filtered = empresas.filter((e) => {
    const matchSearch = !search || e.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) || e.razao_social?.toLowerCase().includes(search.toLowerCase()) || e.cnpj?.includes(search);
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    const matchTipo = filterTipo === "all" || e.tipo === filterTipo;
    return matchSearch && matchStatus && matchTipo;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Empresas Cadastradas"
        description="Gerencie todas as empresas do ecossistema"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Button onClick={() => navigate("/onboarding/cadastro")}><UserPlus className="mr-2 h-4 w-4" /> Novo Cadastro</Button>}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou CNPJ..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="subestabelecido">Subestabelecido</SelectItem>
                <SelectItem value="agrobanker">Agrobanker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">Nenhuma empresa encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((empresa) => {
                  const statusInfo = STATUS_LABELS[empresa.status] || { label: empresa.status, color: "" };
                  return (
                    <TableRow key={empresa.id}>
                      <TableCell className="font-medium">{empresa.nome_fantasia || empresa.razao_social}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{empresa.cnpj}</TableCell>
                      <TableCell>{TIPO_LABELS[empresa.tipo] || empresa.tipo}</TableCell>
                      <TableCell>{empresa.uf}</TableCell>
                      <TableCell><Badge variant="secondary" className={statusInfo.color}>{statusInfo.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(empresa.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(empresa)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(empresa)}>
                            {empresa.status === "ativo" ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setDetailData(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected?.nome_fantasia || selected?.razao_social}</DialogTitle></DialogHeader>
          {selected && detailData && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg">
                <span className="text-muted-foreground">CNPJ:</span><span>{selected.cnpj}</span>
                <span className="text-muted-foreground">Tipo:</span><span>{TIPO_LABELS[selected.tipo]}</span>
                <span className="text-muted-foreground">UF / Município:</span><span>{selected.uf} - {selected.municipio}</span>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="secondary" className={STATUS_LABELS[selected.status]?.color}>{STATUS_LABELS[selected.status]?.label}</Badge>
              </div>
              {detailData.responsaveis.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Responsável Legal</h4>
                  {detailData.responsaveis.map((r) => (
                    <div key={r.id} className="bg-muted/30 p-3 rounded-lg grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">Nome:</span><span>{r.nome}</span>
                      <span className="text-muted-foreground">CPF:</span><span>{r.cpf}</span>
                      <span className="text-muted-foreground">Email:</span><span>{r.email}</span>
                      <span className="text-muted-foreground">Cargo:</span><span>{r.cargo || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              {detailData.documentos.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Documentos ({detailData.documentos.length})</h4>
                  <div className="space-y-1.5">
                    {detailData.documentos.map((d) => (
                      <div key={d.id} className="flex items-center gap-2 p-2 rounded border text-xs">
                        <span className="flex-1">{d.nome_arquivo}</span>
                        <Badge variant="secondary" className={STATUS_LABELS[d.status]?.color || ""}>{STATUS_LABELS[d.status]?.label || d.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailData.compliance.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Compliance</h4>
                  <div className="space-y-1.5">
                    {detailData.compliance.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 p-2 rounded border text-xs">
                        <div className={`h-3 w-3 rounded-full shrink-0 ${c.status === "aprovado" ? "bg-primary" : c.status === "rejeitado" ? "bg-destructive" : "bg-accent"}`} />
                        <span className="flex-1">{c.descricao}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
