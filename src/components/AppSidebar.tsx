import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Leaf,
  Home,
  MapPin,
  FileText,
  ClipboardCheck,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Package,
  LogOut,
  Shield,
} from "lucide-react";

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const produtorNav: NavItem[] = [
  { title: "Início", icon: Home, path: "/" },
  { title: "Propriedades", icon: MapPin, path: "/propriedades" },
  { title: "Solicitações", icon: FileText, path: "/solicitacoes" },
];

const engenheiroNav: NavItem[] = [
  { title: "Início", icon: Home, path: "/" },
  { title: "Demandas", icon: ClipboardCheck, path: "/demandas" },
  { title: "Meus Laudos", icon: FileText, path: "/meus-laudos" },
  { title: "Pagamentos", icon: CreditCard, path: "/pagamentos" },
];

const mesaNav: NavItem[] = [
  { title: "Painel", icon: Home, path: "/mesa" },
  { title: "Esteira", icon: ClipboardCheck, path: "/mesa/esteira" },
  { title: "Envios ao Banco", icon: CreditCard, path: "/mesa/envios-banco" },
];

const adminNav: NavItem[] = [
  { title: "Dashboard", icon: Home, path: "/" },
  { title: "Usuários", icon: Users, path: "/admin/usuarios" },
  { title: "Produtos PRONAF", icon: Package, path: "/admin/produtos-pronaf" },
  { title: "Engenheiros", icon: Users, path: "/admin/engenheiros" },
  { title: "Pagamentos", icon: CreditCard, path: "/admin/pagamentos" },
  { title: "Auditoria", icon: Shield, path: "/admin/auditoria" },
  { title: "Relatórios", icon: BarChart3, path: "/admin/relatorios" },
  { title: "Configurações", icon: Settings, path: "/admin/configuracoes" },
];

export function AppSidebar() {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = role === "admin" ? adminNav : role === "mesa_produtos" ? mesaNav : role === "engenheiro" ? engenheiroNav : produtorNav;
  const roleLabel = role === "admin" ? "Administrador" : role === "mesa_produtos" ? "Mesa de Produtos" : role === "engenheiro" ? "Engenheiro" : "Produtor";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Leaf className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-sidebar-foreground">AgroLaudo</p>
            <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex flex-col gap-2">
          <p className="truncate text-xs text-sidebar-foreground/60">{user?.email}</p>
          <SidebarMenuButton onClick={() => { signOut(); navigate("/auth"); }}>
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
