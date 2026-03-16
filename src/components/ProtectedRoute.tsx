import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

// Role-based route access map
const routeRoles: Record<string, string[]> = {
  "/admin": ["admin"],
  "/mesa": ["admin", "mesa_produtos"],
  "/banco": ["admin", "banco"],
  "/agrobanker": ["admin", "agrobanker"],
  "/propriedades": ["admin", "produtor", "mesa_produtos"],
  "/solicitacoes": ["admin", "produtor", "mesa_produtos", "engenheiro"],
  "/demandas": ["admin", "engenheiro", "mesa_produtos"],
  "/meus-laudos": ["admin", "engenheiro"],
  "/pagamentos": ["admin", "engenheiro"],
  "/relatorios-engenheiro": ["admin", "engenheiro"],
  "/relatorios-produtor": ["admin", "produtor"],
  "/onboarding": ["admin", "coban_master", "subestabelecido", "rm_comercial"],
};

function getRequiredRoles(pathname: string): string[] | null {
  // Check exact match first
  if (routeRoles[pathname]) return routeRoles[pathname];
  // Check prefix match (e.g., /admin/usuarios matches /admin)
  for (const route of Object.keys(routeRoles)) {
    if (pathname.startsWith(route + "/") || pathname === route) {
      return routeRoles[route];
    }
  }
  return null; // No restriction — accessible to all authenticated users
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role-based access
  const requiredRoles = getRequiredRoles(location.pathname);
  if (requiredRoles && role && !requiredRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
