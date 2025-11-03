import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, Package, CheckCircle, XCircle, Eye } from "lucide-react";
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
  cliente: {
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
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Real-time updates
    const channel = supabase
      .channel('orders-management-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
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
          cliente_id,
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

      // Mapear clientes
      const clientesMap = new Map(clientes?.map(c => [c.id, c]));

      // Combinar dados
      const ordersWithClientes = (data || []).map(order => ({
        ...order,
        cliente: clientesMap.get(order.cliente_id) || null,
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
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className={`${statusColors[order.status_pedido]} text-white`}>
                      {getStatusIcon(order.status_pedido)}
                      <span className="ml-1">{statusLabels[order.status_pedido]}</span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('pt-MZ')}
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold">{order.cliente?.nome_completo || "Cliente"}</p>
                    <p className="text-sm text-muted-foreground">{order.cliente?.telefone || "N/A"}</p>
                  </div>

                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Total:</span> {order.valor_total.toFixed(2)} MZN
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Itens:</span> {order.itens_pedido?.length || 0} produto(s)
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
        ))}

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
