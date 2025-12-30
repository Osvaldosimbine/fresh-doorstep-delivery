import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import PedidosHistorico from "./pages/PedidosHistorico";
import FazerPedido from "./pages/FazerPedido";
import OrderTracking from "./pages/OrderTracking";
import Admin from "./pages/Admin";
import HowItWorksPage from "./pages/HowItWorks";
import PadariaDashboard from "./pages/PadariaDashboard";
import CompletarCadastroPadaria from "./pages/CompletarCadastroPadaria";
import ProductDetail from "./pages/ProductDetail";
import OrderConfirmation from "./pages/OrderConfirmation";
import EntregadorDashboard from "./pages/EntregadorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/como-funciona" element={<HowItWorksPage />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/pedidos" element={<ProtectedRoute><PedidosHistorico /></ProtectedRoute>} />
              <Route path="/fazer-pedido" element={<ProtectedRoute><FazerPedido /></ProtectedRoute>} />
              <Route path="/order-tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/order-tracking/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
              <Route path="/padaria/dashboard" element={<ProtectedRoute allowedRoles={['padaria', 'admin']}><PadariaDashboard /></ProtectedRoute>} />
              <Route path="/padaria/completar-cadastro" element={<ProtectedRoute allowedRoles={['padaria']}><CompletarCadastroPadaria /></ProtectedRoute>} />
              <Route path="/entregador/dashboard" element={<ProtectedRoute allowedRoles={['entregador', 'admin']}><EntregadorDashboard /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
