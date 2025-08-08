import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MAPUTO_LOCATIONS } from "@/constants/locations";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  estoque_atual: number;
  disponivel: boolean;
}

interface Padaria {
  id: string;
  nome_padaria: string;
  endereco: string;
  localizacao: string;
  produtos: Produto[];
}

const Pedidos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [padarias, setPadarias] = useState<Padaria[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get("localizacao") || "");
  const [loading, setLoading] = useState(true);
  const { addItem, state } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchPadarias();
  }, [selectedLocation]);

  const fetchPadarias = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("padarias")
        .select(`
          id,
          nome_padaria,
          endereco,
          localizacao,
          produtos (
            id,
            nome_produto,
            preco,
            tipo_pao,
            estoque_atual,
            disponivel
          )
        `)
        .eq("status_ativa", true);

      if (selectedLocation) {
        query = query.eq("localizacao", selectedLocation);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPadarias(data || []);
    } catch (error) {
      console.error("Erro ao carregar padarias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as padarias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    setSearchParams({ localizacao: location });
  };

  const handleAddToCart = (produto: Produto, padaria: Padaria) => {
    addItem({
      id: produto.id,
      nome_produto: produto.nome_produto,
      preco: produto.preco,
      padaria_id: padaria.id,
      padaria_nome: padaria.nome_padaria,
    });
    
    toast({
      title: "Adicionado ao carrinho",
      description: `${produto.nome_produto} foi adicionado ao carrinho`,
    });
  };

  const getItemQuantity = (productId: string) => {
    const item = state.items.find(item => item.id === productId);
    return item?.quantidade || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-bread-crust mb-2">Pedidos</h1>
            <p className="text-muted-foreground">Escolha uma padaria e faça o seu pedido</p>
          </div>
          
          {state.items.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {state.items.length} {state.items.length === 1 ? "item" : "itens"} - {state.total.toFixed(2)} MT
            </Badge>
          )}
        </div>

        <div className="mb-6">
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por localização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as localizações</SelectItem>
              {MAPUTO_LOCATIONS.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : padarias.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma padaria encontrada nesta localização.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {padarias.map((padaria) => (
              <Card key={padaria.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-bread-crust">{padaria.nome_padaria}</CardTitle>
                  <CardDescription>
                    <Badge variant="outline">{padaria.localizacao}</Badge>
                    <br />
                    {padaria.endereco}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3">PRODUTOS DISPONÍVEIS</h4>
                    {padaria.produtos?.filter(p => p.disponivel).map((produto) => (
                      <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium">{produto.nome_produto}</h5>
                          <p className="text-sm text-muted-foreground">{produto.tipo_pao}</p>
                          <p className="font-semibold text-bread-crust">{produto.preco.toFixed(2)} MT</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getItemQuantity(produto.id) > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const currentQty = getItemQuantity(produto.id);
                                  if (currentQty > 1) {
                                    addItem({ ...produto, padaria_id: padaria.id, padaria_nome: padaria.nome_padaria, quantidade: -1 });
                                  }
                                }}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{getItemQuantity(produto.id)}</span>
                              <Button 
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleAddToCart(produto, padaria)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleAddToCart(produto, padaria)}
                              disabled={produto.estoque_atual === 0}
                            >
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Pedidos;