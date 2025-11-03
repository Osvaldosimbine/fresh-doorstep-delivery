import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Star, ShoppingBag, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface CustomersManagementProps {
  padariaId: string;
}

interface Customer {
  id: string;
  nome_completo: string;
  telefone: string;
  email: string;
  totalPedidos: number;
  totalGasto: number;
  ultimoPedido: string;
  tipo: "novo" | "frequente" | "vip";
}

interface CustomerDetails extends Customer {
  pedidos: Array<{
    id: string;
    created_at: string;
    valor_total: number;
    status_pedido: string;
  }>;
}

export function CustomersManagement({ padariaId }: CustomersManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClientes: 0,
    novosClientes: 0,
    clientesFrequentes: 0,
    clientesVip: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, [padariaId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      // Buscar todos os pedidos da padaria com informações do cliente
      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select(`
          cliente_id,
          valor_total,
          created_at,
          profiles!pedidos_cliente_id_fkey (
            id,
            nome_completo,
            telefone,
            email
          )
        `)
        .eq("padaria_id", padariaId)
        .neq("status_pedido", "cancelado");

      if (error) throw error;

      // Agrupar pedidos por cliente
      const clientesMap = new Map<string, any>();

      pedidos?.forEach((pedido: any) => {
        const clienteId = pedido.cliente_id;
        const profile = pedido.profiles;

        if (!profile) return;

        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            id: clienteId,
            nome_completo: profile.nome_completo,
            telefone: profile.telefone,
            email: profile.email,
            totalPedidos: 0,
            totalGasto: 0,
            ultimoPedido: pedido.created_at,
          });
        }

        const cliente = clientesMap.get(clienteId);
        cliente.totalPedidos += 1;
        cliente.totalGasto += Number(pedido.valor_total);
        
        // Atualizar último pedido se for mais recente
        if (new Date(pedido.created_at) > new Date(cliente.ultimoPedido)) {
          cliente.ultimoPedido = pedido.created_at;
        }
      });

      // Classificar clientes
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const clientesArray: Customer[] = Array.from(clientesMap.values()).map((cliente) => {
        let tipo: "novo" | "frequente" | "vip" = "novo";
        
        if (cliente.totalPedidos >= 10) {
          tipo = "vip";
        } else if (cliente.totalPedidos >= 3) {
          tipo = "frequente";
        } else if (new Date(cliente.ultimoPedido) > thirtyDaysAgo) {
          tipo = "novo";
        }

        return { ...cliente, tipo };
      });

      // Ordenar por total gasto (maiores primeiro)
      clientesArray.sort((a, b) => b.totalGasto - a.totalGasto);

      setCustomers(clientesArray);

      // Calcular estatísticas
      const novos = clientesArray.filter(c => c.tipo === "novo").length;
      const frequentes = clientesArray.filter(c => c.tipo === "frequente").length;
      const vips = clientesArray.filter(c => c.tipo === "vip").length;

      setStats({
        totalClientes: clientesArray.length,
        novosClientes: novos,
        clientesFrequentes: frequentes,
        clientesVip: vips,
      });

    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      // Buscar histórico de pedidos do cliente
      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("id, created_at, valor_total, status_pedido")
        .eq("padaria_id", padariaId)
        .eq("cliente_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSelectedCustomer({
        ...customer,
        pedidos: pedidos || [],
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do cliente:", error);
    }
  };

  const getCustomerBadge = (tipo: "novo" | "frequente" | "vip") => {
    const badges = {
      novo: { label: "Novo", className: "bg-blue-500" },
      frequente: { label: "Frequente", className: "bg-green-500" },
      vip: { label: "VIP", className: "bg-purple-500" },
    };
    const badge = badges[tipo];
    return <Badge className={`${badge.className} text-white`}>{badge.label}</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestão de Clientes</h2>
        <p className="text-muted-foreground">Conheça e acompanhe seus clientes</p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.novosClientes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Frequentes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.clientesFrequentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes VIP</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.clientesVip}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Clientes</CardTitle>
          <CardDescription>Clientes ordenados por valor total gasto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.slice(0, 20).map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => fetchCustomerDetails(customer.id)}
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(customer.nome_completo)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{customer.nome_completo}</p>
                      {getCustomerBadge(customer.tipo)}
                    </div>
                    <p className="text-sm text-muted-foreground">{customer.telefone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{customer.totalGasto.toFixed(2)} MZN</p>
                  <p className="text-sm text-muted-foreground">{customer.totalPedidos} pedidos</p>
                </div>
              </div>
            ))}

            {customers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes do cliente */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Histórico e informações detalhadas
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedCustomer.nome_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedCustomer.nome_completo}</h3>
                    {getCustomerBadge(selectedCustomer.tipo)}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.telefone}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                  <p className="text-2xl font-bold">{selectedCustomer.totalPedidos}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold">{selectedCustomer.totalGasto.toFixed(2)} MZN</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-bold">
                    {(selectedCustomer.totalGasto / selectedCustomer.totalPedidos).toFixed(2)} MZN
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Histórico de Pedidos</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedCustomer.pedidos?.map((pedido) => (
                    <div key={pedido.id} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(pedido.created_at).toLocaleDateString('pt-MZ')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Status: {pedido.status_pedido}
                        </p>
                      </div>
                      <p className="font-semibold">{pedido.valor_total.toFixed(2)} MZN</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
