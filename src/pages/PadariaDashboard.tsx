import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { DashboardMetrics } from "@/components/padaria/DashboardMetrics";
import { ProductManagement } from "@/components/padaria/ProductManagement";
import { OrdersList } from "@/components/padaria/OrdersList";

export default function PadariaDashboard() {
  const [loading, setLoading] = useState(true);
  const [isPadaria, setIsPadaria] = useState(false);
  const [padariaId, setPadariaId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/register");
        return;
      }

      // Verificar se o usuário é padaria
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.role !== "padaria" && profile?.role !== "admin") {
        toast({
          title: "Acesso negado",
          description: "Apenas padarias podem acessar este painel",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Buscar ID da padaria do usuário autenticado
      const { data: padariaData, error: padariaError } = await supabase
        .from("padarias")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (padariaError || !padariaData) {
        toast({
          title: "Padaria não encontrada",
          description: "Você precisa completar o cadastro da sua padaria",
          variant: "destructive",
        });
        navigate("/register");
        return;
      }

      setPadariaId(padariaData.id);
      setIsPadaria(true);
    } catch (error) {
      console.error("Erro ao verificar acesso:", error);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isPadaria || !padariaId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Painel da Padaria</h1>
          <p className="text-muted-foreground">Gerencie seus produtos, pedidos e acompanhe suas vendas</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardMetrics padariaId={padariaId} />
          </TabsContent>

          <TabsContent value="produtos">
            <ProductManagement padariaId={padariaId} />
          </TabsContent>

          <TabsContent value="pedidos">
            <OrdersList padariaId={padariaId} />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
