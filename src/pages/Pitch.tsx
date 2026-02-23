import { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Leaf, Target, TrendingUp, Users, Shield, Layers,
  BarChart3, Rocket, DollarSign, CheckCircle2, ArrowRight, Globe, Smartphone,
  FileText, Building2, UserCheck, Clock, Zap, Lock, Sprout, Wrench, Landmark,
  Download, Printer, Briefcase, Network, MapPin, Package, GraduationCap,
  CircleDollarSign, ChevronDown, Star, Handshake, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const TOTAL_SLIDES = 10;

const green = "hsl(80,55%,55%)";
const amber = "hsl(35,65%,50%)";
const darkBg = "hsl(150,20%,8%)";

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
        const canvas = await html2canvas(slideEl, { backgroundColor: "#1a2a1a", scale: 2, useCORS: true, width: 1280, height: 720 });
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

  const slides = [
    <SlideCover />,
    <SlideProblema />,
    <SlideSolucao />,
    <SlideProduto />,
    <SlideComoFunciona />,
    <SlideMercado />,
    <SlideModelo />,
    <SlideTracao />,
    <SlideDiferenciais />,
    <SlideCTA />,
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[hsl(150,20%,8%)] text-[hsl(40,30%,92%)] select-none print:overflow-visible print:h-auto">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-8 z-50 print:hidden bg-gradient-to-b from-[hsl(150,20%,6%)] to-transparent">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-[hsl(80,55%,55%)]" />
          <span className="font-['Sora'] font-bold text-sm tracking-wide">AgroLaudo</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            disabled={generating}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(80,55%,55%)]/15 border border-[hsl(80,55%,55%)]/25 text-[hsl(80,55%,55%)] text-xs font-medium hover:bg-[hsl(80,55%,55%)]/25 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {generating ? "Gerando..." : "PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/15 text-white/60 text-xs font-medium hover:bg-white/15 transition"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Slides */}
      <div ref={containerRef} className="relative h-full w-full">
        {slides.map((slide, i) => (
          <SlideWrapper key={i} active={current === i} index={i}>{slide}</SlideWrapper>
        ))}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 print:hidden">
        <button onClick={prev} disabled={current === 0} className="p-2 rounded-full bg-white/8 hover:bg-white/15 disabled:opacity-20 transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "bg-[hsl(80,55%,55%)] w-8" : "bg-white/20 hover:bg-white/40 w-1.5"
              )}
            />
          ))}
        </div>
        <button onClick={next} disabled={current === TOTAL_SLIDES - 1} className="p-2 rounded-full bg-white/8 hover:bg-white/15 disabled:opacity-20 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Counter */}
      <div className="fixed bottom-5 right-8 text-xs text-white/30 z-50 font-mono print:hidden">
        {String(current + 1).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
      </div>
    </div>
  );
}

/* ─── Layout ─── */

function SlideWrapper({ active, index, children }: { active: boolean; index: number; children: React.ReactNode }) {
  return (
    <div data-slide={index} className={cn(
      "absolute inset-0 flex items-center justify-center transition-all duration-500",
      "print:relative print:opacity-100 print:scale-100 print:pointer-events-auto print:break-after-page print:h-screen",
      active ? "opacity-100 scale-100" : "opacity-0 scale-[0.97] pointer-events-none"
    )}>
      <div className="w-full max-w-6xl mx-auto px-8 md:px-16">{children}</div>
    </div>
  );
}

function Tag({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[hsl(80,55%,55%)] mb-6">
      <Icon className="w-3.5 h-3.5" />
      {children}
    </div>
  );
}

function Metric({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="text-center p-6 rounded-2xl bg-gradient-to-b from-[hsl(80,55%,55%)]/8 to-transparent border border-[hsl(80,55%,55%)]/15">
      <div className="text-3xl md:text-4xl font-extrabold text-[hsl(80,55%,55%)] font-['Sora']">{value}</div>
      <div className="text-sm font-semibold mt-2">{label}</div>
      {sub && <div className="text-xs text-white/35 mt-1">{sub}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 1 — COVER
   ═══════════════════════════════════════════════════════════════════ */

function SlideCover() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(80,55%,55%)]/25 bg-[hsl(80,55%,55%)]/8 text-[hsl(80,55%,55%)] text-xs font-medium tracking-wide">
        <Leaf className="w-3.5 h-3.5" /> PITCH DECK · FEVEREIRO 2026
      </div>

      <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight font-['Sora'] leading-none">
        Agro<span className="text-[hsl(80,55%,55%)]">Laudo</span>
      </h1>

      <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
        A infraestrutura digital que <strong className="text-white/80">desburocratiza o crédito rural</strong> conectando produtores, engenheiros agrônomos, bancos e parceiros em uma plataforma única.
      </p>

      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
        {[
          { icon: Globe, label: "SaaS B2B2C" },
          { icon: Briefcase, label: "Canal AgroBanker" },
          { icon: Smartphone, label: "Mobile-first" },
          { icon: FileText, label: "Crédito Rural" },
        ].map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 text-white/35 text-xs">
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-white/20 pt-6">
        Big Idea: <em className="text-white/40">"Uber dos laudos agronômicos" — transformamos semanas de burocracia em dias, com rastreabilidade total.</em>
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 2 — PROBLEMA
   ═══════════════════════════════════════════════════════════════════ */

function SlideProblema() {
  const pains = [
    { icon: Clock, title: "Semanas de espera", desc: "Produtores perdem até 45 dias buscando engenheiros credenciados para emitir um único laudo técnico.", stat: "45 dias" },
    { icon: MapPin, title: "Deserto de profissionais", desc: "Em municípios com menos de 30 mil habitantes, a densidade de engenheiros agrônomos é próxima de zero.", stat: "72% rural" },
    { icon: FileText, title: "Papelada analógica", desc: "Laudos, orçamentos e documentos PRONAF circulam por WhatsApp sem padrão, rastreio ou validade jurídica.", stat: "0% digital" },
    { icon: Building2, title: "Bancos no escuro", desc: "Instituições financeiras não têm visibilidade em tempo real do status das solicitações, gerando retrabalho.", stat: "3x retrabalho" },
  ];

  return (
    <div className="space-y-8">
      <Tag icon={Target}>O Problema</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora'] leading-tight max-w-4xl">
        R$ 400 bilhões em crédito rural disponíveis.<br />
        <span className="text-[hsl(35,65%,50%)]">Milhões de produtores não conseguem acessar.</span>
      </h2>
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        {pains.map((p, i) => (
          <div key={i} className="flex gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[hsl(35,65%,50%)]/30 transition group">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(35,65%,50%)]/15">
                <p.icon className="w-5 h-5 text-[hsl(35,65%,50%)]" />
              </div>
              <span className="text-[10px] font-bold text-[hsl(35,65%,50%)] mt-1">{p.stat}</span>
            </div>
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-sm text-white/40 mt-1 leading-relaxed">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 3 — SOLUÇÃO
   ═══════════════════════════════════════════════════════════════════ */

function SlideSolucao() {
  const pillars = [
    { emoji: "🌾", role: "Produtor", items: ["Cadastro de propriedades (CAR, CCIR, ITR)", "Solicitação em poucos cliques", "Documentação digital com checklist", "Acompanhamento em tempo real"] },
    { emoji: "👷", role: "Engenheiro", items: ["Demandas por região e especialidade", "Checklist guiado de vistoria in loco", "Fotos geolocalizadas + assinatura digital", "Pagamentos rastreáveis"] },
    { emoji: "🏦", role: "Banco", items: ["Dashboard dedicado por parceiro", "Dossiê completo digitalizado", "Workflow de aprovação/devolução", "Chat direto com a mesa"] },
    { emoji: "🤝", role: "AgroBanker", items: ["Carteira própria de produtores", "Catálogo de produtos habilitados", "Originação de crédito end-to-end", "Comissões automáticas"] },
  ];

  return (
    <div className="space-y-8">
      <Tag icon={Zap}>A Solução</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora'] leading-tight">
        Uma plataforma, <span className="text-[hsl(80,55%,55%)]">6 perfis especializados</span>,<br />todo o fluxo digitalizado.
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {pillars.map((p, i) => (
          <div key={i} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3 hover:border-[hsl(80,55%,55%)]/25 transition">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-sm font-bold">{p.role}</span>
            </div>
            <ul className="space-y-1.5">
              {p.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-white/50">
                  <CheckCircle2 className="w-3 h-3 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30 text-center">+ perfis Mesa de Produtos e Administrador com controle total da esteira de crédito</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 4 — PRODUTO (SCREENSHOTS)
   ═══════════════════════════════════════════════════════════════════ */

function SlideProduto() {
  return (
    <div className="space-y-8">
      <Tag icon={Layers}>O Produto</Tag>
      <h2 className="text-3xl md:text-4xl font-bold font-['Sora'] leading-tight">
        Não é conceito. <span className="text-[hsl(80,55%,55%)]">Está construído.</span>
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        <ScreenshotCard
          src="/images/produtor-propriedades.png"
          label="Gestão de Propriedades"
          desc="Cadastro completo com CAR, coordenadas GPS, área, tipo de solo e matrícula."
        />
        <ScreenshotCard
          src="/images/esteira-pipeline.png"
          label="Esteira de Crédito"
          desc="Pipeline visual com SLA, atribuição de engenheiros e controle de documentos."
        />
        <ScreenshotCard
          src="/images/engenheiro-vistoria.png"
          label="Laudo Agronômico"
          desc="Checklist técnico, fotos geolocalizadas e assinatura digital com hash SHA-256."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ScreenshotCard
          src="/images/agrobanker-dashboard.png"
          label="Dashboard AgroBanker"
          desc="KPIs de carteira, conversão, captações ativas e comissões pendentes."
        />
        <ScreenshotCard
          src="/images/agrobanker-captacoes.png"
          label="Catálogo de Produtos"
          desc="Produtos PRONAF habilitados pela Mesa com comissões personalizadas."
        />
        <ScreenshotCard
          src="/images/mesa-agrobankers.png"
          label="Controle da Mesa"
          desc="Gestão de parceiros, regiões, produtos e condições comerciais."
        />
      </div>
    </div>
  );
}

function ScreenshotCard({ src, label, desc }: { src: string; label: string; desc: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] group hover:border-[hsl(80,55%,55%)]/25 transition">
      <div className="aspect-video overflow-hidden bg-black/30">
        <img src={src} alt={label} className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition" />
      </div>
      <div className="p-3">
        <h4 className="text-xs font-bold">{label}</h4>
        <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 5 — COMO FUNCIONA
   ═══════════════════════════════════════════════════════════════════ */

function SlideComoFunciona() {
  const steps = [
    { n: "01", title: "Produtor solicita", desc: "Cadastra propriedade, seleciona produto PRONAF e banco destino", icon: Sprout, color: "hsl(80,55%,55%)" },
    { n: "02", title: "Mesa tria e valida", desc: "Valida documentos, aplica regras regionais e atribui engenheiro", icon: Shield, color: "hsl(35,65%,50%)" },
    { n: "03", title: "Engenheiro vistoria", desc: "Inspeção in loco com checklist, fotos geolocalizadas e parecer", icon: Wrench, color: "hsl(80,55%,55%)" },
    { n: "04", title: "Laudo assinado", desc: "Assinatura digital SHA-256 com registro de IP e geração de PDF", icon: FileText, color: "hsl(35,65%,50%)" },
    { n: "05", title: "Banco aprova", desc: "Dossiê completo enviado ao banco parceiro para análise final", icon: Landmark, color: "hsl(80,55%,55%)" },
    { n: "06", title: "Crédito liberado", desc: "Produtor acessa o crédito, engenheiro recebe, plataforma monetiza", icon: DollarSign, color: "hsl(35,65%,50%)" },
  ];

  return (
    <div className="space-y-8">
      <Tag icon={Layers}>Como Funciona</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora']">
        De <span className="text-[hsl(35,65%,50%)]">45 dias</span> para <span className="text-[hsl(80,55%,55%)]">dias</span>.
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="relative p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] group hover:border-white/15 transition">
            <span className="text-3xl font-extrabold font-['Sora'] absolute top-3 right-4" style={{ color: s.color, opacity: 0.15 }}>{s.n}</span>
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <h3 className="font-bold text-sm">{s.title}</h3>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 6 — MERCADO (TAM / SAM / SOM)
   ═══════════════════════════════════════════════════════════════════ */

function SlideMercado() {
  return (
    <div className="space-y-8">
      <Tag icon={TrendingUp}>Oportunidade de Mercado</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora'] leading-tight">
        O agronegócio brasileiro é o <span className="text-[hsl(80,55%,55%)]">maior do mundo</span>.
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        <Metric value="R$ 400 bi+" label="TAM — Plano Safra 25/26" sub="Crédito rural total disponível" />
        <Metric value="R$ 50 bi" label="SAM — Laudos obrigatórios" sub="~70% das linhas exigem laudo técnico" />
        <Metric value="R$ 500 M" label="SOM — Meta 5 anos" sub="Captura de 1% do mercado de laudos" />
      </div>

      <div className="grid md:grid-cols-4 gap-4 pt-2">
        {[
          { value: "4,5M+", label: "Produtores rurais" },
          { value: "93 mil", label: "Engenheiros agrônomos" },
          { value: "5.570", label: "Municípios brasileiros" },
          { value: "70%+", label: "Linhas exigem laudo" },
        ].map((m, i) => (
          <div key={i} className="text-center py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="text-xl font-extrabold text-[hsl(80,55%,55%)] font-['Sora']">{m.value}</div>
            <div className="text-[11px] text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-white/25 text-center">Fontes: Ministério da Agricultura, BCB, CREA, IBGE — Plano Safra 2025/2026</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 7 — MODELO DE NEGÓCIO
   ═══════════════════════════════════════════════════════════════════ */

function SlideModelo() {
  return (
    <div className="space-y-8">
      <Tag icon={DollarSign}>Modelo de Negócio</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora']">
        Receita por <span className="text-[hsl(80,55%,55%)]">transação</span> + <span className="text-[hsl(80,55%,55%)]">recorrência</span>.
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue streams */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-[hsl(80,55%,55%)]" /> Fontes de Receita
          </h3>
          {[
            { label: "Taxa por laudo emitido", desc: "Fixo ou % por produto PRONAF, configurável", tag: "Core" },
            { label: "Take rate da plataforma", desc: "10–20% sobre o valor do serviço", tag: "Core" },
            { label: "Comissão AgroBanker", desc: "Repasse sobre originação B2B (% + fixo)", tag: "B2B" },
            { label: "Assinatura banco parceiro", desc: "Acesso ao dashboard e fluxo de aprovação", tag: "SaaS" },
            { label: "Assistência técnica", desc: "Engenheiro projetista auxilia na documentação", tag: "Upsell" },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[hsl(80,55%,55%)]/10 text-[hsl(80,55%,55%)]">{r.tag}</span>
                </div>
                <p className="text-xs text-white/35 mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Unit economics */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[hsl(80,55%,55%)]/8 to-[hsl(145,45%,28%)]/8 border border-[hsl(80,55%,55%)]/15 space-y-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[hsl(80,55%,55%)]" /> Unit Economics (projeção)
          </h3>
          {[
            { label: "Ticket médio por laudo", value: "R$ 500 – R$ 1.500" },
            { label: "Take rate da plataforma", value: "10% – 20%" },
            { label: "Margem bruta estimada", value: "> 65%" },
            { label: "CAC estimado (B2B2C)", value: "< R$ 50" },
            { label: "LTV projetado / produtor", value: "> R$ 2.000/ano" },
            { label: "LTV:CAC ratio", value: "> 40x" },
          ].map((u, i) => (
            <div key={i} className="flex justify-between items-center border-b border-white/[0.06] pb-3 last:border-0">
              <span className="text-sm text-white/50">{u.label}</span>
              <span className="text-sm font-bold text-[hsl(80,55%,55%)]">{u.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 8 — TRAÇÃO / MVP
   ═══════════════════════════════════════════════════════════════════ */

function SlideTracao() {
  const achievements = [
    { icon: Layers, label: "MVP funcional completo", desc: "6 perfis implementados com fluxo end-to-end" },
    { icon: Shield, label: "Segurança enterprise", desc: "RLS por perfil, auditoria com IP, assinatura digital" },
    { icon: FileText, label: "30+ módulos construídos", desc: "Cadastro, solicitação, vistoria, laudo, pagamento..." },
    { icon: Briefcase, label: "Canal AgroBanker ativo", desc: "Distribuição B2B com comissões e controle regional" },
    { icon: GraduationCap, label: "Portal de treinamento", desc: "16 módulos em 4 trilhas com certificação" },
    { icon: Landmark, label: "Integração bancária", desc: "Dashboard dedicado por banco parceiro" },
  ];

  const roadmap = [
    { q: "Q1 2026", status: "done", items: ["MVP com 6 perfis", "Canal AgroBanker", "Esteira de crédito completa"] },
    { q: "Q2 2026", status: "active", items: ["PWA mobile", "ICP-Brasil", "3 bancos piloto"] },
    { q: "Q3 2026", status: "pending", items: ["IA para risco", "5 estados", "500 laudos/mês"] },
    { q: "Q4 2026", status: "pending", items: ["Marketplace", "SICOR/CAR", "Cobertura nacional"] },
  ];

  return (
    <div className="space-y-8">
      <Tag icon={Rocket}>Tração & Roadmap</Tag>
      <h2 className="text-3xl md:text-4xl font-bold font-['Sora']">
        O produto <span className="text-[hsl(80,55%,55%)]">já existe</span>. Agora é <span className="text-[hsl(80,55%,55%)]">escalar</span>.
      </h2>

      <div className="grid md:grid-cols-3 gap-3">
        {achievements.map((a, i) => (
          <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <a.icon className="w-4 h-4 text-[hsl(80,55%,55%)] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold">{a.label}</h4>
              <p className="text-[10px] text-white/35 mt-0.5">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        {roadmap.map((p, i) => (
          <div key={i} className={cn("p-4 rounded-xl border space-y-3",
            p.status === "done" ? "bg-[hsl(80,55%,55%)]/8 border-[hsl(80,55%,55%)]/25" :
            p.status === "active" ? "bg-[hsl(35,65%,50%)]/8 border-[hsl(35,65%,50%)]/25" :
            "bg-white/[0.02] border-white/[0.06]"
          )}>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                p.status === "done" ? "bg-[hsl(80,55%,55%)]/15 text-[hsl(80,55%,55%)]" :
                p.status === "active" ? "bg-[hsl(35,65%,50%)]/15 text-[hsl(35,65%,50%)]" :
                "bg-white/8 text-white/40"
              )}>{p.q}</span>
              {p.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(80,55%,55%)]" />}
            </div>
            <ul className="space-y-1">
              {p.items.map((item, j) => (
                <li key={j} className="text-[11px] text-white/45 flex items-start gap-1.5">
                  <span className="text-white/15 mt-px">•</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 9 — DIFERENCIAIS / MOAT
   ═══════════════════════════════════════════════════════════════════ */

function SlideDiferenciais() {
  const moats = [
    { icon: Layers, title: "End-to-end", desc: "Único player que cobre do cadastro da propriedade à liberação do crédito pelo banco. Zero fragmentação.", color: "hsl(80,55%,55%)" },
    { icon: Network, title: "Efeito de rede", desc: "Mais engenheiros → mais cobertura → mais produtores → mais bancos → mais AgroBankers. Ciclo virtuoso.", color: "hsl(80,55%,55%)" },
    { icon: Shield, title: "Compliance nativo", desc: "PRONAF, ZARC, RLS, auditoria e assinatura digital desde o dia zero. Não é retrofit — é arquitetura.", color: "hsl(35,65%,50%)" },
    { icon: Briefcase, title: "Distribuição B2B", desc: "Canal AgroBanker transforma revendas e cooperativas em força de vendas com incentivos alinhados.", color: "hsl(35,65%,50%)" },
  ];

  return (
    <div className="space-y-8">
      <Tag icon={Star}>Diferenciais Competitivos</Tag>
      <h2 className="text-3xl md:text-5xl font-bold font-['Sora']">
        Por que o AgroLaudo <span className="text-[hsl(80,55%,55%)]">vence</span>?
      </h2>

      <div className="grid md:grid-cols-2 gap-5">
        {moats.map((m, i) => (
          <div key={i} className="flex gap-5 p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" style={{ background: `${m.color}15` }}>
              <m.icon className="w-6 h-6" style={{ color: m.color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{m.title}</h3>
              <p className="text-sm text-white/40 mt-1.5 leading-relaxed">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-xl bg-gradient-to-r from-[hsl(80,55%,55%)]/8 to-[hsl(35,65%,50%)]/8 border border-[hsl(80,55%,55%)]/15">
        <div className="flex items-center gap-3 mb-3">
          <Lock className="w-5 h-5 text-[hsl(80,55%,55%)]" />
          <h4 className="font-bold">Barreiras de entrada</h4>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-white/45">
          <div><strong className="text-white/70">Regulatório:</strong> Conformidade PRONAF, ZARC e regras bancárias exige profundo conhecimento do setor.</div>
          <div><strong className="text-white/70">Rede de engenheiros:</strong> Base credenciada com cobertura geográfica leva anos para construir.</div>
          <div><strong className="text-white/70">Confiança bancária:</strong> Integração com instituições financeiras exige compliance e track record.</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SLIDE 10 — CTA / ASK
   ═══════════════════════════════════════════════════════════════════ */

function SlideCTA() {
  return (
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(80,55%,55%)]/25 bg-[hsl(80,55%,55%)]/8 text-[hsl(80,55%,55%)] text-xs font-medium">
        <Handshake className="w-3.5 h-3.5" /> Oportunidade de Investimento
      </div>

      <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold font-['Sora'] leading-tight">
        Vamos desburocratizar o<br /><span className="text-[hsl(80,55%,55%)]">crédito rural</span> juntos.
      </h2>

      <p className="text-lg text-white/45 max-w-xl mx-auto leading-relaxed">
        O produto está pronto. O mercado é de R$ 400 bilhões.<br />Precisamos de parceiros para escalar.
      </p>

      <div className="flex items-center justify-center gap-10 pt-4">
        {[
          { value: "MVP", sub: "Funcional" },
          { value: "6", sub: "Perfis" },
          { value: "30+", sub: "Módulos" },
          { value: "R$ 400bi", sub: "TAM" },
        ].map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl font-extrabold text-white/80 font-['Sora']">{s.value}</div>
            <div className="text-[10px] text-white/35 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="pt-8 space-y-2">
        <p className="text-sm text-white/50 font-medium">contato@agrolaudo.com.br</p>
        <p className="text-xs text-white/20">AgroLaudo · Pitch Deck · Fevereiro 2026</p>
      </div>
    </div>
  );
}
