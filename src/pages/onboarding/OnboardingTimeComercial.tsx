import { useEffect, useState } from "react";
import { onboardingDb } from "@/lib/onboarding-db";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Plus, Users, Building2, Eye, UserPlus, Search } from "lucide-react";

interface RM {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cargo: string;
  status: string;
  empresa_id: string;
  user_id: string | null;
  created_at: string;
}

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  tipo: string;
  rm_id: string | null;
}

export default function OnboardingTimeComercial() {
  const [rms, setRms] = useState<RM[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vincularOpen, setVincularOpen] = useState<string | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState({ nome: "", cpf: "", email: "", telefone: "", cargo: "RM Comercial" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [{ data: rmData }, { data: empData }] = await Promise.all([
      (onboardingDb as any).rm().select("*").order("created_at", { ascending: false }),
      (onboardingDb as any).empresas().select("id, razao_social, nome_fantasia, tipo, rm_id"),
    ]);
    setRms((rmData as RM[]) || []);
    setEmpresas((empData as Empresa[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Não autenticado");

      // Get master empresa
      const masterEmpresa = empresas.find(e => e.tipo === 'master') || empresas[0];
      if (!masterEmpresa) throw new Error("Nenhuma empresa master encontrada");

      const { error } = await (onboardingDb as any).rm().insert({
        ...form,
        empresa_id: masterEmpresa.id,
        created_by: user.user.id,
      });
      if (error) throw error;
      
      toast({ title: "RM cadastrado!", description: `${form.nome} foi adicionado ao time comercial.` });
      setDialogOpen(false);
      setForm({ nome: "", cpf: "", email: "", telefone: "", cargo: "RM Comercial" });
      loadData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleVincular = async (rmId: string) => {
    if (!selectedEmpresa) return;
    try {
      const { error } = await (onboardingDb as any).empresas()
        .update({ rm_id: rmId })
        .eq("id", selectedEmpresa);
      if (error) throw error;
      toast({ title: "Vinculado!", description: "Subestabelecido vinculado ao RM." });
      setVincularOpen(null);
      setSelectedEmpresa("");
      loadData();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const subestabelecidos = empresas.filter(e => e.tipo === 'subestabelecido');
  
  const getVinculados = (rmId: string) => empresas.filter(e => e.rm_id === rmId);
  const getNaoVinculados = () => subestabelecidos.filter(e => !e.rm_id);

  const filtered = rms.filter(rm => 
    !searchTerm || rm.nome.toLowerCase().includes(searchTerm.toLowerCase()) || rm.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Time Comercial"
        description="Gerencie seus RMs (Relationship Managers) e vincule-os aos Subestabelecidos da rede"
        icon={<Briefcase className="h-5 w-5" />}
      />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "RMs Cadastrados", value: rms.length, icon: Users },
          { label: "Subestabelecidos", value: subestabelecidos.length, icon: Building2 },
          { label: "Vinculados", value: subestabelecidos.filter(e => e.rm_id).length, icon: UserPlus },
          { label: "Sem RM", value: getNaoVinculados().length, icon: Briefcase },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar RM..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo RM</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Novo RM</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome Completo *</Label><Input value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>CPF *</Label><Input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => setForm(p => ({ ...p, cpf: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm(p => ({ ...p, cargo: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={saving || !form.nome || !form.cpf || !form.email}>
                {saving ? "Salvando..." : "Cadastrar RM"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* RM List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum RM cadastrado ainda.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((rm) => {
            const vinculados = getVinculados(rm.id);
            return (
              <Card key={rm.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{rm.nome}</CardTitle>
                        <p className="text-xs text-muted-foreground">{rm.cargo} · {rm.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rm.status === 'ativo' ? 'default' : 'secondary'}>{rm.status === 'ativo' ? 'Ativo' : rm.status}</Badge>
                      {rm.user_id && <Badge variant="outline" className="text-xs text-primary border-primary">Login ativo</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Subestabelecidos vinculados ({vinculados.length})</p>
                      {vinculados.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">Nenhum subestabelecido vinculado</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {vinculados.map(e => (
                            <Badge key={e.id} variant="outline" className="text-xs">{e.nome_fantasia || e.razao_social}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Dialog open={vincularOpen === rm.id} onOpenChange={(o) => { if (!o) setVincularOpen(null); }}>
                      <Button variant="outline" size="sm" onClick={() => setVincularOpen(rm.id)} disabled={getNaoVinculados().length === 0}>
                        <UserPlus className="h-3 w-3 mr-1" /> Vincular
                      </Button>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Vincular Subestabelecido ao RM {rm.nome}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                            <SelectTrigger><SelectValue placeholder="Selecione um subestabelecido" /></SelectTrigger>
                            <SelectContent>
                              {getNaoVinculados().map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button className="w-full" onClick={() => handleVincular(rm.id)} disabled={!selectedEmpresa}>Vincular</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
