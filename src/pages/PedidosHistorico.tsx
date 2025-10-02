import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, MapPin, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PedidosHistorico = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Autenticação necessária",
        description: "Por favor, faça login para ver seus pedidos",
        variant: "destructive",
      });
      navigate('/register');
      return;
    }
    fetchOrders();
  }, [user, navigate, toast]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Buscar o perfil do usuário primeiro
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seu perfil",
          variant: "destructive",
        });
        return;
      }

      // Buscar pedidos reais do banco de dados
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select(`
          id,
          created_at,
          status_pedido,
          valor_total,
          endereco_entrega,
          forma_pagamento
        `)
        .eq('cliente_id', profile.id)
        .order('created_at', { ascending: false });

      if (pedidosError) {
        console.error("Erro ao buscar pedidos:", pedidosError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus pedidos",
          variant: "destructive",
        });
        return;
      }

      setOrders(pedidos || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar seus pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { label: "Pendente", variant: "secondary" as const },
      aceito: { label: "Aceito", variant: "default" as const },
      em_preparacao: { label: "Preparando", variant: "default" as const },
      pronto: { label: "Pronto", variant: "default" as const },
      em_transito: { label: "Em Trânsito", variant: "default" as const },
      entregue: { label: "Entregue", variant: "outline" as const }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-bread-crust mb-4">
              Meus Pedidos
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o histórico dos seus pedidos
            </p>
          </div>

          <div className="mb-6">
            <Button 
              onClick={() => navigate("/fazer-pedido")}
              className="bg-bread-golden hover:bg-bread-crust"
            >
              Fazer Novo Pedido
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const statusBadge = getStatusBadge(order.status_pedido);
                return (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Pedido #{order.id}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-MZ')}
                          </p>
                        </div>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {order.endereco_entrega}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="h-4 w-4" />
                        {order.forma_pagamento === 'mpesa' ? 'M-Pesa' : 
                         order.forma_pagamento === 'emola' ? 'E-Mola' :
                         order.forma_pagamento === 'dinheiro' ? 'Dinheiro' : 'Cartão'}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold text-lg text-bread-crust">
                          {order.valor_total.toFixed(2)} MT
                        </span>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/order-tracking`, { 
                              state: { orderId: order.id } 
                            })}
                          >
                            Acompanhar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não fez nenhum pedido.
                </p>
                <Button 
                  onClick={() => navigate("/fazer-pedido")}
                  className="bg-bread-golden hover:bg-bread-crust"
                >
                  Fazer Primeiro Pedido
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PedidosHistorico;