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
  LayoutDashboard,
  UserPlus,
  Building2,
  GitBranch,
  ShieldCheck,
  ArrowLeft,
  Leaf,
  Users,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/onboarding" },
  { title: "Novo Cadastro", icon: UserPlus, path: "/onboarding/cadastro" },
  { title: "Empresas", icon: Building2, path: "/onboarding/empresas" },
  { title: "Minha Rede", icon: Users, path: "/onboarding/rede" },
  { title: "Estrutura Comercial", icon: GitBranch, path: "/onboarding/estrutura" },
  { title: "Compliance", icon: ShieldCheck, path: "/onboarding/compliance" },
];

export function OnboardingSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-sidebar-foreground">Guatã</p>
            <p className="text-xs text-sidebar-foreground/60">Onboarding</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
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
        <SidebarMenuButton onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar ao Painel</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
