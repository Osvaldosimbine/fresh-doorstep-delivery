import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  created_at: string;
  valor_total: number;
  taxa_servico_total: number;
  status_pedido: any;
  endereco_entrega: string;
  forma_pagamento: string;
  profiles: {
    nome_completo: string;
    telefone: string;
  };
  itens_pedido: Array<{
    quantidade: number;
    preco_unitario: number;
    produtos: {
      nome_produto: string;
    };
  }>;
}

interface OrdersListProps {
  padariaId: string;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-500",
  em_preparacao: "bg-orange-500",
  a_caminho: "bg-purple-500",
  entregue: "bg-green-700",
  cancelado: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_preparacao: "Em Preparação",
  a_caminho: "A Caminho",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function OrdersList({ padariaId }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Realtime updates
    const channel = supabase
      .channel('padaria-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `padaria_id=eq.${padariaId}`
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [padariaId, filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("pedidos")
        .select(`
          id,
          created_at,
          valor_total,
          taxa_servico_total,
          status_pedido,
          endereco_entrega,
          forma_pagamento,
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
        .order("created_at", { ascending: false }) as any;

      if (filterStatus !== "all") {
        query = query.eq("status_pedido", filterStatus);
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) throw ordersError;

      // Buscar informações dos clientes
      const clienteIds = [...new Set(ordersData?.map(o => o.cliente_id) || [])].filter(Boolean) as string[];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome_completo, telefone")
        .in("id", clienteIds);

      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        profiles: profiles?.find(p => p.id === order.cliente_id) || { nome_completo: "Cliente", telefone: "" }
      }));

      setOrders(ordersWithProfiles || []);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({ status_pedido: newStatus as any })
        .eq("id", orderId);

      if (error) throw error;
      
      toast({ title: "Status atualizado com sucesso!" });
      fetchOrders();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pedidos Recebidos</h2>
          <p className="text-muted-foreground">Gerencie os pedidos da sua padaria</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="em_preparacao">Em Preparação</SelectItem>
            <SelectItem value="a_caminho">A Caminho</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Pedido #{order.id.slice(0, 8)}</CardTitle>
                  <CardDescription>
                    {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </CardDescription>
                </div>
                <Select
                  value={order.status_pedido}
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-[150px]">
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Cliente</h4>
                  <p className="text-sm">{order.profiles.nome_completo}</p>
                  <p className="text-sm text-muted-foreground">{order.profiles.telefone}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Entrega</h4>
                  <p className="text-sm">{order.endereco_entrega}</p>
                  <p className="text-sm text-muted-foreground">Pagamento: {order.forma_pagamento}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                <div className="space-y-1">
                  {order.itens_pedido.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantidade}x {item.produtos.nome_produto}</span>
                      <span>{(item.quantidade * item.preco_unitario).toFixed(2)} MZN</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{order.valor_total.toFixed(2)} MZN</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxa de serviço</span>
                  <span>{order.taxa_servico_total.toFixed(2)} MZN</span>
                </div>
                <div className="flex justify-between font-semibold text-primary">
                  <span>Você recebe</span>
                  <span>{(order.valor_total - order.taxa_servico_total).toFixed(2)} MZN</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum pedido encontrado
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
