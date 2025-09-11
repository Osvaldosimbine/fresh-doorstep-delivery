import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { usePadarias } from "@/hooks/usePadarias";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BakeryCard from "@/components/BakeryCard";
import LocationFilter from "@/components/LocationFilter";
import CartSummary from "@/components/CartSummary";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import CheckoutCart from "@/components/CheckoutCart";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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
  const [selectedLocation, setSelectedLocation] = useState<string>(searchParams.get("localizacao") || "all");
  const [showCheckout, setShowCheckout] = useState(false);
  const { addItem, updateQuantity, state, getItemQuantity } = useCart();
  const { toast } = useToast();
  const { padarias, loading } = usePadarias(selectedLocation);

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    if (location === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ localizacao: location });
    }
  };

  const handleAddToCart = (produto: Produto, padaria: Padaria) => {
    const quantity = (produto as any).quantidade || 1;
    
    if (quantity < 0) {
      const currentItem = state.items.find(item => item.id === produto.id);
      if (currentItem && currentItem.quantidade > 1) {
        updateQuantity(produto.id, currentItem.quantidade - 1);
      } else if (currentItem) {
        updateQuantity(produto.id, 0);
      }
    } else {
      addItem({
        id: produto.id,
        nome_produto: produto.nome_produto,
        preco: produto.preco,
        padaria: padaria.nome_padaria,
        quantidade: quantity,
      });
      
      toast({
        title: "Adicionado ao carrinho",
        description: `${produto.nome_produto} foi adicionado ao carrinho`,
      });
    }
  };

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCheckout(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar às padarias
            </Button>
          </div>
          <CheckoutCart />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-bread-crust mb-2">Pedidos</h1>
            <p className="text-muted-foreground">Escolha uma padaria e faça o seu pedido</p>
          </div>
          
          <div className="flex items-center gap-3">
            <CartSummary itemCount={state.items.length} total={state.total} />
            {state.items.length > 0 && (
              <Button
                onClick={() => setShowCheckout(true)}
                className="bg-bread-golden hover:bg-bread-crust"
              >
                Finalizar Pedido
              </Button>
            )}
          </div>
        </div>

        <LocationFilter 
          selectedLocation={selectedLocation} 
          onLocationChange={handleLocationChange} 
        />

        {loading ? (
          <LoadingSkeleton />
        ) : padarias.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border p-8">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                Nenhuma padaria encontrada
              </h3>
              <p className="text-muted-foreground">
                Não encontramos padarias nesta localização. Tente selecionar uma área diferente.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {padarias.map((padaria) => (
              <BakeryCard
                key={padaria.id}
                padaria={padaria}
                onAddToCart={handleAddToCart}
                getItemQuantity={getItemQuantity}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Pedidos;