import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Phone,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Receipt,
  Truck,
  Navigation,
  Package
} from "lucide-react";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { OrderTrackingStatus } from "@/components/OrderTrackingStatus";
import ReceiptGenerator from "@/components/ReceiptGenerator";
import { DeliveryTrackingMap } from "@/components/map/DeliveryTrackingMap";
import { supabase } from "@/integrations/supabase/client";

const OrderTracking = () => {
  const [showReceipt, setShowReceipt] = useState(false);
  const [rotaInfo, setRotaInfo] = useState<{
    distancia_total_km: number;
    tempo_estimado_minutos: number;
    status: string;
    ordem_paragens: any;
  } | null>(null);
  const [bakeryCoords, setBakeryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  
  // Support both route param and location state
  const orderId = paramId || location.state?.orderId;

  const {
    order,
    statusHistory,
    loading,
    error,
    statusOrder,
    statusLabels,
    statusDescriptions,
    getEstimatedTime,
    refetch,
  } = useOrderTracking(orderId);

  // Fetch route info and bakery coords
  useEffect(() => {
    const fetchRotaInfo = async () => {
      if (!orderId || !order?.status_pedido) return;
      
      // Fetch bakery coordinates
      if (order.padaria) {
        const { data: padaria } = await supabase
          .from('padarias')
          .select('coordenadas_lat, coordenadas_lng')
          .eq('nome_padaria', order.padaria.nome_padaria)
          .single();
        if (padaria?.coordenadas_lat && padaria?.coordenadas_lng) {
          setBakeryCoords({ lat: padaria.coordenadas_lat, lng: padaria.coordenadas_lng });
        }
      }

      if (order.status_pedido === 'a_caminho') {
        const { data: rotas } = await supabase
          .from('rotas_otimizadas')
          .select('distancia_total_km, tempo_estimado_minutos, status, ordem_paragens')
          .contains('pedidos_ids', [orderId])
          .in('status', ['aceita', 'em_andamento'])
          .single();
        
        if (rotas) {
          setRotaInfo(rotas);
        }
      }
    };

    fetchRotaInfo();
  }, [orderId, order?.status_pedido]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Por favor, forneça um ID de pedido válido
          </p>
          <Button onClick={() => navigate("/pedidos")}>
            Ver Meus Pedidos
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar pedido</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
            <Button onClick={() => navigate("/pedidos")}>
              Ver Meus Pedidos
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isDelivered = order.status_pedido === "entregue";
  const isCancelled = order.status_pedido === "cancelado";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate("/pedidos")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Acompanhar Entrega</h1>
              <p className="text-muted-foreground text-sm">
                Pedido #{order.id.slice(0, 8)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Card */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Status da Entrega</CardTitle>
                <Badge 
                  variant={isDelivered ? "default" : isCancelled ? "destructive" : "secondary"}
                >
                  {isDelivered ? "Concluído" : isCancelled ? "Cancelado" : "Em Andamento"}
                </Badge>
              </div>
              {!isDelivered && !isCancelled && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getEstimatedTime()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <OrderTrackingStatus
                statusOrder={statusOrder}
                currentStatus={order.status_pedido}
                statusLabels={statusLabels}
                statusDescriptions={statusDescriptions}
                statusHistory={statusHistory}
              />
            </CardContent>
          </Card>

          {/* Live Map - shown when order is in transit */}
          {(order.status_pedido === 'a_caminho' || order.status_pedido === 'em_preparacao') && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Rastreamento em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeliveryTrackingMap
                  orderId={order.id}
                  bakeryCoords={bakeryCoords}
                  bakeryAddress={order.padaria?.endereco}
                  deliveryAddress={order.endereco_entrega}
                  entregadorId={order.entregador ? undefined : undefined}
                />
              </CardContent>
            </Card>
          )}

          {/* Order Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalhes do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">Endereço de entrega</span>
                <p className="font-medium">{order.endereco_entrega}</p>
              </div>

              <Separator />

              <div>
                <span className="text-sm text-muted-foreground">Padaria</span>
                <p className="font-medium">{order.padaria?.nome_padaria}</p>
                <p className="text-sm text-muted-foreground">{order.padaria?.endereco}</p>
              </div>

              <Separator />

              <div>
                <span className="text-sm text-muted-foreground">Itens</span>
                <div className="mt-2 space-y-2">
                  {order.itens.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantidade}x {item.produto?.nome_produto || "Produto"}
                      </span>
                      <span className="font-medium">{item.subtotal.toFixed(2)} MT</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {(order.valor_total + (order.taxa_servico_total || 0)).toFixed(2)} MT
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Person Card */}
          {order.entregador && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Entregador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.entregador.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.entregador.telefone}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${order.entregador.telefone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      Ligar
                    </a>
                  </Button>
                </div>
                
                {/* Route Info */}
                {rotaInfo && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Navigation className="h-4 w-4" />
                        </div>
                        <p className="text-lg font-semibold">{rotaInfo.distancia_total_km?.toFixed(1)} km</p>
                        <p className="text-xs text-muted-foreground">Distância</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                        </div>
                        <p className="text-lg font-semibold">{rotaInfo.tempo_estimado_minutos} min</p>
                        <p className="text-xs text-muted-foreground">Tempo Est.</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                        <p className="text-lg font-semibold">
                          {Array.isArray(rotaInfo.ordem_paragens) 
                            ? rotaInfo.ordem_paragens.length - 1 
                            : 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Paragens</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Waiting for delivery person */}
          {order.status_pedido === 'a_caminho' && !order.entregador && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full animate-pulse">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Procurando entregador...</p>
                    <p className="text-sm text-muted-foreground">
                      Seu pedido está pronto e estamos atribuindo um entregador.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt Button */}
          {order && order.itens.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Button 
                  onClick={() => setShowReceipt(!showReceipt)} 
                  variant="outline" 
                  className="w-full"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {showReceipt ? "Ocultar Recibo" : "Ver Recibo"}
                </Button>
                
                {showReceipt && (
                  <div className="mt-4">
                    <ReceiptGenerator 
                      orderData={{
                        id: order.id.slice(0, 8).toUpperCase(),
                        produto: {
                          nome_produto: order.itens[0]?.produto?.nome_produto || "Produto",
                          tipo_pao: "",
                          preco: order.itens[0]?.preco_unitario || 0,
                          padarias: {
                            nome_padaria: order.padaria?.nome_padaria || "Padaria"
                          }
                        },
                        quantity: order.itens.reduce((acc, item) => acc + item.quantidade, 0),
                        location: {
                          address: order.endereco_entrega
                        },
                        total: order.valor_total + (order.taxa_servico_total || 0),
                        discountInfo: {
                          discountAmount: 0,
                          discountedPrice: order.itens[0]?.preco_unitario || 0,
                          totalSavings: 0
                        },
                        timestamp: new Date(order.created_at)
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completed State */}
          {isDelivered && (
            <div className="text-center">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Entrega Concluída!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Seu pedido foi entregue com sucesso. Obrigado por escolher a Bread Easy!
                </p>
                <Button onClick={() => navigate("/")}>
                  Fazer Novo Pedido
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderTracking;