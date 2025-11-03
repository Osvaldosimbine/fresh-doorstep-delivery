import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";

interface FinancialReportsProps {
  padariaId: string;
}

interface FinancialData {
  receitaBruta: number;
  comissaoTotal: number;
  receitaLiquida: number;
  crescimentoMensal: number;
  ticketMedio: number;
  totalPedidos: number;
}

export function FinancialReports({ padariaId }: FinancialReportsProps) {
  const [period, setPeriod] = useState("month");
  const [financialData, setFinancialData] = useState<FinancialData>({
    receitaBruta: 0,
    comissaoTotal: 0,
    receitaLiquida: 0,
    crescimentoMensal: 0,
    ticketMedio: 0,
    totalPedidos: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [padariaId, period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();

      if (period === "week") {
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
      } else if (period === "month") {
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
      } else if (period === "year") {
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
      }

      // Buscar pedidos do período atual
      const { data: currentOrders, error: currentError } = await supabase
        .from("pedidos")
        .select("id, valor_total, taxa_servico_total, created_at, itens_pedido(quantidade)")
        .eq("padaria_id", padariaId)
        .gte("created_at", startDate.toISOString())
        .neq("status_pedido", "cancelado");

      if (currentError) throw currentError;

      // Buscar pedidos do período anterior para comparação
      const { data: previousOrders, error: previousError } = await supabase
        .from("pedidos")
        .select("valor_total")
        .eq("padaria_id", padariaId)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString())
        .neq("status_pedido", "cancelado");

      if (previousError) throw previousError;

      // Calcular métricas
      const receitaBruta = currentOrders?.reduce((sum, p) => sum + Number(p.valor_total), 0) || 0;
      
      // Calcular comissão (3 MZN por pão)
      const comissaoTotal = currentOrders?.reduce((sum, p) => {
        const totalItens = p.itens_pedido?.reduce((s: number, i: any) => s + i.quantidade, 0) || 0;
        return sum + (totalItens * 3);
      }, 0) || 0;

      const receitaLiquida = receitaBruta - comissaoTotal;
      const totalPedidos = currentOrders?.length || 0;
      const ticketMedio = totalPedidos > 0 ? receitaBruta / totalPedidos : 0;

      // Calcular crescimento
      const previousRevenue = previousOrders?.reduce((sum, p) => sum + Number(p.valor_total), 0) || 0;
      const crescimentoMensal = previousRevenue > 0 
        ? ((receitaBruta - previousRevenue) / previousRevenue) * 100 
        : 0;

      setFinancialData({
        receitaBruta,
        comissaoTotal,
        receitaLiquida,
        crescimentoMensal,
        ticketMedio,
        totalPedidos,
      });

      // Processar dados para gráfico
      const revenueByDay: Record<string, { bruta: number; liquida: number }> = {};
      currentOrders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('pt-MZ');
        const totalItens = order.itens_pedido?.reduce((s: number, i: any) => s + i.quantidade, 0) || 0;
        const comissao = totalItens * 3;
        
        if (!revenueByDay[date]) {
          revenueByDay[date] = { bruta: 0, liquida: 0 };
        }
        revenueByDay[date].bruta += Number(order.valor_total);
        revenueByDay[date].liquida += Number(order.valor_total) - comissao;
      });

      const chartData = Object.entries(revenueByDay).map(([date, value]) => ({
        date,
        bruta: value.bruta,
        liquida: value.liquida,
      }));

      setRevenueData(chartData);
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const csvContent = [
      ["Relatório Financeiro - Padaria"],
      ["Período", period === "week" ? "Última Semana" : period === "month" ? "Último Mês" : "Último Ano"],
      [""],
      ["Métrica", "Valor"],
      ["Receita Bruta", `${financialData.receitaBruta.toFixed(2)} MZN`],
      ["Comissão Total", `${financialData.comissaoTotal.toFixed(2)} MZN`],
      ["Receita Líquida", `${financialData.receitaLiquida.toFixed(2)} MZN`],
      ["Total de Pedidos", financialData.totalPedidos],
      ["Ticket Médio", `${financialData.ticketMedio.toFixed(2)} MZN`],
      ["Crescimento", `${financialData.crescimentoMensal.toFixed(2)}%`],
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Acompanhe sua receita e comissões</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.receitaBruta.toFixed(2)} MZN</div>
            <p className="text-xs text-muted-foreground">Total de vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissão Padarize</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              -{financialData.comissaoTotal.toFixed(2)} MZN
            </div>
            <p className="text-xs text-muted-foreground">3 MZN por pão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Líquida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {financialData.receitaLiquida.toFixed(2)} MZN
            </div>
            <p className="text-xs text-muted-foreground">Após comissão</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${
              financialData.crescimentoMensal >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              {financialData.crescimentoMensal >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {Math.abs(financialData.crescimentoMensal).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.ticketMedio.toFixed(2)} MZN</div>
            <p className="text-xs text-muted-foreground">Valor médio por pedido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialData.totalPedidos}</div>
            <p className="text-xs text-muted-foreground">Pedidos no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de receita */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Receita</CardTitle>
          <CardDescription>Comparação entre receita bruta e líquida</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              bruta: {
                label: "Receita Bruta",
                color: "hsl(var(--primary))",
              },
              liquida: {
                label: "Receita Líquida",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[350px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="bruta" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Receita Bruta"
                />
                <Line 
                  type="monotone" 
                  dataKey="liquida" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Receita Líquida"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Informações sobre comissão */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Comissão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              A Padarize cobra uma comissão fixa de <span className="font-semibold text-foreground">3 MZN por pão</span> vendido.
            </p>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Comissão total no período:</span>
                <span className="font-semibold">{financialData.comissaoTotal.toFixed(2)} MZN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Percentual sobre receita bruta:</span>
                <span className="font-semibold">
                  {financialData.receitaBruta > 0 
                    ? ((financialData.comissaoTotal / financialData.receitaBruta) * 100).toFixed(2)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
