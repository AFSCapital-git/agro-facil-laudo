import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Leaf, ArrowRight, Shield, Zap, Globe, Satellite, Users, Building2,
  Sprout, Briefcase, Wrench, FileText, Lock, TrendingUp, ChevronDown,
  MapPin, Clock, DollarSign, Network, Eye, Smartphone, CheckCircle2,
  Play, Pause, Volume2, VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Reusable components ─── */

function FadeSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn("opacity-0 translate-y-8 transition-all duration-700 ease-out", className)}>
      {children}
    </div>
  );
}

function SectionTag({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[hsl(145,45%,28%)] mb-4">
      <Icon className="w-4 h-4" />
      {children}
    </div>
  );
}

function VideoBlock({ src, overlay, children }: { src: string; overlay?: boolean; children?: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  return (
    <div className="relative rounded-3xl overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
      {children && (
        <div className="absolute inset-0 flex items-end p-8">
          {children}
        </div>
      )}
    </div>
  );
}

function ScreenshotShowcase({ src, label, role }: { src: string; label: string; role: string }) {
  return (
    <div className="group rounded-2xl overflow-hidden border border-[hsl(40,18%,87%)] bg-white shadow-sm hover:shadow-xl hover:border-[hsl(145,45%,28%)]/25 transition-all duration-300">
      <div className="aspect-video overflow-hidden bg-[hsl(40,30%,95%)]">
        <img
          src={src}
          alt={label}
          className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(145,45%,28%)]/10">
          <Users className="w-4 h-4 text-[hsl(145,45%,28%)]" />
        </div>
        <div>
          <p className="text-sm font-bold font-display">{role}</p>
          <p className="text-xs text-[hsl(150,10%,45%)]">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function Institucional() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[hsl(40,30%,97%)] text-[hsl(150,25%,12%)] overflow-x-hidden">
      {/* ═══ NAV ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(40,30%,97%)]/80 backdrop-blur-xl border-b border-[hsl(40,18%,87%)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(145,45%,28%)]">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">Guatã</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pitch")}
              className="hidden sm:inline-flex text-sm font-medium text-[hsl(150,10%,45%)] hover:text-[hsl(150,25%,12%)] transition"
            >
              Pitch Deck
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[hsl(145,45%,28%)] text-white text-sm font-semibold hover:bg-[hsl(145,45%,24%)] transition shadow-lg shadow-[hsl(145,45%,28%)]/20"
            >
              Acessar Plataforma
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO com vídeo de fundo ═══ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/guata-hero.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(150,20%,8%)]/70 via-[hsl(150,20%,8%)]/50 to-[hsl(150,20%,8%)]/80" />

        <div className="relative z-10 max-w-5xl mx-auto text-center px-6 text-[hsl(40,30%,92%)]">
          <FadeSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(80,55%,55%)]/25 bg-[hsl(80,55%,55%)]/10 text-[hsl(80,55%,55%)] text-xs font-semibold tracking-wide mb-8">
              <Sprout className="w-3.5 h-3.5" />
              DO TUPI: AVANÇAR
            </div>
          </FadeSection>

          <FadeSection delay={100}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight leading-[0.95]">
              <span className="text-[hsl(80,55%,55%)]">Guatã</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl font-display font-light text-white/60 mt-4 max-w-3xl mx-auto leading-relaxed">
              O futuro digital do crédito rural no Brasil
            </p>
          </FadeSection>

          <FadeSection delay={200}>
            <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mt-8 leading-relaxed">
              Somos um <strong className="text-white/80 font-semibold">corban digital especializado em agronegócio</strong>,
              conectando produtor, engenheiro, banco e parceiros em uma única plataforma —
              distribuindo produtos financeiros e não financeiros do Banco da Amazônia.
            </p>
          </FadeSection>

          <FadeSection delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[hsl(80,55%,55%)] text-[hsl(150,25%,10%)] text-base font-bold hover:bg-[hsl(80,55%,60%)] transition shadow-xl shadow-[hsl(80,55%,55%)]/25"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#problema"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white/70 text-base font-semibold hover:bg-white/5 transition"
              >
                Saiba mais
                <ChevronDown className="w-5 h-5" />
              </a>
            </div>
          </FadeSection>

          <FadeSection delay={400}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
              {[
                { icon: Globe, label: "100% Digital" },
                { icon: Smartphone, label: "Mobile-first" },
                { icon: Lock, label: "Dados Seguros" },
                { icon: Zap, label: "Crédito Rápido" },
              ].map((t, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-white/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.08] border border-white/[0.1]">
                    <t.icon className="w-5 h-5 text-[hsl(80,55%,55%)]" />
                  </div>
                  <span className="text-xs font-semibold">{t.label}</span>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* ═══ BLOCO 1 — O PROBLEMA ═══ */}
      <section id="problema" className="py-24 px-6 bg-[hsl(150,20%,8%)] text-[hsl(40,30%,92%)]">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <SectionTag icon={Eye}>O Problema</SectionTag>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight max-w-4xl">
              O produtor rural ainda enfrenta um grande desafio para acessar crédito.
            </h2>
            <p className="text-lg text-white/50 mt-4 max-w-3xl">
              Processos lentos, burocracia pesada, dependência de intermediários caros e, muitas vezes,
              vendas casadas e taxas adicionais que encarecem demais o financiamento.
            </p>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              { icon: Clock, title: "Processos Lentos", desc: "Semanas de espera entre solicitação e liberação do crédito rural.", accent: "hsl(35,65%,50%)" },
              { icon: FileText, title: "Burocracia Pesada", desc: "Documentação analógica, retrabalho e falta de padrão entre instituições.", accent: "hsl(35,65%,50%)" },
              { icon: DollarSign, title: "Vendas Casadas", desc: "Custos extras com intermediários, seguros forçados e taxas ocultas.", accent: "hsl(0,72%,51%)" },
              { icon: MapPin, title: "Intermediários Caros", desc: "Dependência de terceiros que encarecem e complicam o processo.", accent: "hsl(35,65%,50%)" },
            ].map((p, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[hsl(35,65%,50%)]/30 transition h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ backgroundColor: `${p.accent}20` }}>
                    <p.icon className="w-6 h-6" style={{ color: p.accent }} />
                  </div>
                  <h3 className="font-display font-bold text-lg">{p.title}</h3>
                  <p className="text-sm text-white/40 mt-2 leading-relaxed">{p.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 2 — A VIRADA: NASCE A GUATÃ ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeSection>
              <SectionTag icon={Sprout}>A Virada</SectionTag>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">
                Nasce a <span className="text-[hsl(145,45%,28%)]">Guatã</span>
              </h2>
              <p className="text-lg text-[hsl(150,10%,45%)] mt-6 leading-relaxed">
                A Guatã nasceu para mudar esse cenário. Somos um corban digital especializado em agronegócio,
                responsáveis por distribuir produtos financeiros e não financeiros do Banco da Amazônia.
              </p>
              <div className="mt-8 p-6 rounded-2xl bg-[hsl(145,45%,28%)]/5 border border-[hsl(145,45%,28%)]/15">
                <p className="text-sm font-medium text-[hsl(145,45%,28%)] mb-1">Etimologia</p>
                <p className="text-base italic text-[hsl(150,25%,12%)]">
                  "Guatã, do tupi, significa <strong>avançar</strong>. E é exatamente isso que fazemos:
                  avançamos o crédito rural para o futuro digital."
                </p>
              </div>
            </FadeSection>

            <FadeSection delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Globe, value: "100%", label: "Jornada Digital" },
                  { icon: Shield, value: "Zero", label: "Vendas Casadas" },
                  { icon: Zap, value: "3x", label: "Mais Rápido" },
                  { icon: TrendingUp, value: "↓70%", label: "Menos Burocracia" },
                ].map((s, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white border border-[hsl(40,18%,87%)] text-center shadow-sm hover:shadow-md transition">
                    <s.icon className="w-6 h-6 text-[hsl(145,45%,28%)] mx-auto mb-3" />
                    <div className="text-2xl font-display font-extrabold text-[hsl(145,45%,28%)]">{s.value}</div>
                    <div className="text-xs text-[hsl(150,10%,45%)] font-medium mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 3 — CRÉDITO SIMPLES, RÁPIDO E JUSTO ═══ */}
      <section className="py-24 px-6 bg-gradient-to-b from-[hsl(145,45%,28%)]/[0.03] to-transparent">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <div className="text-center mb-16">
              <SectionTag icon={Smartphone}>A Solução</SectionTag>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight max-w-3xl mx-auto">
                Crédito simples, rápido e <span className="text-[hsl(145,45%,28%)]">justo</span>
              </h2>
              <p className="text-lg text-[hsl(150,10%,45%)] mt-4 max-w-2xl mx-auto">
                O produtor rural acessa a plataforma, faz o pedido de crédito de forma totalmente remota,
                rápida e segura — direto na palma da mão.
              </p>
            </div>
          </FadeSection>

          {/* Flow steps */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Cadastro", desc: "Produtor registra propriedade e documentos de forma digital.", icon: Users },
              { step: "02", title: "Solicitação", desc: "Escolhe o produto PRONAF, valor e banco de destino.", icon: FileText },
              { step: "03", title: "Acompanhamento", desc: "Pipeline em tempo real de cada etapa do processo.", icon: Eye },
            ].map((s, i) => (
              <FadeSection key={i} delay={i * 150}>
                <div className="relative p-8 rounded-2xl bg-white border border-[hsl(40,18%,87%)] shadow-sm text-center group hover:shadow-lg hover:border-[hsl(145,45%,28%)]/25 transition">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[hsl(145,45%,28%)] text-white text-xs font-bold rounded-full">
                    {s.step}
                  </div>
                  <s.icon className="w-8 h-8 text-[hsl(145,45%,28%)] mx-auto mt-4 mb-4" />
                  <h3 className="font-display font-bold text-lg">{s.title}</h3>
                  <p className="text-sm text-[hsl(150,10%,45%)] mt-2 leading-relaxed">{s.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Screenshots da plataforma - Login */}
          <FadeSection delay={300}>
            <div className="mt-16 max-w-2xl mx-auto">
              <div className="rounded-3xl overflow-hidden border border-[hsl(40,18%,87%)] shadow-2xl">
                <img
                  src="/images/guata-login.png"
                  alt="Tela de login da plataforma Guatã"
                  className="w-full object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-center text-sm text-[hsl(150,10%,45%)] mt-4">
                Acesso simplificado e seguro à plataforma
              </p>
            </div>
          </FadeSection>

          {/* Trust badges */}
          <FadeSection delay={400}>
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {["Sem vendas casadas", "Sem taxas escondidas", "Transparência total"].map((badge, i) => (
                <div key={i} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(145,45%,28%)]/20 bg-[hsl(145,45%,28%)]/5 text-sm font-medium text-[hsl(145,45%,28%)]">
                  <CheckCircle2 className="w-4 h-4" />
                  {badge}
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ═══ BLOCO 4 — TECNOLOGIA E GARANTIAS ═══ */}
      <section className="py-24 px-6 bg-[hsl(150,20%,8%)] text-[hsl(40,30%,92%)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeSection>
              <SectionTag icon={Satellite}>Tecnologia</SectionTag>
              <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">
                Garantias inteligentes com <span className="text-[hsl(80,55%,55%)]">imagens de satélite</span>
              </h2>
              <p className="text-lg text-white/50 mt-6 leading-relaxed">
                Usamos imagens de satélite para processar garantias e dar mais agilidade às análises.
                Nossa tecnologia integra dados e documentação diretamente ao banco, com envio seguro
                por VPN ou criptografia.
              </p>

              <div className="space-y-4 mt-8">
                {[
                  { icon: Satellite, label: "Imagens de satélite para análise de garantias rurais" },
                  { icon: Lock, label: "Transmissão segura via VPN e criptografia" },
                  { icon: Zap, label: "Integração direta de dados com o banco" },
                  { icon: Shield, label: "Assinatura digital com hash SHA-256" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <f.icon className="w-5 h-5 text-[hsl(80,55%,55%)] shrink-0" />
                    <span className="text-sm">{f.label}</span>
                  </div>
                ))}
              </div>
            </FadeSection>

            <FadeSection delay={200}>
              <VideoBlock src="/videos/guata-satelite.mp4" overlay>
                <div className="text-white space-y-2">
                  <p className="text-sm font-semibold text-[hsl(80,55%,55%)]">Processamento em Tempo Real</p>
                  <p className="text-xs text-white/60 max-w-sm">
                    Análise automatizada de áreas rurais com resolução de alta precisão para validação de garantias.
                  </p>
                </div>
              </VideoBlock>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 5 — ECOSSISTEMA GUATÃ ═══ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeSection>
            <div className="text-center mb-16">
              <SectionTag icon={Network}>O Ecossistema</SectionTag>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight max-w-3xl mx-auto">
                Todos os perfis <span className="text-[hsl(145,45%,28%)]">conectados</span>
              </h2>
              <p className="text-lg text-[hsl(150,10%,45%)] mt-4 max-w-2xl mx-auto">
                A Guatã conecta todo o ecossistema do crédito rural em uma jornada fluida e automatizada.
              </p>
            </div>
          </FadeSection>

          {/* Profile cards with real screenshots */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sprout,
                role: "Produtor",
                color: "hsl(145,45%,28%)",
                desc: "Perfil completo na plataforma. Faz o pleito de crédito junto à Mesa de Produtos Guatã, de qualquer lugar.",
                features: ["Cadastro digital completo", "Solicitação remota", "Acompanhamento em tempo real"],
              },
              {
                icon: Wrench,
                role: "Engenheiro / Projetista",
                color: "hsl(35,65%,50%)",
                desc: "Se cadastra e é acionado como em uma chamada de transporte por aplicativo — a Guatã direciona automaticamente.",
                features: ["Match automático por região", "Elaboração do laudo digital", "Pagamento rastreável"],
              },
              {
                icon: Briefcase,
                role: "AgroBanker",
                color: "hsl(145,45%,28%)",
                desc: "Captadores e gestores de carteiras de produtores. Criam sua própria rede e são remunerados como parceiros de negócio.",
                features: ["Carteira própria", "Originação de crédito", "Comissões automáticas"],
              },
              {
                icon: Shield,
                role: "Administrador",
                color: "hsl(35,65%,50%)",
                desc: "Cadastro de produtos, gestão do fluxo financeiro e acompanhamento em tempo real entre a Mesa Guatã e o Banco.",
                features: ["Gestão de produtos", "Fluxo financeiro", "Visão 360°"],
              },
              {
                icon: Building2,
                role: "Banco",
                color: "hsl(145,45%,28%)",
                desc: "Recebe todos os dados de forma estruturada e segura, pronto para analisar, aprovar e liberar recursos com eficiência.",
                features: ["Dados estruturados", "Workflow de aprovação", "Integração segura"],
              },
              {
                icon: Users,
                role: "Mesa de Produtos",
                color: "hsl(35,65%,50%)",
                desc: "Controle total da esteira de crédito: triagem, validação, atribuição e acompanhamento de todas as operações.",
                features: ["Pipeline de operações", "Controle de SLA", "Gestão de parceiros"],
              },
            ].map((p, i) => (
              <FadeSection key={i} delay={i * 100}>
                <div className="p-7 rounded-2xl bg-white border border-[hsl(40,18%,87%)] shadow-sm hover:shadow-lg hover:border-[hsl(145,45%,28%)]/20 transition h-full group">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: `${p.color}12` }}
                    >
                      <p.icon className="w-6 h-6" style={{ color: p.color }} />
                    </div>
                    <h3 className="font-display font-bold text-lg">{p.role}</h3>
                  </div>
                  <p className="text-sm text-[hsl(150,10%,45%)] leading-relaxed">{p.desc}</p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-[hsl(150,10%,45%)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(145,45%,28%)] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Screenshots reais da plataforma */}
          <FadeSection>
            <div className="mt-20 text-center mb-10">
              <h3 className="text-2xl sm:text-3xl font-display font-bold">
                A plataforma em <span className="text-[hsl(145,45%,28%)]">ação</span>
              </h3>
              <p className="text-[hsl(150,10%,45%)] mt-2">Cada perfil tem sua visão personalizada e otimizada.</p>
            </div>
          </FadeSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FadeSection delay={0}>
              <ScreenshotShowcase src="/images/guata-produtor.png" role="Produtor" label="Dashboard com KPIs, atalhos e pipeline de operações" />
            </FadeSection>
            <FadeSection delay={100}>
              <ScreenshotShowcase src="/images/guata-engenheiro.png" role="Engenheiro" label="Demandas, laudos ativos e controle de pagamentos" />
            </FadeSection>
            <FadeSection delay={200}>
              <ScreenshotShowcase src="/images/guata-mesa.png" role="Mesa de Produtos" label="Esteira completa com filtros, SLA e abas de status" />
            </FadeSection>
            <FadeSection delay={300}>
              <ScreenshotShowcase src="/images/guata-admin.png" role="Administrador" label="Visão 360° com métricas, gráficos e acesso rápido" />
            </FadeSection>
            <FadeSection delay={400}>
              <ScreenshotShowcase src="/images/guata-banco.png" role="Banco Parceiro" label="Painel dedicado para análise e aprovação" />
            </FadeSection>
            <FadeSection delay={500}>
              <ScreenshotShowcase src="/images/guata-login.png" role="Acesso Seguro" label="Login simplificado com autenticação segura" />
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ═══ BLOCO 6 — FECHAMENTO / CTA com vídeo ═══ */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/videos/guata-fechamento.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(150,20%,8%)]/80 via-[hsl(150,20%,8%)]/70 to-[hsl(150,20%,8%)]/90" />

        <div className="max-w-4xl mx-auto text-center relative z-10 text-[hsl(40,30%,92%)]">
          <FadeSection>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[hsl(80,55%,55%)]/25 bg-[hsl(80,55%,55%)]/10 text-[hsl(80,55%,55%)] text-xs font-semibold tracking-wide mb-8">
              <Leaf className="w-3.5 h-3.5" />
              AVANÇAR É DO NOSSO NOME
            </div>
          </FadeSection>

          <FadeSection delay={100}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold leading-tight">
              O futuro digital do mercado de ativos voltado ao <span className="text-[hsl(80,55%,55%)]">agronegócio</span>
            </h2>
          </FadeSection>

          <FadeSection delay={200}>
            <p className="text-lg text-white/50 mt-6 max-w-2xl mx-auto leading-relaxed">
              Avançamos juntos com quem produz, simplificando o crédito e
              potencializando resultados no campo.
            </p>
          </FadeSection>

          <FadeSection delay={300}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[hsl(80,55%,55%)] text-[hsl(150,25%,10%)] text-base font-bold hover:bg-[hsl(80,55%,60%)] transition shadow-xl shadow-[hsl(80,55%,55%)]/25"
              >
                Acessar a Plataforma
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate("/pitch")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white/70 text-base font-semibold hover:bg-white/5 transition"
              >
                Ver Pitch Deck
              </button>
            </div>
          </FadeSection>

          <FadeSection delay={400}>
            <p className="text-xs text-white/25 mt-16">
              Guatã · Corban Digital do Agronegócio · Banco da Amazônia
            </p>
            <p className="text-[10px] text-white/15 mt-2 max-w-xl mx-auto italic">
              "Guatã é um corban digital que conecta produtor rural, engenheiros, agrobankers e o Banco da Amazônia
              em uma única plataforma. Com uso de imagens de satélite, integração segura de dados e jornadas 100% remotas,
              simplificamos a tomada de crédito, reduzimos custos e eliminamos vendas casadas."
            </p>
          </FadeSection>
        </div>
      </section>
    </div>
  );
}
