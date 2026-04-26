import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, ShoppingBag, Clock, Star } from "lucide-react";

interface Props { padariaId: string; }

export function AnalyticsDashboard({ padariaId }: Props) {
  const [period, setPeriod] = useState("7");
  const [revenueData, setRevenueData] = useState<{ dia: string; receita: number; pedidos: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ nome: string; vendas: number; receita: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hora: string; pedidos: number }[]>([]);
  const [summary, setSummary] = useState({ totalReceita: 0, totalPedidos: 0, ticketMedio: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [padariaId, period]);

  async function fetchData() {
    setLoading(true);
    const days = parseInt(period);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    try {
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("id, created_at, total, status")
        .eq("padaria_id", padariaId)
        .gte("created_at", sinceISO)
        .neq("status", "cancelado");

      if (pedidos) {
        // Revenue by day
        const byDay: Record<string, { receita: number; pedidos: number }> = {};
        pedidos.forEach((p) => {
          const d = new Date(p.created_at).toLocaleDateString("pt-MZ", { day: "2-digit", month: "2-digit" });
          if (!byDay[d]) byDay[d] = { receita: 0, pedidos: 0 };
          byDay[d].receita += p.total ?? 0;
          byDay[d].pedidos += 1;
        });
        setRevenueData(
          Object.entries(byDay)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dia, v]) => ({ dia, ...v }))
        );

        // Hourly distribution
        const byHour: Record<number, number> = {};
        pedidos.forEach((p) => {
          const h = new Date(p.created_at).getHours();
          byHour[h] = (byHour[h] ?? 0) + 1;
        });
        setHourlyData(
          Array.from({ length: 24 }, (_, h) => ({
            hora: `${String(h).padStart(2, "0")}h`,
            pedidos: byHour[h] ?? 0,
          }))
        );

        const totalReceita = pedidos.reduce((s, p) => s + (p.total ?? 0), 0);
        const totalPedidos = pedidos.length;
        setSummary((prev) => ({ ...prev, totalReceita, totalPedidos, ticketMedio: totalPedidos ? totalReceita / totalPedidos : 0 }));
      }

      // Top products
      const { data: items } = await supabase
        .from("itens_pedido")
        .select("nome_produto, quantidade, preco_unitario, pedido_id, pedidos!inner(padaria_id, created_at, status)")
        .eq("pedidos.padaria_id", padariaId)
        .gte("pedidos.created_at", sinceISO)
        .neq("pedidos.status", "cancelado");

      if (items) {
        const byProduct: Record<string, { vendas: number; receita: number }> = {};
        items.forEach((i: any) => {
          const nome = i.nome_produto ?? "Produto";
          if (!byProduct[nome]) byProduct[nome] = { vendas: 0, receita: 0 };
          byProduct[nome].vendas += i.quantidade ?? 1;
          byProduct[nome].receita += (i.quantidade ?? 1) * (i.preco_unitario ?? 0);
        });
        setTopProducts(
          Object.entries(byProduct)
            .sort((a, b) => b[1].vendas - a[1].vendas)
            .slice(0, 8)
            .map(([nome, v]) => ({ nome, ...v }))
        );
      }

      // Average rating
      let ratings: any[] | null = null;
      try {
        const { data: ratingsData } = await supabase
          .from("avaliacoes")
          .select("estrelas, pedidos!inner(padaria_id)")
          .eq("pedidos.padaria_id", padariaId)
          .gte("created_at", sinceISO);
        ratings = ratingsData;
      } catch {
        ratings = null;
      }

      if (ratings && ratings.length > 0) {
        const avg = ratings.reduce((s: number, r: any) => s + (r.estrelas ?? 0), 0) / ratings.length;
        setSummary((prev) => ({ ...prev, avgRating: avg }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">A carregar analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Receita total</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalReceita.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Pedidos</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalPedidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Ticket médio</span>
            </div>
            <p className="text-2xl font-bold">{summary.ticketMedio.toLocaleString("pt-MZ", { style: "currency", currency: "MZN" })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Avaliação média</span>
            </div>
            <p className="text-2xl font-bold">{summary.avgRating ? summary.avgRating.toFixed(1) : "—"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue over time */}
      <Card>
        <CardHeader><CardTitle className="text-base">Receita por dia (MZN)</CardTitle></CardHeader>
        <CardContent>
          {revenueData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sem dados para o período.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`${v.toFixed(0)} MZN`]} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="#f97316" strokeWidth={2} dot={false} name="Receita" />
                <Line type="monotone" dataKey="pedidos" stroke="#3b82f6" strokeWidth={2} dot={false} name="Pedidos" yAxisId="right" hide />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top products */}
        <Card>
          <CardHeader><CardTitle className="text-base">Produtos mais vendidos</CardTitle></CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="vendas" fill="#f97316" name="Unidades" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Hourly heatmap */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pedidos por hora do dia</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" tick={{ fontSize: 9 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="#3b82f6" name="Pedidos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
