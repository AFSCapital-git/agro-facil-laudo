import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, FileText, Shield, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-4 pt-20 pb-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 animate-scale-in">
          <Sprout className="h-8 w-8" />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl opacity-0 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
          AgroLaudo
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-lg opacity-0 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
          Plataforma inteligente para emissão de laudos agronômicos. Conectando produtores rurais a engenheiros e projetistas.
        </p>
        <div className="flex gap-3 mt-8 opacity-0 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Começar agora <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Features */}
      <section className="px-4 pb-20">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {[
            { icon: <FileText className="h-6 w-6" />, title: "Laudos digitais", desc: "Preencha, assine e envie laudos de forma 100% digital." },
            { icon: <Sprout className="h-6 w-6" />, title: "Gestão simplificada", desc: "Acompanhe solicitações, propriedades e pagamentos em um só lugar." },
            { icon: <Shield className="h-6 w-6" />, title: "Seguro e confiável", desc: "Dados protegidos com controle de acesso por perfil de usuário." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="rounded-xl border bg-card p-6 text-center opacity-0 animate-slide-up transition-shadow hover:shadow-md"
              style={{ animationDelay: `${400 + i * 100}ms`, animationFillMode: "forwards" }}
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                {f.icon}
              </div>
              <h3 className="font-display font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AgroLaudo. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Index;
