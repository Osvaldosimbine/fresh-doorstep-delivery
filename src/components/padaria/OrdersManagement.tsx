import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Package, CheckCircle, XCircle, Eye, Bell, Truck, User, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface OrdersManagementProps {
  padariaId: string;
}

type OrderStatus = "pendente" | "em_preparacao" | "a_caminho" | "entregue" | "cancelado";

interface Order {
  id: string;
  created_at: string;
  status_pedido: OrderStatus;
  valor_total: number;
  taxa_servico_total: number;
  endereco_entrega: string;
  observacoes: string | null;
  horario_agendado: string | null;
  entregador_id: string | null;
  cliente: {
    nome_completo: string;
    telefone: string;
  } | null;
  entregador: {
    nome_completo: string;
    telefone: string;
  } | null;
  itens_pedido: Array<{
    quantidade: number;
    preco_unitario: number;
    produtos: {
      nome_produto: string;
    };
  }>;
}

const statusColors: Record<OrderStatus, string> = {
  pendente: "bg-yellow-500",
  em_preparacao: "bg-blue-500",
  a_caminho: "bg-purple-500",
  entregue: "bg-gray-500",
  cancelado: "bg-red-500",
};

const statusLabels: Record<OrderStatus, string> = {
  pendente: "Pendente",
  em_preparacao: "Em Preparação",
  a_caminho: "A Caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function OrdersManagement({ padariaId }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrdersRef = useRef<string[]>([]);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      // Usar Web Audio API para criar um som simples
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Real-time updates com notificação
    const channel = supabase
      .channel('orders-management-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `padaria_id=eq.${padariaId}`,
        },
        (payload) => {
          console.log('Novo pedido recebido:', payload);
          
          // Tocar som e mostrar toast
          playNotificationSound();
          
          toast({
            title: "🔔 Novo Pedido!",
            description: "Um novo pedido acabou de chegar. Verifique a lista de pedidos.",
            duration: 10000,
          });
          
          // Marcar o pedido como novo para animação
          if (payload.new && (payload.new as any).id) {
            setNewOrderIds(prev => new Set(prev).add((payload.new as any).id));
            
            // Remover destaque após 30 segundos
            setTimeout(() => {
              setNewOrderIds(prev => {
                const next = new Set(prev);
                next.delete((payload.new as any).id);
                return next;
              });
            }, 30000);
          }
          
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `padaria_id=eq.${padariaId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [padariaId]);

  useEffect(() => {
    if (statusFilter === "todos") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status_pedido === statusFilter));
    }
  }, [statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          id,
          created_at,
          status_pedido,
          valor_total,
          taxa_servico_total,
          endereco_entrega,
          observacoes,
          horario_agendado,
          cliente_id,
          entregador_id,
          itens_pedido (
            quantidade,
            preco_unitario,
            produtos (
              nome_produto
            )
          )
        `)
        .eq("padaria_id", padariaId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar informações dos clientes
      const clienteIds = [...new Set((data || []).map(o => o.cliente_id))];
      const { data: clientes } = await supabase
        .from("profiles")
        .select("id, nome_completo, telefone")
        .in("id", clienteIds);

      // Buscar informações dos entregadores
      const entregadorIds = [...new Set((data || []).map(o => o.entregador_id).filter(Boolean))];
      let entregadoresMap = new Map();
      if (entregadorIds.length > 0) {
        const { data: entregadores } = await supabase
          .from("profiles")
          .select("id, nome_completo, telefone")
          .in("id", entregadorIds);
        entregadoresMap = new Map(entregadores?.map(e => [e.id, e]));
      }

      // Mapear clientes
      const clientesMap = new Map(clientes?.map(c => [c.id, c]));

      // Combinar dados
      const ordersWithClientes = (data || []).map(order => ({
        ...order,
        cliente: clientesMap.get(order.cliente_id) || null,
        entregador: order.entregador_id ? entregadoresMap.get(order.entregador_id) || null : null,
      }));

      setOrders(ordersWithClientes as Order[]);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status_pedido: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `Pedido marcado como ${statusLabels[newStatus]}`,
      });

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status_pedido: newStatus });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-4 w-4" />;
      case "em_preparacao":
      case "a_caminho":
        return <Package className="h-4 w-4" />;
      case "entregue":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelado":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Pedidos</h2>
          <p className="text-muted-foreground">Acompanhe e gerencie o status dos pedidos</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="em_preparacao">Em Preparação</SelectItem>
            <SelectItem value="a_caminho">A Caminho</SelectItem>
            <SelectItem value="entregue">Entregues</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => {
          const isNew = newOrderIds.has(order.id);
          return (
          <Card 
            key={order.id}
            className={`transition-all duration-500 ${
              isNew 
                ? 'ring-2 ring-primary bg-primary/5 animate-pulse' 
                : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {isNew && (
                      <Badge className="bg-primary text-primary-foreground animate-bounce">
                        <Bell className="h-3 w-3 mr-1" />
                        NOVO
                      </Badge>
                    )}
                    <Badge className={`${statusColors[order.status_pedido]} text-white`}>
                      {getStatusIcon(order.status_pedido)}
                      <span className="ml-1">{statusLabels[order.status_pedido]}</span>
                    </Badge>
                    {order.horario_agendado && (
                      <Badge variant="outline" className="border-primary/50">
                        <Clock className="h-3 w-3 mr-1" />
                        Agendado: {order.horario_agendado}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('pt-MZ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Cliente
                      </div>
                      <p className="font-semibold">{order.cliente?.nome_completo || "Cliente"}</p>
                      <p className="text-sm text-muted-foreground">{order.cliente?.telefone || "N/A"}</p>
                    </div>
                    
                    {order.entregador && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          Entregador
                        </div>
                        <p className="font-semibold">{order.entregador.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">{order.entregador.telefone}</p>
                      </div>
                    )}
                    
                    {!order.entregador && order.status_pedido === "a_caminho" && (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          Entregador
                        </div>
                        <p className="text-sm text-muted-foreground italic">Aguardando atribuição...</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm truncate max-w-[200px]">{order.endereco_entrega}</p>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Total:</span> {order.valor_total.toFixed(2)} MZN
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Itens:</span> {order.itens_pedido?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>

                  {order.status_pedido === "pendente" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "em_preparacao")}
                    >
                      Iniciar Preparo
                    </Button>
                  )}

                  {order.status_pedido === "em_preparacao" && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, "a_caminho")}
                    >
                      Marcar Em Rota
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
        })}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Pedido #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Cliente</h3>
                <p>{selectedOrder.cliente?.nome_completo || "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.cliente?.telefone || "N/A"}</p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
                <p className="text-sm">{selectedOrder.endereco_entrega}</p>
              </div>

              {selectedOrder.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">Observações</h3>
                    <p className="text-sm">{selectedOrder.observacoes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Itens do Pedido</h3>
                <div className="space-y-2">
                  {selectedOrder.itens_pedido?.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantidade}x {item.produtos?.nome_produto}
                      </span>
                      <span>{(item.quantidade * item.preco_unitario).toFixed(2)} MZN</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{selectedOrder.valor_total.toFixed(2)} MZN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de serviço</span>
                  <span>{selectedOrder.taxa_servico_total?.toFixed(2) || "0.00"} MZN</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>
                    {(selectedOrder.valor_total + (selectedOrder.taxa_servico_total || 0)).toFixed(2)} MZN
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Atualizar Status</h3>
                <Select
                  value={selectedOrder.status_pedido}
                  onValueChange={(value) => updateOrderStatus(selectedOrder.id, value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_preparacao">Em Preparação</SelectItem>
                    <SelectItem value="a_caminho">A Caminho</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
