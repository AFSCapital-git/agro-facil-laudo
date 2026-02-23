import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Leaf, Target, TrendingUp, Users, Shield, Layers, BarChart3, Rocket, DollarSign, CheckCircle2, ArrowRight, Globe, Smartphone, FileText, Building2, UserCheck, Clock, Zap, Lock, Sprout, Wrench, Landmark, Download, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const TOTAL_SLIDES = 12;

export default function Pitch() {
  const [current, setCurrent] = useState(0);
  const [generating, setGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const generatePDF = useCallback(async () => {
    if (!containerRef.current || generating) return;
    setGenerating(true);
    const savedCurrent = current;
    
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });
      
      for (let i = 0; i < TOTAL_SLIDES; i++) {
        setCurrent(i);
        await new Promise(r => setTimeout(r, 600));
        
        const slideEl = containerRef.current.querySelector(`[data-slide="${i}"]`) as HTMLElement;
        if (!slideEl) continue;
        
        const canvas = await html2canvas(slideEl, {
          backgroundColor: "#1a2a1a",
          scale: 2,
          useCORS: true,
          width: 1280,
          height: 720,
        });
        
        if (i > 0) pdf.addPage([1280, 720], "landscape");
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1280, 720);
      }
      
      pdf.save("AgroLaudo-PitchDeck.pdf");
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setCurrent(savedCurrent);
      setGenerating(false);
    }
  }, [current, generating]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[hsl(150,20%,8%)] text-[hsl(40,30%,92%)] select-none print:overflow-visible print:h-auto">
      {/* PDF/Print buttons */}
      <div className="fixed top-6 left-8 flex gap-2 z-50 print:hidden">
        <button
          onClick={generatePDF}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(80,55%,55%)]/20 border border-[hsl(80,55%,55%)]/30 text-[hsl(80,55%,55%)] text-sm font-medium hover:bg-[hsl(80,55%,55%)]/30 transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {generating ? "Gerando..." : "Baixar PDF"}
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/20 transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Slide container */}
      <div ref={containerRef} className="relative h-full w-full">
        <SlideWrapper active={current === 0} index={0}><SlideCover /></SlideWrapper>
        <SlideWrapper active={current === 1} index={1}><SlideProblema /></SlideWrapper>
        <SlideWrapper active={current === 2} index={2}><SlideSolucao /></SlideWrapper>
        <SlideWrapper active={current === 3} index={3}><SlideComoFunciona /></SlideWrapper>
        <SlideWrapper active={current === 4} index={4}><SlideFluxoProdutorEngenheiro /></SlideWrapper>
        <SlideWrapper active={current === 5} index={5}><SlideFluxoMesaBancoAdmin /></SlideWrapper>
        <SlideWrapper active={current === 6} index={6}><SlidePlataforma /></SlideWrapper>
        <SlideWrapper active={current === 7} index={7}><SlideMercado /></SlideWrapper>
        <SlideWrapper active={current === 8} index={8}><SlideModelo /></SlideWrapper>
        <SlideWrapper active={current === 9} index={9}><SlideDiferenciais /></SlideWrapper>
        <SlideWrapper active={current === 10} index={10}><SlideRoadmap /></SlideWrapper>
        <SlideWrapper active={current === 11} index={11}><SlideCTA /></SlideWrapper>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 print:hidden">
        <button onClick={prev} disabled={current === 0} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={cn("w-2 h-2 rounded-full transition-all", i === current ? "bg-[hsl(80,55%,55%)] w-6" : "bg-white/30 hover:bg-white/50")} />
          ))}
        </div>
        <button onClick={next} disabled={current === TOTAL_SLIDES - 1} className="p-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide counter */}
      <div className="fixed top-6 right-8 text-sm text-white/40 z-50 font-mono print:hidden">
        {String(current + 1).padStart(2, "0")} / {TOTAL_SLIDES}
      </div>
    </div>
  );
}

function SlideWrapper({ active, index, children }: { active: boolean; index: number; children: React.ReactNode }) {
  return (
    <div data-slide={index} className={cn(
      "absolute inset-0 flex items-center justify-center transition-all duration-500",
      "print:relative print:opacity-100 print:scale-100 print:pointer-events-auto print:break-after-page print:h-screen",
      active ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
    )}>
      <div className="w-full max-w-6xl mx-auto px-8 md:px-16">{children}</div>
    </div>
  );
}

/* ───────── SLIDES ───────── */

function SlideCover() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[hsl(80,55%,55%)]/30 bg-[hsl(80,55%,55%)]/10 text-[hsl(80,55%,55%)] text-sm font-medium">
        <Leaf className="w-4 h-4" /> Pitch Deck — Fevereiro 2026
      </div>
      <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight font-['Sora']">
        Agro<span className="text-[hsl(80,55%,55%)]">Laudo</span>
      </h1>
      <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto leading-relaxed">
        O marketplace que conecta produtores rurais a engenheiros agrônomos para emissão de laudos de viabilidade no <strong className="text-white/80">Plano Safra</strong>.
      </p>
      <div className="flex items-center justify-center gap-6 pt-4 text-sm text-white/40">
        <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> SaaS B2B2C</span>
        <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Mobile-first</span>
        <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Crédito Rural</span>
      </div>
    </div>
  );
}

function SlideProblema() {
  const problems = [
    { icon: Clock, title: "Processo lento e burocrático", desc: "Produtores perdem semanas buscando engenheiros disponíveis para emitir laudos técnicos exigidos pelos bancos." },
    { icon: Users, title: "Falta de acesso em regiões remotas", desc: "Microprodutores em áreas rurais não encontram profissionais credenciados próximos, inviabilizando o acesso ao crédito." },
    { icon: FileText, title: "Documentação fragmentada", desc: "Laudos, documentos PRONAF e orçamentos circulam por WhatsApp e e-mail, sem rastreabilidade ou padronização." },
    { icon: Building2, title: "Bancos sem visibilidade", desc: "Instituições financeiras não têm acesso em tempo real ao status das solicitações, gerando retrabalho e atrasos." },
  ];
  return (
    <div className="space-y-10">
      <SectionLabel icon={Target}>O Problema</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora'] leading-tight">
        O acesso ao <span className="text-[hsl(35,65%,50%)]">crédito rural</span> é travado pela burocracia dos laudos
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {problems.map((p, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
            <p.icon className="w-6 h-6 text-[hsl(35,65%,50%)] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">{p.title}</h3>
              <p className="text-sm text-white/50 mt-1">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideSolucao() {
  return (
    <div className="space-y-10">
      <SectionLabel icon={Zap}>A Solução</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora'] leading-tight">
        Uma plataforma <span className="text-[hsl(80,55%,55%)]">completa</span> que digitaliza todo o fluxo de laudos agronômicos
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { emoji: "🌾", title: "Para o Produtor", items: ["Cadastro de propriedades com CAR/CCIR", "Solicitação em poucos cliques", "Acompanhamento em tempo real", "Download do PDF do laudo"] },
          { emoji: "👷", title: "Para o Engenheiro", items: ["Demandas geolocalizadas", "Checklist guiado de vistoria", "Assinatura digital integrada", "Pagamentos rastreáveis"] },
          { emoji: "🏦", title: "Para o Banco", items: ["Dashboard dedicado por parceiro", "Documentação centralizada", "Workflow de aprovação/devolução", "Chat direto com a mesa"] },
        ].map((col, i) => (
          <div key={i} className="p-6 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="text-3xl">{col.emoji}</div>
            <h3 className="text-xl font-bold">{col.title}</h3>
            <ul className="space-y-2">
              {col.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideComoFunciona() {
  const steps = [
    { n: "01", title: "Produtor solicita", desc: "Cadastra propriedade, seleciona produto PRONAF e banco destino" },
    { n: "02", title: "Mesa de Produtos tria", desc: "Valida documentos, atribui engenheiro da região e habilita uploads" },
    { n: "03", title: "Engenheiro vistoria", desc: "Realiza inspeção in loco com checklist guiado e upload de fotos geolocalizadas" },
    { n: "04", title: "Laudo é assinado", desc: "Assinatura digital com hash, geração de PDF padronizado" },
    { n: "05", title: "Envio ao banco", desc: "Mesa envia pacote completo ao banco parceiro com toda documentação" },
    { n: "06", title: "Crédito liberado", desc: "Banco aprova, produtor recebe o crédito, engenheiro recebe pagamento" },
  ];
  return (
    <div className="space-y-10">
      <SectionLabel icon={Layers}>Como Funciona</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">Fluxo completo em <span className="text-[hsl(80,55%,55%)]">6 etapas</span></h2>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((s, i) => (
          <div key={i} className="relative p-5 rounded-xl bg-white/5 border border-white/10 group hover:border-[hsl(80,55%,55%)]/40 transition">
            <span className="text-4xl font-extrabold text-[hsl(80,55%,55%)]/20 absolute top-3 right-4 font-['Sora']">{s.n}</span>
            <h3 className="font-bold text-lg mt-1">{s.title}</h3>
            <p className="text-sm text-white/50 mt-2">{s.desc}</p>
            {i < steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 z-10" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideFluxoProdutorEngenheiro() {
  const produtorModules = [
    { modulo: "Cadastro", funcionalidade: "Propriedades com CAR, CCIR, ITR, matrícula e geolocalização", status: "✅" },
    { modulo: "Solicitação", funcionalidade: "Formulário dinâmico com regras por produto PRONAF e região", status: "✅" },
    { modulo: "Documentos", funcionalidade: "Upload com checklist obrigatório por produto, validação e status", status: "✅" },
    { modulo: "Orçamento", funcionalidade: "Orçamento de custeio por categorias (insumos, mão-de-obra, etc.)", status: "✅" },
    { modulo: "Acompanhamento", funcionalidade: "Timeline de status em tempo real com notificações push", status: "✅" },
    { modulo: "Laudo PDF", funcionalidade: "Download do laudo finalizado com assinatura digital", status: "✅" },
  ];
  const engenheiroModules = [
    { modulo: "Demandas", funcionalidade: "Listagem de solicitações atribuídas com filtros por status", status: "✅" },
    { modulo: "Vistoria", funcionalidade: "Checklist técnico com campos de solo, cultura, risco e ZARC", status: "✅" },
    { modulo: "Fotos geoloc.", funcionalidade: "Upload de mídias com latitude, longitude e timestamp", status: "✅" },
    { modulo: "Relatório", funcionalidade: "Formulário completo de laudo com parecer e recomendações", status: "✅" },
    { modulo: "Assinatura", funcionalidade: "Assinatura digital com hash SHA-256 e registro de IP", status: "✅" },
    { modulo: "Pagamentos", funcionalidade: "Visualização de pagamentos pendentes e histórico", status: "✅" },
  ];
  return (
    <div className="space-y-8">
      <SectionLabel icon={Sprout}>O que foi construído</SectionLabel>
      <h2 className="text-3xl md:text-4xl font-bold font-['Sora']">Funcionalidades por perfil — <span className="text-[hsl(80,55%,55%)]">Produtor & Engenheiro</span></h2>
      <div className="grid md:grid-cols-2 gap-6">
        <ProfileTable icon={Sprout} title="🌾 Produtor Rural" rows={produtorModules} />
        <ProfileTable icon={Wrench} title="👷 Engenheiro Agrônomo" rows={engenheiroModules} />
      </div>
    </div>
  );
}

function SlideFluxoMesaBancoAdmin() {
  const mesaModules = [
    { modulo: "Triagem", funcionalidade: "Análise, aprovação e atribuição de engenheiros por região", status: "✅" },
    { modulo: "Documentos", funcionalidade: "Habilitação, validação e devolução de docs por solicitação", status: "✅" },
    { modulo: "Envio Banco", funcionalidade: "Empacotamento e envio do dossiê completo ao banco parceiro", status: "✅" },
    { modulo: "Produtos", funcionalidade: "Gestão de regras regionais e produtos PRONAF dinâmicos", status: "✅" },
    { modulo: "Chat", funcionalidade: "Comunicação interna com produtor, engenheiro e banco", status: "✅" },
  ];
  const bancoModules = [
    { modulo: "Dashboard", funcionalidade: "Visão das solicitações vinculadas ao banco parceiro", status: "✅" },
    { modulo: "Aprovação", funcionalidade: "Workflow de aprovação/devolução com observações", status: "✅" },
    { modulo: "Documentação", funcionalidade: "Acesso centralizado a todos os documentos e laudos", status: "✅" },
    { modulo: "Chat", funcionalidade: "Canal direto com a mesa de produtos", status: "✅" },
  ];
  const adminModules = [
    { modulo: "Esteira", funcionalidade: "Pipeline visual com métricas de SLA e desempenho por equipe", status: "✅" },
    { modulo: "Usuários", funcionalidade: "Gestão multi-role com 5 perfis e permissões RLS", status: "✅" },
    { modulo: "PRONAF", funcionalidade: "Produtos, documentos exigidos e regras regionais configuráveis", status: "✅" },
    { modulo: "Financeiro", funcionalidade: "Pagamentos, taxas e configurações de valores por produto", status: "✅" },
    { modulo: "Auditoria", funcionalidade: "Log completo de ações com IP, user-agent e timestamp", status: "✅" },
    { modulo: "ZARC / Regiões", funcionalidade: "Regras agronômicas e mapeamento regional de engenheiros", status: "✅" },
  ];
  return (
    <div className="space-y-8">
      <SectionLabel icon={Layers}>O que foi construído</SectionLabel>
      <h2 className="text-3xl md:text-4xl font-bold font-['Sora']">Funcionalidades — <span className="text-[hsl(80,55%,55%)]">Mesa, Banco & Admin</span></h2>
      <div className="grid md:grid-cols-3 gap-5">
        <ProfileTable icon={Users} title="📋 Mesa de Produtos" rows={mesaModules} />
        <ProfileTable icon={Landmark} title="🏦 Banco Parceiro" rows={bancoModules} />
        <ProfileTable icon={Shield} title="⚙️ Administrador" rows={adminModules} />
      </div>
    </div>
  );
}

function ProfileTable({ icon: Icon, title, rows }: { icon: React.ComponentType<{ className?: string }>; title: string; rows: { modulo: string; funcionalidade: string; status: string }[] }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[hsl(80,55%,55%)]" />
        <span className="font-bold text-sm">{title}</span>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
            <span className="text-[hsl(80,55%,55%)] shrink-0 mt-0.5">{r.status}</span>
            <div>
              <span className="font-semibold text-white/80">{r.modulo}</span>
              <span className="text-white/40 ml-1.5">— {r.funcionalidade}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlidePlataforma() {
  const features = [
    { icon: Users, label: "5 perfis de acesso", desc: "Produtor, Engenheiro, Mesa, Banco e Admin" },
    { icon: Shield, label: "RLS row-level security", desc: "Cada dado só é visível para quem tem permissão" },
    { icon: FileText, label: "Documentos PRONAF", desc: "Regras dinâmicas por produto e região" },
    { icon: Zap, label: "Notificações em tempo real", desc: "Push interno em cada mudança de status" },
    { icon: BarChart3, label: "Dashboard analítico", desc: "Métricas de SLA, pagamentos e produtividade" },
    { icon: Lock, label: "Auditoria completa", desc: "Log de todas as ações com IP e timestamp" },
  ];
  return (
    <div className="space-y-10">
      <SectionLabel icon={Layers}>Plataforma</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">Construída para <span className="text-[hsl(80,55%,55%)]">escala</span> e <span className="text-[hsl(80,55%,55%)]">segurança</span></h2>
      <div className="grid md:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
            <f.icon className="w-5 h-5 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">{f.label}</h3>
              <p className="text-sm text-white/50 mt-1">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideMercado() {
  return (
    <div className="space-y-10">
      <SectionLabel icon={TrendingUp}>Mercado</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">O agronegócio brasileiro é o <span className="text-[hsl(80,55%,55%)]">maior do mundo</span></h2>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { value: "R$ 400 bi+", label: "Plano Safra 2025/26", sub: "Valor total de crédito disponível" },
          { value: "4,5M+", label: "Produtores rurais", sub: "Potenciais usuários da plataforma" },
          { value: "70%+", label: "Exigem laudo técnico", sub: "Das linhas de crédito rural" },
        ].map((m, i) => (
          <div key={i} className="text-center p-8 rounded-2xl bg-gradient-to-b from-[hsl(80,55%,55%)]/10 to-transparent border border-[hsl(80,55%,55%)]/20">
            <div className="text-4xl md:text-5xl font-extrabold text-[hsl(80,55%,55%)] font-['Sora']">{m.value}</div>
            <div className="text-lg font-semibold mt-3">{m.label}</div>
            <div className="text-sm text-white/40 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
      <p className="text-center text-white/40 text-sm">Fonte: Ministério da Agricultura / BCB — Plano Safra 2025/2026</p>
    </div>
  );
}

function SlideModelo() {
  return (
    <div className="space-y-10">
      <SectionLabel icon={DollarSign}>Modelo de Negócio</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">Receita por <span className="text-[hsl(80,55%,55%)]">transação</span></h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-6">
          <h3 className="text-2xl font-bold">Fontes de receita</h3>
          <ul className="space-y-4">
            {[
              { label: "Taxa por laudo emitido", desc: "Valor fixo ou percentual configurável por produto PRONAF" },
              { label: "Taxa de plataforma", desc: "Percentual sobre o valor do serviço (configurável pelo admin)" },
              { label: "Planos para bancos parceiros", desc: "Acesso ao dashboard dedicado e fluxo de aprovação" },
              { label: "Assistência técnica", desc: "Engenheiro projetista auxilia produtores na montagem de documentação" },
            ].map((r, i) => (
              <li key={i} className="flex gap-3">
                <DollarSign className="w-5 h-5 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
                <div><span className="font-semibold">{r.label}</span><p className="text-sm text-white/50">{r.desc}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[hsl(80,55%,55%)]/15 to-[hsl(145,45%,28%)]/15 border border-[hsl(80,55%,55%)]/20 space-y-6">
          <h3 className="text-2xl font-bold">Unit economics (projeção)</h3>
          <div className="space-y-4">
            {[
              { label: "Ticket médio por laudo", value: "R$ 500 – R$ 1.500" },
              { label: "Take rate da plataforma", value: "10% – 20%" },
              { label: "CAC estimado", value: "< R$ 50" },
              { label: "LTV projetado", value: "> R$ 2.000/ano" },
            ].map((u, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-white/60">{u.label}</span>
                <span className="font-bold text-[hsl(80,55%,55%)]">{u.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideDiferenciais() {
  const diffs = [
    { icon: Layers, title: "Plataforma end-to-end", desc: "Do cadastro da propriedade à liberação do crédito pelo banco, tudo em um só lugar." },
    { icon: Shield, title: "Segurança enterprise", desc: "RLS por perfil, auditoria completa, assinatura digital com hash e rastreabilidade total." },
    { icon: UserCheck, title: "Gestão multi-role", desc: "5 perfis especializados com dashboards e permissões dedicadas para cada ator do ecossistema." },
    { icon: Zap, title: "Regras dinâmicas", desc: "Produtos PRONAF, regras regionais e ZARC configuráveis pelo admin sem necessidade de código." },
  ];
  return (
    <div className="space-y-10">
      <SectionLabel icon={Shield}>Diferenciais</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">Por que o <span className="text-[hsl(80,55%,55%)]">AgroLaudo</span>?</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {diffs.map((d, i) => (
          <div key={i} className="flex gap-5 p-6 rounded-xl bg-white/5 border border-white/10 hover:border-[hsl(80,55%,55%)]/30 transition">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[hsl(80,55%,55%)]/15 shrink-0">
              <d.icon className="w-6 h-6 text-[hsl(80,55%,55%)]" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{d.title}</h3>
              <p className="text-sm text-white/50 mt-2">{d.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideRoadmap() {
  const phases = [
    { q: "Q1 2026", status: "done", items: ["MVP completo com 5 perfis", "Fluxo produtor → engenheiro → banco", "Geração de PDF e assinatura digital", "Chat interno e notificações"] },
    { q: "Q2 2026", status: "active", items: ["App mobile nativo (PWA)", "Integração ICP-Brasil", "API aberta para bancos", "Onboarding de 3 bancos piloto"] },
    { q: "Q3 2026", status: "pending", items: ["IA para análise de risco", "Scoring automático de laudos", "Expansão para 5 estados", "Meta: 500 laudos/mês"] },
    { q: "Q4 2026", status: "pending", items: ["Marketplace de serviços agrícolas", "Integração com CAR e SICOR", "Cobertura nacional", "Meta: 2.000 laudos/mês"] },
  ];
  return (
    <div className="space-y-10">
      <SectionLabel icon={Rocket}>Roadmap</SectionLabel>
      <h2 className="text-4xl md:text-5xl font-bold font-['Sora']">Visão de <span className="text-[hsl(80,55%,55%)]">crescimento</span></h2>
      <div className="grid md:grid-cols-4 gap-5">
        {phases.map((p, i) => (
          <div key={i} className={cn("p-5 rounded-xl border space-y-4 transition",
            p.status === "done" ? "bg-[hsl(80,55%,55%)]/10 border-[hsl(80,55%,55%)]/30" :
            p.status === "active" ? "bg-[hsl(35,65%,50%)]/10 border-[hsl(35,65%,50%)]/30" :
            "bg-white/5 border-white/10"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full",
                p.status === "done" ? "bg-[hsl(80,55%,55%)]/20 text-[hsl(80,55%,55%)]" :
                p.status === "active" ? "bg-[hsl(35,65%,50%)]/20 text-[hsl(35,65%,50%)]" :
                "bg-white/10 text-white/50"
              )}>
                {p.q}
              </span>
              {p.status === "done" && <CheckCircle2 className="w-4 h-4 text-[hsl(80,55%,55%)]" />}
            </div>
            <ul className="space-y-2">
              {p.items.map((item, j) => (
                <li key={j} className="text-sm text-white/60 flex items-start gap-2">
                  <span className="text-white/20 mt-1">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideCTA() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[hsl(80,55%,55%)]/30 bg-[hsl(80,55%,55%)]/10 text-[hsl(80,55%,55%)] text-sm font-medium">
        <Rocket className="w-4 h-4" /> Junte-se a nós
      </div>
      <h2 className="text-5xl md:text-7xl font-extrabold font-['Sora'] leading-tight">
        Vamos transformar o<br /><span className="text-[hsl(80,55%,55%)]">crédito rural</span> juntos
      </h2>
      <p className="text-xl text-white/50 max-w-xl mx-auto">
        A plataforma está pronta. O mercado é imenso. Precisamos de parceiros para escalar.
      </p>
      <div className="flex items-center justify-center gap-8 pt-6 text-white/40">
        <div className="text-center">
          <div className="text-2xl font-bold text-white/80">MVP</div>
          <div className="text-xs">Funcional</div>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white/80">5 perfis</div>
          <div className="text-xs">Implementados</div>
        </div>
        <div className="w-px h-10 bg-white/20" />
        <div className="text-center">
          <div className="text-2xl font-bold text-white/80">R$ 400bi+</div>
          <div className="text-xs">TAM</div>
        </div>
      </div>
      <p className="text-sm text-white/30 pt-8">contato@agrolaudo.com.br</p>
    </div>
  );
}

/* ─── Helpers ─── */
function SectionLabel({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(80,55%,55%)]">
      <Icon className="w-4 h-4" />
      {children}
    </div>
  );
}
