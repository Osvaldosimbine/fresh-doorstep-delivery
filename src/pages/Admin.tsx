import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, DollarSign, Package, Settings, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderSummary {
  id: string;
  date: string;
  time: string;
  produto: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  savings: number;
  type: "singular" | "revenda";
  padaria: string;
  cliente: string;
}

interface PricingConfig {
  basePrice: number;
  discount1_49: number;
  discount50_199: number;
  discount200Plus: number;
}

const Admin = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    basePrice: 15.00,
    discount1_49: 2.00,
    discount50_199: 3.00,
    discount200Plus: 3.50
  });
  const { toast } = useToast();

  // Mock data for demonstration
  useEffect(() => {
    const mockOrders: OrderSummary[] = [
      {
        id: "1",
        date: selectedDate,
        time: "07:30",
        produto: "Pão Tradicional",
        quantity: 25,
        unitPrice: 13.00,
        totalPrice: 325.00,
        savings: 50.00,
        type: "singular",
        padaria: "Padaria Central",
        cliente: "João Silva"
      },
      {
        id: "2",
        date: selectedDate,
        time: "08:15",
        produto: "Pão Integral",
        quantity: 100,
        unitPrice: 12.00,
        totalPrice: 1200.00,
        savings: 300.00,
        type: "revenda",
        padaria: "Padaria Norte",
        cliente: "Maria Santos"
      }
    ];
    setOrders(mockOrders);
  }, [selectedDate]);

  const handleUpdatePricing = () => {
    toast({
      title: "Preços atualizados!",
      description: "A configuração de preços foi salva com sucesso.",
    });
  };

  const singularOrders = orders.filter(o => o.type === "singular");
  const revendaOrders = orders.filter(o => o.type === "revenda");
  
  const totalSingular = singularOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalRevenda = revendaOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalSavings = orders.reduce((sum, o) => sum + o.savings, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-bread-crust mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie encomendas e configurações do sistema</p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">Encomendas</TabsTrigger>
            <TabsTrigger value="analytics">Relatórios</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label htmlFor="date">Data:</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Padaria</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Economia</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.time}</TableCell>
                      <TableCell>{order.cliente}</TableCell>
                      <TableCell>{order.produto}</TableCell>
                      <TableCell>{order.padaria}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell>{order.totalPrice.toFixed(2)} MT</TableCell>
                      <TableCell className="text-green-600">
                        {order.savings.toFixed(2)} MT
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.type === "revenda" ? "default" : "secondary"}>
                          {order.type === "revenda" ? "Revenda" : "Singular"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Singulares</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSingular.toFixed(2)} MT</div>
                  <p className="text-xs text-muted-foreground">
                    {singularOrders.length} encomendas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vendas Revenda</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalRevenda.toFixed(2)} MT</div>
                  <p className="text-xs text-muted-foreground">
                    {revendaOrders.length} encomendas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(totalSingular + totalRevenda).toFixed(2)} MT
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {orders.length} encomendas totais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Economia Clientes</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {totalSavings.toFixed(2)} MT
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total economizado
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Preços</CardTitle>
                <CardDescription>
                  Ajuste o preço base do pão e os valores de desconto por quantidade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Preço Base (MT)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={pricingConfig.basePrice}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        basePrice: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount1_49">Desconto 1-49 pães (MT)</Label>
                    <Input
                      id="discount1_49"
                      type="number"
                      step="0.01"
                      value={pricingConfig.discount1_49}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        discount1_49: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount50_199">Desconto 50-199 pães (MT)</Label>
                    <Input
                      id="discount50_199"
                      type="number"
                      step="0.01"
                      value={pricingConfig.discount50_199}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        discount50_199: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount200Plus">Desconto 200+ pães (MT)</Label>
                    <Input
                      id="discount200Plus"
                      type="number"
                      step="0.01"
                      value={pricingConfig.discount200Plus}
                      onChange={(e) => setPricingConfig(prev => ({
                        ...prev,
                        discount200Plus: parseFloat(e.target.value) || 0
                      }))}
                    />
                  </div>
                </div>

                <Button onClick={handleUpdatePricing} className="w-full">
                  Atualizar Configuração de Preços
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;