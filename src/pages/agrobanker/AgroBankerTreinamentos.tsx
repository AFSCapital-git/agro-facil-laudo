import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  GraduationCap, BookOpen, ShieldCheck, Package, Target, Clock, CheckCircle2,
  Lock, Play, Star, Award, Heart, Scale, Eye, Handshake, TrendingUp, FileText, Sprout,
  Landmark, Users,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Heart, ShieldCheck, Package, Target, Scale, Eye, Handshake, TrendingUp,
  FileText, Sprout, Landmark, Users, GraduationCap, Star, Award,
};

export default function AgroBankerTreinamentos() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("todas");
  const [trilhas, setTrilhas] = useState<any[]>([]);
  const [modulos, setModulos] = useState<any[]>([]);
  const [progresso, setProgresso] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesConquistados, setBadgesConquistados] = useState<any[]>([]);
  const [agrobankerId, setAgrobankerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    // Get agrobanker_id
    const { data: abData } = await supabase.from("agrobankers").select("id").eq("user_id", user?.id || "").maybeSingle();
    const abId = abData?.id;
    setAgrobankerId(abId || null);

    const [t, m, b] = await Promise.all([
      supabase.from("treinamento_trilhas").select("*").eq("ativo", true).order("ordem"),
      supabase.from("treinamento_modulos").select("*").eq("ativo", true).order("ordem"),
      supabase.from("treinamento_badges").select("*").eq("ativo", true),
    ]);
    setTrilhas(t.data || []);
    setModulos(m.data || []);
    setBadges(b.data || []);

    if (abId) {
      const [p, bc] = await Promise.all([
        supabase.from("treinamento_progresso").select("*").eq("agrobanker_id", abId),
        supabase.from("treinamento_badges_conquistados").select("*").eq("agrobanker_id", abId),
      ]);
      setProgresso(p.data || []);
      setBadgesConquistados(bc.data || []);
    }
    setLoading(false);
  }

  async function iniciarModulo(moduloId: string) {
    if (!agrobankerId) return;
    const existing = progresso.find(p => p.modulo_id === moduloId);
    if (!existing) {
      await supabase.from("treinamento_progresso").insert({
        agrobanker_id: agrobankerId,
        modulo_id: moduloId,
        status: "em_andamento",
        data_inicio: new Date().toISOString(),
      });
      fetchData();
    }
  }

  function getModuloStatus(moduloId: string): "disponivel" | "em_andamento" | "concluido" | "bloqueado" {
    const prog = progresso.find(p => p.modulo_id === moduloId);
    if (prog) {
      if (prog.status === "concluido") return "concluido";
      if (prog.status === "em_andamento") return "em_andamento";
    }
    const mod = [...modulos, ...fallbackModulos].find(m => m.id === moduloId);
    if (mod?.pre_requisito_id) {
      const preReqProg = progresso.find(p => p.modulo_id === mod.pre_requisito_id);
      if (!preReqProg || preReqProg.status !== "concluido") return "bloqueado";
    }
    return "disponivel";
  }

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    disponivel: { label: "Disponível", variant: "outline" },
    em_andamento: { label: "Em Andamento", variant: "default" },
    concluido: { label: "Concluído", variant: "secondary" },
    bloqueado: { label: "Bloqueado", variant: "destructive" },
  };

  // Static fallback data when DB is empty
  const fallbackTrilhas = [
    { id: "t1", nome: "Cultura & Valores AFSAgro", descricao: "Conheça a missão, visão e valores da AFSAgro", icone: "Heart", cor: "#e11d48", ordem: 1, ativo: true },
    { id: "t2", nome: "Compliance & Regulação", descricao: "Normas, regulamentos e boas práticas do crédito rural", icone: "ShieldCheck", cor: "#2563eb", ordem: 2, ativo: true },
    { id: "t3", nome: "Produtos PRONAF", descricao: "Domine os produtos de financiamento PRONAF", icone: "Package", cor: "#16a34a", ordem: 3, ativo: true },
    { id: "t4", nome: "Técnicas Comerciais", descricao: "Estratégias de captação e relacionamento", icone: "TrendingUp", cor: "#f59e0b", ordem: 4, ativo: true },
  ];

  const fallbackModulos = [
    { id: "m1", trilha_id: "t1", titulo: "Quem somos: Missão e Visão AFSAgro", descricao: "Entenda a história, missão e visão da AFSAgro e como o AgroBanker se encaixa nesse ecossistema.", duracao_minutos: 20, pontos: 50, obrigatorio: true, ordem: 1, pre_requisito_id: null },
    { id: "m2", trilha_id: "t1", titulo: "Código de Conduta e Ética", descricao: "Princípios éticos e padrões de conduta esperados de todo AgroBanker parceiro.", duracao_minutos: 30, pontos: 60, obrigatorio: true, ordem: 2, pre_requisito_id: "m1" },
    { id: "m3", trilha_id: "t1", titulo: "O papel do AgroBanker na cadeia", descricao: "Como o AgroBanker conecta produtores rurais ao crédito de forma eficiente e segura.", duracao_minutos: 25, pontos: 50, obrigatorio: false, ordem: 3, pre_requisito_id: null },
    { id: "m4", trilha_id: "t2", titulo: "Regulamentação do Crédito Rural", descricao: "Panorama das normas do Banco Central e regulamentos aplicáveis ao crédito rural.", duracao_minutos: 45, pontos: 80, obrigatorio: true, ordem: 1, pre_requisito_id: null },
    { id: "m5", trilha_id: "t2", titulo: "LGPD e Proteção de Dados", descricao: "Boas práticas de proteção de dados pessoais dos produtores rurais.", duracao_minutos: 30, pontos: 60, obrigatorio: true, ordem: 2, pre_requisito_id: null },
    { id: "m6", trilha_id: "t2", titulo: "Prevenção à Lavagem de Dinheiro", descricao: "Identificação de sinais de alerta e procedimentos de compliance.", duracao_minutos: 35, pontos: 70, obrigatorio: true, ordem: 3, pre_requisito_id: "m4" },
    { id: "m7", trilha_id: "t3", titulo: "PRONAF Custeio – Visão Geral", descricao: "Entenda o funcionamento, público-alvo e limites do PRONAF Custeio.", duracao_minutos: 40, pontos: 80, obrigatorio: true, ordem: 1, pre_requisito_id: null },
    { id: "m8", trilha_id: "t3", titulo: "PRONAF Investimento", descricao: "Linhas de investimento: máquinas, infraestrutura e modernização.", duracao_minutos: 40, pontos: 80, obrigatorio: true, ordem: 2, pre_requisito_id: null },
    { id: "m9", trilha_id: "t3", titulo: "Documentação e Requisitos", descricao: "Checklist completo de documentos e requisitos para aprovação de crédito.", duracao_minutos: 35, pontos: 70, obrigatorio: false, ordem: 3, pre_requisito_id: "m7" },
    { id: "m10", trilha_id: "t4", titulo: "Prospecção de Produtores", descricao: "Técnicas para identificar e abordar potenciais produtores rurais.", duracao_minutos: 30, pontos: 60, obrigatorio: false, ordem: 1, pre_requisito_id: null },
    { id: "m11", trilha_id: "t4", titulo: "Técnicas de Negociação", descricao: "Como conduzir negociações eficazes e construir relacionamentos duradouros.", duracao_minutos: 35, pontos: 70, obrigatorio: false, ordem: 2, pre_requisito_id: "m10" },
    { id: "m12", trilha_id: "t4", titulo: "Pós-venda e Fidelização", descricao: "Estratégias para acompanhamento e retenção da carteira de produtores.", duracao_minutos: 25, pontos: 50, obrigatorio: false, ordem: 3, pre_requisito_id: null },
  ];

  const fallbackBadges = [
    { id: "b1", nome: "Embaixador AFSAgro", descricao: "Completou toda a trilha Cultura & Valores", icone: "Award", cor: "#e11d48" },
    { id: "b2", nome: "Compliance Master", descricao: "Completou toda a trilha de Compliance", icone: "ShieldCheck", cor: "#2563eb" },
    { id: "b3", nome: "Especialista PRONAF", descricao: "Completou toda a trilha de Produtos PRONAF", icone: "Star", cor: "#16a34a" },
  ];

  const displayTrilhas = trilhas.length > 0 ? trilhas : fallbackTrilhas;
  const displayModulos = modulos.length > 0 ? modulos : fallbackModulos;
  const displayBadges = badges.length > 0 ? badges : fallbackBadges;

  const completedModules = displayModulos.filter(m => getModuloStatus(m.id) === "concluido").length;
  const totalModules = displayModulos.length;
  const requiredModules = displayModulos.filter(m => m.obrigatorio);
  const requiredCompleted = requiredModules.filter(m => getModuloStatus(m.id) === "concluido").length;
  const inProgressCount = displayModulos.filter(m => getModuloStatus(m.id) === "em_andamento").length;
  const totalPontos = progresso.reduce((s, p) => s + (p.pontuacao || 0), 0);

  const filteredModulos = activeTab === "todas"
    ? displayModulos
    : displayModulos.filter(m => m.trilha_id === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal de Treinamento"
        description="Trilhas de capacitação para fortalecer sua atuação como AgroBanker"
        icon={<GraduationCap className="h-5 w-5" />}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedModules}/{totalModules}</p>
              <p className="text-xs text-muted-foreground">Módulos concluídos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <ShieldCheck className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{requiredCompleted}/{requiredModules.length}</p>
              <p className="text-xs text-muted-foreground">Obrigatórios concluídos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Play className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{inProgressCount}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{badgesConquistados.length}/{displayBadges.length}</p>
              <p className="text-xs text-muted-foreground">Certificações obtidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall progress */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Progresso Geral</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{totalPontos} pontos</Badge>
              <span className="text-sm text-muted-foreground">
                {totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}%
              </span>
            </div>
          </div>
          <Progress value={totalModules > 0 ? (completedModules / totalModules) * 100 : 0} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Complete todos os módulos obrigatórios para se tornar um AgroBanker Certificado.
          </p>
        </CardContent>
      </Card>

      {/* Tabs by trilha */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="todas" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Todas
          </TabsTrigger>
          {displayTrilhas.map(t => {
            const Icon = iconMap[t.icone] || BookOpen;
            return (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {t.nome}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModulos.map(mod => {
              const status = getModuloStatus(mod.id);
              const st = statusConfig[status];
              const trilha = displayTrilhas.find(t => t.id === mod.trilha_id);
              const Icon = iconMap[trilha?.icone] || BookOpen;

              return (
                <Card
                  key={mod.id}
                  className={`transition-all ${status === "bloqueado" ? "opacity-60" : "hover:shadow-md hover:border-primary/30"}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {mod.obrigatorio && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">Obrigatório</Badge>
                        )}
                        <Badge variant={st.variant} className="text-[10px] px-1.5">
                          {status === "bloqueado" && <Lock className="h-2.5 w-2.5 mr-0.5" />}
                          {status === "concluido" && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                          {st.label}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-sm mt-3">{mod.titulo}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{mod.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {mod.duracao_minutos} min</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {mod.pontos} pts</span>
                    </div>
                    {trilha && (
                      <Badge variant="outline" className="text-[10px]" style={{ borderColor: trilha.cor }}>{trilha.nome}</Badge>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      variant={status === "bloqueado" ? "outline" : status === "concluido" ? "secondary" : "default"}
                      disabled={status === "bloqueado"}
                      onClick={() => status === "disponivel" && iniciarModulo(mod.id)}
                    >
                      {status === "bloqueado" && <><Lock className="h-3.5 w-3.5" /> Pré-requisito pendente</>}
                      {status === "disponivel" && <><Play className="h-3.5 w-3.5" /> Iniciar módulo</>}
                      {status === "em_andamento" && <><Play className="h-3.5 w-3.5" /> Continuar</>}
                      {status === "concluido" && <><CheckCircle2 className="h-3.5 w-3.5" /> Revisar</>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            {filteredModulos.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                Nenhum módulo disponível nesta trilha.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
