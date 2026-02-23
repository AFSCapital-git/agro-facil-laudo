import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/ui/stat-card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, BookOpen, ShieldCheck, Package, Target, Clock, CheckCircle2,
  Plus, Pencil, Trash2, Award, Users, Calendar, AlertTriangle, Trophy,
  BarChart3, TrendingUp, Star, Settings, Play, Eye, ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";

// ─── Types ───
interface Trilha {
  id: string; nome: string; descricao: string; icone: string; cor: string; ordem: number; ativo: boolean;
}
interface Modulo {
  id: string; trilha_id: string; titulo: string; descricao: string; duracao_minutos: number;
  ordem: number; obrigatorio: boolean; pontos: number; ativo: boolean; pre_requisito_id: string | null;
}
interface BadgeDef {
  id: string; nome: string; descricao: string; icone: string; cor: string;
  criterio_tipo: string; criterio_valor: string; pontos_bonus: number; ativo: boolean;
}
interface Agenda {
  id: string; titulo: string; descricao: string; modulo_id: string | null; data_evento: string;
  hora_inicio: string | null; hora_fim: string | null; tipo: string; recorrencia: string;
  obrigatorio: boolean; max_participantes: number | null; ativo: boolean;
}
interface SLAConfig {
  id: string; nome: string; descricao: string; prazo_dias: number; tipo: string;
  penalidade: string; ativo: boolean;
}
interface ProgressoAgg {
  agrobanker_id: string; nome_fantasia: string; total: number; concluidos: number; pontos: number;
}

// ─── Page ───
export default function AdminTreinamento() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [slas, setSlas] = useState<SLAConfig[]>([]);
  const [progressoAgg, setProgressoAgg] = useState<ProgressoAgg[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [trilhaDialog, setTrilhaDialog] = useState(false);
  const [moduloDialog, setModuloDialog] = useState(false);
  const [badgeDialog, setBadgeDialog] = useState(false);
  const [agendaDialog, setAgendaDialog] = useState(false);
  const [slaDialog, setSlaDialog] = useState(false);

  // Edit state
  const [editTrilha, setEditTrilha] = useState<Partial<Trilha>>({});
  const [editModulo, setEditModulo] = useState<Partial<Modulo>>({});
  const [editBadge, setEditBadge] = useState<Partial<BadgeDef>>({});
  const [editAgenda, setEditAgenda] = useState<Partial<Agenda>>({});
  const [editSla, setEditSla] = useState<Partial<SLAConfig>>({});

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [t, m, b, a, s] = await Promise.all([
      supabase.from("treinamento_trilhas").select("*").order("ordem"),
      supabase.from("treinamento_modulos").select("*").order("ordem"),
      supabase.from("treinamento_badges").select("*").order("created_at"),
      supabase.from("treinamento_agenda").select("*").order("data_evento"),
      supabase.from("treinamento_sla").select("*").order("created_at"),
    ]);
    setTrilhas((t.data as Trilha[]) || []);
    setModulos((m.data as Modulo[]) || []);
    setBadges((b.data as BadgeDef[]) || []);
    setAgenda((a.data as Agenda[]) || []);
    setSlas((s.data as SLAConfig[]) || []);

    // Aggregate progress
    const { data: progData } = await supabase
      .from("treinamento_progresso")
      .select("agrobanker_id, status, pontuacao");
    const { data: abData } = await supabase.from("agrobankers").select("id, nome_fantasia");
    if (abData && progData) {
      const map: Record<string, ProgressoAgg> = {};
      abData.forEach(ab => {
        map[ab.id] = { agrobanker_id: ab.id, nome_fantasia: ab.nome_fantasia, total: 0, concluidos: 0, pontos: 0 };
      });
      progData.forEach(p => {
        if (map[p.agrobanker_id]) {
          map[p.agrobanker_id].total++;
          if (p.status === "concluido") map[p.agrobanker_id].concluidos++;
          map[p.agrobanker_id].pontos += p.pontuacao || 0;
        }
      });
      setProgressoAgg(Object.values(map).sort((a, b) => b.pontos - a.pontos));
    }
    setLoading(false);
  }

  // ─── CRUD Trilha ───
  async function saveTrilha() {
    if (!editTrilha.nome) return;
    if (editTrilha.id) {
      await supabase.from("treinamento_trilhas").update(editTrilha as any).eq("id", editTrilha.id);
    } else {
      await supabase.from("treinamento_trilhas").insert(editTrilha as any);
    }
    toast({ title: "Trilha salva com sucesso" });
    setTrilhaDialog(false); setEditTrilha({}); fetchAll();
  }
  async function deleteTrilha(id: string) {
    await supabase.from("treinamento_trilhas").delete().eq("id", id);
    toast({ title: "Trilha excluída" }); fetchAll();
  }

  // ─── CRUD Módulo ───
  async function saveModulo() {
    if (!editModulo.titulo || !editModulo.trilha_id) return;
    if (editModulo.id) {
      await supabase.from("treinamento_modulos").update(editModulo as any).eq("id", editModulo.id);
    } else {
      await supabase.from("treinamento_modulos").insert(editModulo as any);
    }
    toast({ title: "Módulo salvo com sucesso" });
    setModuloDialog(false); setEditModulo({}); fetchAll();
  }
  async function deleteModulo(id: string) {
    await supabase.from("treinamento_modulos").delete().eq("id", id);
    toast({ title: "Módulo excluído" }); fetchAll();
  }

  // ─── CRUD Badge ───
  async function saveBadge() {
    if (!editBadge.nome) return;
    if (editBadge.id) {
      await supabase.from("treinamento_badges").update(editBadge as any).eq("id", editBadge.id);
    } else {
      await supabase.from("treinamento_badges").insert(editBadge as any);
    }
    toast({ title: "Badge salva" });
    setBadgeDialog(false); setEditBadge({}); fetchAll();
  }
  async function deleteBadge(id: string) {
    await supabase.from("treinamento_badges").delete().eq("id", id);
    toast({ title: "Badge excluída" }); fetchAll();
  }

  // ─── CRUD Agenda ───
  async function saveAgenda() {
    if (!editAgenda.titulo || !editAgenda.data_evento) return;
    if (editAgenda.id) {
      await supabase.from("treinamento_agenda").update(editAgenda as any).eq("id", editAgenda.id);
    } else {
      await supabase.from("treinamento_agenda").insert(editAgenda as any);
    }
    toast({ title: "Evento salvo" });
    setAgendaDialog(false); setEditAgenda({}); fetchAll();
  }
  async function deleteAgenda(id: string) {
    await supabase.from("treinamento_agenda").delete().eq("id", id);
    toast({ title: "Evento excluído" }); fetchAll();
  }

  // ─── CRUD SLA ───
  async function saveSla() {
    if (!editSla.nome) return;
    if (editSla.id) {
      await supabase.from("treinamento_sla").update(editSla as any).eq("id", editSla.id);
    } else {
      await supabase.from("treinamento_sla").insert(editSla as any);
    }
    toast({ title: "SLA salvo" });
    setSlaDialog(false); setEditSla({}); fetchAll();
  }
  async function deleteSla(id: string) {
    await supabase.from("treinamento_sla").delete().eq("id", id);
    toast({ title: "SLA excluído" }); fetchAll();
  }

  const totalAgrobankers = progressoAgg.length;
  const avgCompletion = totalAgrobankers > 0
    ? Math.round(progressoAgg.reduce((s, p) => s + (modulos.length > 0 ? (p.concluidos / modulos.length) * 100 : 0), 0) / totalAgrobankers)
    : 0;
  const totalPontos = progressoAgg.reduce((s, p) => s + p.pontos, 0);
  const upcomingEvents = agenda.filter(a => new Date(a.data_evento) >= new Date()).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Treinamento"
        description="Administre trilhas, módulos, gamificação, agenda e SLA do portal de capacitação AgroBanker"
        icon={<GraduationCap className="h-5 w-5" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
          <TabsTrigger value="trilhas" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Trilhas & Módulos</TabsTrigger>
          <TabsTrigger value="gamificacao" className="gap-1.5"><Trophy className="h-3.5 w-3.5" /> Gamificação</TabsTrigger>
          <TabsTrigger value="agenda" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Agenda</TabsTrigger>
          <TabsTrigger value="sla" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> SLA</TabsTrigger>
          <TabsTrigger value="ranking" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Ranking & Resultados</TabsTrigger>
        </TabsList>

        {/* ═══ DASHBOARD ═══ */}
        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={<BookOpen className="h-4 w-4" />} title="Trilhas Ativas" value={String(trilhas.filter(t => t.ativo).length)} delay={0} />
            <StatCard icon={<Package className="h-4 w-4" />} title="Módulos Cadastrados" value={String(modulos.length)} description={`${modulos.filter(m => m.obrigatorio).length} obrigatórios`} delay={100} />
            <StatCard icon={<Users className="h-4 w-4" />} title="AgroBankers em Treinamento" value={String(totalAgrobankers)} description={`${avgCompletion}% conclusão média`} delay={200} />
            <StatCard icon={<Trophy className="h-4 w-4" />} title="Pontos Distribuídos" value={totalPontos.toLocaleString()} description={`${badges.length} badges disponíveis`} delay={300} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Próximos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                {agenda.filter(a => new Date(a.data_evento) >= new Date()).slice(0, 5).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento agendado</p>
                ) : (
                  <div className="space-y-3">
                    {agenda.filter(a => new Date(a.data_evento) >= new Date()).slice(0, 5).map(ev => (
                      <div key={ev.id} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="font-medium">{ev.titulo}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(ev.data_evento + "T00:00:00"), "dd/MM/yyyy")} {ev.hora_inicio && `às ${ev.hora_inicio?.slice(0, 5)}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ev.obrigatorio && <Badge variant="destructive" className="text-[10px]">Obrigatório</Badge>}
                          <Badge variant="outline" className="text-[10px]">{ev.tipo}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" /> Top 5 AgroBankers</CardTitle>
              </CardHeader>
              <CardContent>
                {progressoAgg.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum progresso registrado</p>
                ) : (
                  <div className="space-y-3">
                    {progressoAgg.slice(0, 5).map((p, i) => (
                      <div key={p.agrobanker_id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                          <span className="font-medium">{p.nome_fantasia}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{p.concluidos}/{modulos.length} módulos</span>
                          <Badge variant="secondary" className="text-[10px]">{p.pontos} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> SLAs Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              {slas.filter(s => s.ativo).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum SLA configurado</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {slas.filter(s => s.ativo).map(s => (
                    <div key={s.id} className="border rounded-lg p-3 space-y-1">
                      <p className="font-medium text-sm">{s.nome}</p>
                      <p className="text-xs text-muted-foreground">{s.descricao}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{s.prazo_dias} dias</Badge>
                        <Badge variant="destructive" className="text-[10px]">{s.penalidade.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ TRILHAS & MÓDULOS ═══ */}
        <TabsContent value="trilhas" className="mt-4 space-y-6">
          {/* Trilhas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Trilhas de Conhecimento</CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { setEditTrilha({ ordem: trilhas.length }); setTrilhaDialog(true); }}>
                <Plus className="h-3.5 w-3.5" /> Nova Trilha
              </Button>
            </CardHeader>
            <CardContent>
              {trilhas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma trilha cadastrada. Crie a primeira trilha para começar.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {trilhas.map(t => (
                    <div key={t.id} className="border rounded-lg p-4 space-y-2 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: t.cor + "20", color: t.cor }}>
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{t.nome}</p>
                            <p className="text-xs text-muted-foreground">{modulos.filter(m => m.trilha_id === t.id).length} módulos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={t.ativo ? "secondary" : "destructive"} className="text-[10px]">{t.ativo ? "Ativa" : "Inativa"}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTrilha(t); setTrilhaDialog(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTrilha(t.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Módulos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Módulos de Treinamento</CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { setEditModulo({ ordem: modulos.length, pontos: 10, duracao_minutos: 30 }); setModuloDialog(true); }}>
                <Plus className="h-3.5 w-3.5" /> Novo Módulo
              </Button>
            </CardHeader>
            <CardContent>
              {modulos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum módulo cadastrado. Crie trilhas primeiro e depois adicione módulos.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Trilha</TableHead>
                      <TableHead className="text-center">Duração</TableHead>
                      <TableHead className="text-center">Pontos</TableHead>
                      <TableHead className="text-center">Obrigatório</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modulos.map(m => {
                      const trilha = trilhas.find(t => t.id === m.trilha_id);
                      return (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{m.titulo}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{m.descricao}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]" style={{ borderColor: trilha?.cor }}>{trilha?.nome || "—"}</Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm">{m.duracao_minutos} min</TableCell>
                          <TableCell className="text-center text-sm">{m.pontos}</TableCell>
                          <TableCell className="text-center">
                            {m.obrigatorio ? <Badge variant="destructive" className="text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={m.ativo ? "secondary" : "destructive"} className="text-[10px]">{m.ativo ? "Ativo" : "Inativo"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditModulo(m); setModuloDialog(true); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteModulo(m.id)}>
                                <Trash2 className="h-3 w-3" />
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
        </TabsContent>

        {/* ═══ GAMIFICAÇÃO ═══ */}
        <TabsContent value="gamificacao" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" /> Badges & Certificações</CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { setEditBadge({ pontos_bonus: 0, criterio_tipo: "trilha_completa" }); setBadgeDialog(true); }}>
                <Plus className="h-3.5 w-3.5" /> Nova Badge
              </Button>
            </CardHeader>
            <CardContent>
              {badges.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma badge cadastrada. Crie badges para motivar os AgroBankers.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {badges.map(b => (
                    <div key={b.id} className="border rounded-lg p-4 space-y-2 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: b.cor + "20", color: b.cor }}>
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{b.nome}</p>
                            <p className="text-xs text-muted-foreground">+{b.pontos_bonus} pts bônus</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditBadge(b); setBadgeDialog(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBadge(b.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{b.descricao}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{b.criterio_tipo.replace("_", " ")}</Badge>
                        {b.criterio_valor && <Badge variant="secondary" className="text-[10px]">{b.criterio_valor}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ AGENDA ═══ */}
        <TabsContent value="agenda" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" /> Calendário de Treinamentos</CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { setEditAgenda({ tipo: "online", recorrencia: "unico", obrigatorio: false }); setAgendaDialog(true); }}>
                <Plus className="h-3.5 w-3.5" /> Novo Evento
              </Button>
            </CardHeader>
            <CardContent>
              {agenda.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento agendado. Crie eventos de treinamento para os AgroBankers.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead className="text-center">Tipo</TableHead>
                      <TableHead className="text-center">Recorrência</TableHead>
                      <TableHead className="text-center">Obrigatório</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agenda.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{a.titulo}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.descricao}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(a.data_evento + "T00:00:00"), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-sm">{a.hora_inicio ? `${a.hora_inicio.slice(0, 5)} - ${a.hora_fim?.slice(0, 5) || ""}` : "—"}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="text-[10px]">{a.tipo}</Badge></TableCell>
                        <TableCell className="text-center"><Badge variant="secondary" className="text-[10px]">{a.recorrencia}</Badge></TableCell>
                        <TableCell className="text-center">
                          {a.obrigatorio ? <Badge variant="destructive" className="text-[10px]">Sim</Badge> : <span className="text-xs text-muted-foreground">Não</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditAgenda(a); setAgendaDialog(true); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAgenda(a.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ SLA ═══ */}
        <TabsContent value="sla" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Regras de SLA de Treinamento</CardTitle>
              <Button size="sm" className="gap-1" onClick={() => { setEditSla({ prazo_dias: 30, tipo: "onboarding", penalidade: "bloqueio_acesso" }); setSlaDialog(true); }}>
                <Plus className="h-3.5 w-3.5" /> Novo SLA
              </Button>
            </CardHeader>
            <CardContent>
              {slas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum SLA configurado.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {slas.map(s => (
                    <div key={s.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{s.nome}</p>
                        <div className="flex gap-1">
                          <Badge variant={s.ativo ? "secondary" : "destructive"} className="text-[10px]">{s.ativo ? "Ativo" : "Inativo"}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditSla(s); setSlaDialog(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSla(s.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.descricao}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{s.prazo_dias} dias</Badge>
                        <Badge variant="outline">{s.tipo}</Badge>
                        <Badge variant="destructive" className="text-[10px]">{s.penalidade.replace(/_/g, " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ RANKING ═══ */}
        <TabsContent value="ranking" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" /> Ranking Geral de AgroBankers</CardTitle>
              <CardDescription>Classificação por pontuação e módulos concluídos</CardDescription>
            </CardHeader>
            <CardContent>
              {progressoAgg.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum AgroBanker com progresso registrado.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>AgroBanker</TableHead>
                      <TableHead className="text-center">Módulos Concluídos</TableHead>
                      <TableHead className="text-center">Progresso</TableHead>
                      <TableHead className="text-center">Pontuação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {progressoAgg.map((p, i) => {
                      const pct = modulos.length > 0 ? Math.round((p.concluidos / modulos.length) * 100) : 0;
                      return (
                        <TableRow key={p.agrobanker_id}>
                          <TableCell>
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-primary/60 text-primary-foreground" : i === 2 ? "bg-primary/30 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {i + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{p.nome_fantasia}</TableCell>
                          <TableCell className="text-center">{p.concluidos}/{modulos.length}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{p.pontos} pts</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ═══ */}

      {/* Trilha Dialog */}
      <Dialog open={trilhaDialog} onOpenChange={setTrilhaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTrilha.id ? "Editar Trilha" : "Nova Trilha"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={editTrilha.nome || ""} onChange={e => setEditTrilha(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Cultura & Valores" /></div>
            <div><Label>Descrição</Label><Textarea value={editTrilha.descricao || ""} onChange={e => setEditTrilha(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva a trilha..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cor</Label><Input type="color" value={editTrilha.cor || "#3b82f6"} onChange={e => setEditTrilha(p => ({ ...p, cor: e.target.value }))} /></div>
              <div><Label>Ordem</Label><Input type="number" value={editTrilha.ordem ?? 0} onChange={e => setEditTrilha(p => ({ ...p, ordem: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editTrilha.ativo ?? true} onCheckedChange={v => setEditTrilha(p => ({ ...p, ativo: v }))} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter><Button onClick={saveTrilha}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Módulo Dialog */}
      <Dialog open={moduloDialog} onOpenChange={setModuloDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editModulo.id ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={editModulo.titulo || ""} onChange={e => setEditModulo(p => ({ ...p, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={editModulo.descricao || ""} onChange={e => setEditModulo(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div>
              <Label>Trilha</Label>
              <Select value={editModulo.trilha_id || ""} onValueChange={v => setEditModulo(p => ({ ...p, trilha_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione a trilha" /></SelectTrigger>
                <SelectContent>{trilhas.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Duração (min)</Label><Input type="number" value={editModulo.duracao_minutos ?? 30} onChange={e => setEditModulo(p => ({ ...p, duracao_minutos: Number(e.target.value) }))} /></div>
              <div><Label>Pontos</Label><Input type="number" value={editModulo.pontos ?? 10} onChange={e => setEditModulo(p => ({ ...p, pontos: Number(e.target.value) }))} /></div>
              <div><Label>Ordem</Label><Input type="number" value={editModulo.ordem ?? 0} onChange={e => setEditModulo(p => ({ ...p, ordem: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label>Pré-requisito</Label>
              <Select value={editModulo.pre_requisito_id || "none"} onValueChange={v => setEditModulo(p => ({ ...p, pre_requisito_id: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {modulos.filter(m => m.id !== editModulo.id).map(m => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={editModulo.obrigatorio ?? false} onCheckedChange={v => setEditModulo(p => ({ ...p, obrigatorio: v }))} /><Label>Obrigatório</Label></div>
              <div className="flex items-center gap-2"><Switch checked={editModulo.ativo ?? true} onCheckedChange={v => setEditModulo(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveModulo}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={badgeDialog} onOpenChange={setBadgeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editBadge.id ? "Editar Badge" : "Nova Badge"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={editBadge.nome || ""} onChange={e => setEditBadge(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Embaixador AFSAgro" /></div>
            <div><Label>Descrição</Label><Textarea value={editBadge.descricao || ""} onChange={e => setEditBadge(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cor</Label><Input type="color" value={editBadge.cor || "#f59e0b"} onChange={e => setEditBadge(p => ({ ...p, cor: e.target.value }))} /></div>
              <div><Label>Pontos Bônus</Label><Input type="number" value={editBadge.pontos_bonus ?? 0} onChange={e => setEditBadge(p => ({ ...p, pontos_bonus: Number(e.target.value) }))} /></div>
            </div>
            <div>
              <Label>Critério</Label>
              <Select value={editBadge.criterio_tipo || "trilha_completa"} onValueChange={v => setEditBadge(p => ({ ...p, criterio_tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trilha_completa">Trilha completa</SelectItem>
                  <SelectItem value="modulos_obrigatorios">Módulos obrigatórios</SelectItem>
                  <SelectItem value="pontuacao_minima">Pontuação mínima</SelectItem>
                  <SelectItem value="todos_modulos">Todos os módulos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Valor do Critério</Label><Input value={editBadge.criterio_valor || ""} onChange={e => setEditBadge(p => ({ ...p, criterio_valor: e.target.value }))} placeholder="Ex: ID da trilha ou pontuação" /></div>
          </div>
          <DialogFooter><Button onClick={saveBadge}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Agenda Dialog */}
      <Dialog open={agendaDialog} onOpenChange={setAgendaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editAgenda.id ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={editAgenda.titulo || ""} onChange={e => setEditAgenda(p => ({ ...p, titulo: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={editAgenda.descricao || ""} onChange={e => setEditAgenda(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div><Label>Data</Label><Input type="date" value={editAgenda.data_evento || ""} onChange={e => setEditAgenda(p => ({ ...p, data_evento: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Hora Início</Label><Input type="time" value={editAgenda.hora_inicio || ""} onChange={e => setEditAgenda(p => ({ ...p, hora_inicio: e.target.value }))} /></div>
              <div><Label>Hora Fim</Label><Input type="time" value={editAgenda.hora_fim || ""} onChange={e => setEditAgenda(p => ({ ...p, hora_fim: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={editAgenda.tipo || "online"} onValueChange={v => setEditAgenda(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="hibrido">Híbrido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recorrência</Label>
                <Select value={editAgenda.recorrencia || "unico"} onValueChange={v => setEditAgenda(p => ({ ...p, recorrencia: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unico">Único</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Máx. Participantes</Label><Input type="number" value={editAgenda.max_participantes ?? ""} onChange={e => setEditAgenda(p => ({ ...p, max_participantes: e.target.value ? Number(e.target.value) : null }))} placeholder="Ilimitado" /></div>
              <div>
                <Label>Módulo vinculado</Label>
                <Select value={editAgenda.modulo_id || "none"} onValueChange={v => setEditAgenda(p => ({ ...p, modulo_id: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {modulos.map(m => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={editAgenda.obrigatorio ?? false} onCheckedChange={v => setEditAgenda(p => ({ ...p, obrigatorio: v }))} /><Label>Obrigatório</Label></div>
          </div>
          <DialogFooter><Button onClick={saveAgenda}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SLA Dialog */}
      <Dialog open={slaDialog} onOpenChange={setSlaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editSla.id ? "Editar SLA" : "Novo SLA"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={editSla.nome || ""} onChange={e => setEditSla(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Onboarding Obrigatório" /></div>
            <div><Label>Descrição</Label><Textarea value={editSla.descricao || ""} onChange={e => setEditSla(p => ({ ...p, descricao: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Prazo (dias)</Label><Input type="number" value={editSla.prazo_dias ?? 30} onChange={e => setEditSla(p => ({ ...p, prazo_dias: Number(e.target.value) }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={editSla.tipo || "onboarding"} onValueChange={v => setEditSla(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="reciclagem">Reciclagem</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="novo_produto">Novo Produto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Penalidade</Label>
              <Select value={editSla.penalidade || "bloqueio_acesso"} onValueChange={v => setEditSla(p => ({ ...p, penalidade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloqueio_acesso">Bloqueio de acesso</SelectItem>
                  <SelectItem value="notificacao">Notificação</SelectItem>
                  <SelectItem value="suspensao_comissao">Suspensão de comissão</SelectItem>
                  <SelectItem value="desativacao">Desativação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={editSla.ativo ?? true} onCheckedChange={v => setEditSla(p => ({ ...p, ativo: v }))} /><Label>Ativo</Label></div>
          </div>
          <DialogFooter><Button onClick={saveSla}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
