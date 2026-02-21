import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Propriedades from "@/pages/Propriedades";
import Solicitacoes from "@/pages/Solicitacoes";
import Demandas from "@/pages/Demandas";
import MeusLaudos from "@/pages/MeusLaudos";
import Pagamentos from "@/pages/Pagamentos";
import MesaDashboard from "@/pages/mesa/MesaDashboard";
import MesaProdutos from "@/pages/mesa/MesaProdutos";
import MesaEnviosBanco from "@/pages/mesa/MesaEnviosBanco";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminEngenheiros from "@/pages/admin/AdminEngenheiros";
import AdminPagamentos from "@/pages/admin/AdminPagamentos";
import AdminConfiguracoes from "@/pages/admin/AdminConfiguracoes";
import AdminRelatorios from "@/pages/admin/AdminRelatorios";
import AdminProdutosPronaf from "@/pages/admin/AdminProdutosPronaf";
import AdminUsuarios from "@/pages/admin/AdminUsuarios";
import AdminAuditoria from "@/pages/admin/AdminAuditoria";
import AdminBancos from "@/pages/admin/AdminBancos";
import AdminRegioes from "@/pages/admin/AdminRegioes";
import AdminBlacklist from "@/pages/admin/AdminBlacklist";
import AdminSLA from "@/pages/admin/AdminSLA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/propriedades" element={<Propriedades />} />
              <Route path="/solicitacoes" element={<Solicitacoes />} />
              <Route path="/demandas" element={<Demandas />} />
              <Route path="/meus-laudos" element={<MeusLaudos />} />
              <Route path="/pagamentos" element={<Pagamentos />} />
              <Route path="/mesa" element={<MesaDashboard />} />
              <Route path="/mesa/esteira" element={<MesaProdutos />} />
              <Route path="/mesa/envios-banco" element={<MesaEnviosBanco />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/engenheiros" element={<AdminEngenheiros />} />
              <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
              <Route path="/admin/auditoria" element={<AdminAuditoria />} />
              <Route path="/admin/bancos" element={<AdminBancos />} />
              <Route path="/admin/regioes" element={<AdminRegioes />} />
              <Route path="/admin/blacklist" element={<AdminBlacklist />} />
              <Route path="/admin/sla" element={<AdminSLA />} />
              <Route path="/admin/relatorios" element={<AdminRelatorios />} />
              <Route path="/admin/produtos-pronaf" element={<AdminProdutosPronaf />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
