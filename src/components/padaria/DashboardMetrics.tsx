import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, ShoppingBag, Users, DollarSign } from "lucide-react";

interface DashboardMetricsProps {
  padariaId: string;
}

export function DashboardMetrics({ padariaId }: DashboardMetricsProps) {
  const [period, setPeriod] = useState("day");
  const [metrics, setMetrics] = useState({
    totalVendas: 0,
    totalClientes: 0,
    receitaTotal: 0,
    receitaLiquida: 0,
    pedidosPendentes: 0,
    pedidosConcluidos: 0,
  });
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchMetrics();
  }, [padariaId, period]);

  const fetchMetrics = async () => {
    try {
      // Calcular data de início baseado no período
      const now = new Date();
      let startDate = new Date();
      
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }

      // Buscar pedidos
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedidos")
        .select(`
          id,
          valor_total,
          taxa_servico_total,
          status_pedido,
          created_at,
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
        .gte("created_at", startDate.toISOString());

      if (pedidosError) throw pedidosError;

      // Calcular métricas
      const totalVendas = pedidos?.length || 0;
      const clientesUnicos = new Set(pedidos?.map(p => p.cliente_id)).size;
      const receitaTotal = pedidos?.reduce((sum, p) => sum + Number(p.valor_total), 0) || 0;
      const comissaoTotal = pedidos?.reduce((sum, p) => {
        const itens = p.itens_pedido || [];
        return sum + (itens.reduce((s: number, i: any) => s + i.quantidade, 0) * 3);
      }, 0) || 0;
      const receitaLiquida = receitaTotal - comissaoTotal;
      const pendentes = pedidos?.filter(p => p.status_pedido === "pendente").length || 0;
      const concluidos = pedidos?.filter(p => p.status_pedido === "entregue").length || 0;

      setMetrics({
        totalVendas,
        totalClientes: clientesUnicos,
        receitaTotal,
        receitaLiquida,
        pedidosPendentes: pendentes,
        pedidosConcluidos: concluidos,
      });

      // Processar dados para gráficos
      const salesByDay: Record<string, number> = {};
      pedidos?.forEach(pedido => {
        const date = new Date(pedido.created_at).toLocaleDateString();
        salesByDay[date] = (salesByDay[date] || 0) + Number(pedido.valor_total);
      });

      const chartData = Object.entries(salesByDay).map(([date, value]) => ({
        date,
        vendas: value,
      }));
      setSalesData(chartData);

      // Produtos mais vendidos
      const produtosCount: Record<string, number> = {};
      pedidos?.forEach(pedido => {
        pedido.itens_pedido?.forEach((item: any) => {
          const nome = item.produtos?.nome_produto || "Produto";
          produtosCount[nome] = (produtosCount[nome] || 0) + item.quantidade;
        });
      });

      const topProds = Object.entries(produtosCount)
        .map(([nome, quantidade]) => ({ nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);
      setTopProducts(topProds);

    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hoje</SelectItem>
            <SelectItem value="week">Última Semana</SelectItem>
            <SelectItem value="month">Último Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVendas}</div>
            <p className="text-xs text-muted-foreground">pedidos realizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalClientes}</div>
            <p className="text-xs text-muted-foreground">clientes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.receitaTotal.toFixed(2)} MZN</div>
            <p className="text-xs text-muted-foreground">vendas brutas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.receitaLiquida.toFixed(2)} MZN</div>
            <p className="text-xs text-muted-foreground">após comissão</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia</CardTitle>
            <CardDescription>Evolução das vendas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                vendas: {
                  label: "Vendas",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="vendas" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 produtos do período</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                quantidade: {
                  label: "Quantidade",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendentes</span>
              <span className="font-bold">{metrics.pedidosPendentes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Concluídos</span>
              <span className="font-bold">{metrics.pedidosConcluidos}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
