import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center animate-fade-in">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-6">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-5xl font-bold mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Página não encontrada</p>
        <Button asChild>
          <Link to="/dashboard">
            <Home className="mr-2 h-4 w-4" /> Voltar ao início
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
