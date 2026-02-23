import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Package,
  Users,
  Target,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  Star,
  Award,
  TrendingUp,
  FileText,
  Sprout,
  Landmark,
  Heart,
  Scale,
  Eye,
  Handshake,
} from "lucide-react";

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "disponivel" | "em_andamento" | "concluido" | "bloqueado";
  progress: number;
  category: string;
  badge?: string;
  required?: boolean;
}

const trainingModules: TrainingModule[] = [
  // Cultura e Valores
  {
    id: "cult-1",
    title: "Bem-vindo à AFSAgro",
    description: "Conheça nossa missão de democratizar o acesso ao crédito rural e os valores que guiam nossa atuação no agronegócio brasileiro.",
    duration: "20 min",
    icon: Heart,
    status: "disponivel",
    progress: 0,
    category: "cultura",
    badge: "Embaixador AFSAgro",
    required: true,
  },
  {
    id: "cult-2",
    title: "Código de Conduta e Ética",
    description: "Princípios éticos, relacionamento com produtores, transparência nas operações e responsabilidade social no campo.",
    duration: "30 min",
    icon: Scale,
    status: "disponivel",
    progress: 0,
    category: "cultura",
    required: true,
  },
  {
    id: "cult-3",
    title: "Visão de Mercado Agro",
    description: "Panorama do agronegócio brasileiro, Plano Safra, papel do crédito rural e oportunidades de crescimento.",
    duration: "45 min",
    icon: TrendingUp,
    status: "disponivel",
    progress: 0,
    category: "cultura",
  },
  {
    id: "cult-4",
    title: "O Papel do AgroBanker",
    description: "Como você se posiciona como assessor de crédito rural, diferencial competitivo e modelo de atendimento consultivo.",
    duration: "35 min",
    icon: Handshake,
    status: "bloqueado",
    progress: 0,
    category: "cultura",
    badge: "Assessor Certificado",
  },

  // Compliance
  {
    id: "comp-1",
    title: "LGPD no Agro",
    description: "Proteção de dados pessoais dos produtores, consentimento, armazenamento seguro e boas práticas de privacidade.",
    duration: "40 min",
    icon: ShieldCheck,
    status: "disponivel",
    progress: 0,
    category: "compliance",
    required: true,
  },
  {
    id: "comp-2",
    title: "Prevenção à Lavagem de Dinheiro",
    description: "PLD/FT aplicada ao crédito rural: identificação de operações suspeitas, KYC do produtor e obrigações regulatórias.",
    duration: "50 min",
    icon: Eye,
    status: "disponivel",
    progress: 0,
    category: "compliance",
    required: true,
  },
  {
    id: "comp-3",
    title: "Regulamentação do Crédito Rural",
    description: "Manual de Crédito Rural (MCR), resolução do Banco Central, regras PRONAF e responsabilidades dos intermediários.",
    duration: "60 min",
    icon: FileText,
    status: "bloqueado",
    progress: 0,
    category: "compliance",
    badge: "Compliance Certificado",
  },
  {
    id: "comp-4",
    title: "Conduta Anticorrupção",
    description: "Lei Anticorrupção, conflito de interesses, presentes e hospitalidade, canal de denúncias.",
    duration: "35 min",
    icon: Scale,
    status: "bloqueado",
    progress: 0,
    category: "compliance",
  },

  // Produtos
  {
    id: "prod-1",
    title: "PRONAF Custeio — Guia Completo",
    description: "Regras, limites, juros, prazos, documentação exigida e processo de solicitação para linhas de custeio PRONAF.",
    duration: "55 min",
    icon: Sprout,
    status: "disponivel",
    progress: 0,
    category: "produtos",
    required: true,
  },
  {
    id: "prod-2",
    title: "PRONAF Investimento — Guia Completo",
    description: "Máquinas, equipamentos, infraestrutura: como orientar o produtor nas linhas de investimento do PRONAF.",
    duration: "50 min",
    icon: Package,
    status: "disponivel",
    progress: 0,
    category: "produtos",
  },
  {
    id: "prod-3",
    title: "Análise de Viabilidade Econômica",
    description: "Como avaliar a capacidade de pagamento do produtor, orçamento de custeio e indicadores financeiros rurais.",
    duration: "45 min",
    icon: TrendingUp,
    status: "bloqueado",
    progress: 0,
    category: "produtos",
    badge: "Analista de Crédito",
  },
  {
    id: "prod-4",
    title: "Documentação e Laudos Técnicos",
    description: "Entenda o fluxo completo do laudo agronômico, documentos necessários (CAR, CCIR, ITR) e como acelerar o processo.",
    duration: "40 min",
    icon: FileText,
    status: "disponivel",
    progress: 0,
    category: "produtos",
  },

  // Comercial
  {
    id: "com-1",
    title: "Técnicas de Prospecção no Agro",
    description: "Como identificar e abordar produtores rurais, construir rede de contatos e gerar leads qualificados no campo.",
    duration: "40 min",
    icon: Target,
    status: "disponivel",
    progress: 0,
    category: "comercial",
  },
  {
    id: "com-2",
    title: "Venda Consultiva de Crédito",
    description: "Diagnóstico das necessidades do produtor, apresentação de soluções personalizadas e fechamento de operações.",
    duration: "50 min",
    icon: Users,
    status: "disponivel",
    progress: 0,
    category: "comercial",
    badge: "Consultor Sênior",
  },
  {
    id: "com-3",
    title: "Gestão de Carteira",
    description: "Como organizar sua carteira de produtores, acompanhar safras, identificar cross-sell e garantir recorrência.",
    duration: "35 min",
    icon: Landmark,
    status: "bloqueado",
    progress: 0,
    category: "comercial",
  },
  {
    id: "com-4",
    title: "Uso da Plataforma AgroLaudo",
    description: "Tutorial completo da plataforma: cadastro de produtores, originação de solicitações, acompanhamento e comissões.",
    duration: "30 min",
    icon: BookOpen,
    status: "disponivel",
    progress: 0,
    category: "comercial",
    required: true,
  },
];

const categoryConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  cultura: { label: "Cultura & Valores", icon: Heart, color: "hsl(var(--primary))" },
  compliance: { label: "Compliance", icon: ShieldCheck, color: "hsl(35, 65%, 50%)" },
  produtos: { label: "Produtos", icon: Package, color: "hsl(145, 45%, 40%)" },
  comercial: { label: "Comercial", icon: Target, color: "hsl(210, 60%, 50%)" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  disponivel: { label: "Disponível", variant: "outline" },
  em_andamento: { label: "Em Andamento", variant: "default" },
  concluido: { label: "Concluído", variant: "secondary" },
  bloqueado: { label: "Bloqueado", variant: "destructive" },
};

export default function AgroBankerTreinamentos() {
  const [activeTab, setActiveTab] = useState("todas");

  const totalModules = trainingModules.length;
  const completedModules = trainingModules.filter((m) => m.status === "concluido").length;
  const requiredModules = trainingModules.filter((m) => m.required);
  const requiredCompleted = requiredModules.filter((m) => m.status === "concluido").length;
  const inProgress = trainingModules.filter((m) => m.status === "em_andamento").length;
  const badges = trainingModules.filter((m) => m.badge && m.status === "concluido").length;
  const totalBadges = trainingModules.filter((m) => m.badge).length;

  const filtered = activeTab === "todas"
    ? trainingModules
    : trainingModules.filter((m) => m.category === activeTab);

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
              <p className="text-2xl font-bold">{inProgress}</p>
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
              <p className="text-2xl font-bold">{badges}/{totalBadges}</p>
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
            <span className="text-sm text-muted-foreground">
              {Math.round((completedModules / totalModules) * 100)}%
            </span>
          </div>
          <Progress value={(completedModules / totalModules) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Complete todos os módulos obrigatórios para se tornar um AgroBanker Certificado.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="todas" className="gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> Todas
          </TabsTrigger>
          {Object.entries(categoryConfig).map(([key, cat]) => (
            <TabsTrigger key={key} value={key} className="gap-1.5">
              <cat.icon className="h-3.5 w-3.5" /> {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mod) => {
              const st = statusConfig[mod.status];
              const cat = categoryConfig[mod.category];
              return (
                <Card
                  key={mod.id}
                  className={`transition-all ${mod.status === "bloqueado" ? "opacity-60" : "hover:shadow-md hover:border-primary/30"}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <mod.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {mod.required && (
                          <Badge variant="destructive" className="text-[10px] px-1.5">
                            Obrigatório
                          </Badge>
                        )}
                        <Badge variant={st.variant} className="text-[10px] px-1.5">
                          {mod.status === "bloqueado" && <Lock className="h-2.5 w-2.5 mr-0.5" />}
                          {mod.status === "concluido" && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                          {st.label}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-sm mt-3">{mod.title}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {mod.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {mod.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <cat.icon className="h-3 w-3" /> {cat.label}
                      </span>
                    </div>
                    {mod.status === "em_andamento" && (
                      <Progress value={mod.progress} className="h-1.5" />
                    )}
                    {mod.badge && (
                      <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 rounded-md px-2 py-1">
                        <Award className="h-3 w-3" />
                        <span>Certificação: <strong>{mod.badge}</strong></span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      variant={mod.status === "bloqueado" ? "outline" : mod.status === "concluido" ? "secondary" : "default"}
                      disabled={mod.status === "bloqueado"}
                    >
                      {mod.status === "bloqueado" && <><Lock className="h-3.5 w-3.5" /> Pré-requisito pendente</>}
                      {mod.status === "disponivel" && <><Play className="h-3.5 w-3.5" /> Iniciar módulo</>}
                      {mod.status === "em_andamento" && <><Play className="h-3.5 w-3.5" /> Continuar</>}
                      {mod.status === "concluido" && <><CheckCircle2 className="h-3.5 w-3.5" /> Revisar</>}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
