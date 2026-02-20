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
import MesaProdutos from "@/pages/mesa/MesaProdutos";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminEngenheiros from "@/pages/admin/AdminEngenheiros";
import AdminPagamentos from "@/pages/admin/AdminPagamentos";
import AdminConfiguracoes from "@/pages/admin/AdminConfiguracoes";
import AdminRelatorios from "@/pages/admin/AdminRelatorios";
import AdminProdutosPronaf from "@/pages/admin/AdminProdutosPronaf";
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
              <Route path="/mesa" element={<MesaProdutos />} />
              <Route path="/admin/engenheiros" element={<AdminEngenheiros />} />
              <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
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
