import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BakeryCard from "@/components/BakeryCard";
import CartSummary from "@/components/CartSummary";
import LocationFilter from "@/components/LocationFilter";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import CheckoutCart from "@/components/CheckoutCart";
import { useCart } from "@/contexts/CartContext";
import { usePadarias } from "@/hooks/usePadarias";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, X } from "lucide-react";

const FazerPedido = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCheckout, setShowCheckout] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoPaoFilter, setTipoPaoFilter] = useState("todos");
  const selectedLocation = searchParams.get("location") || "";
  const { state, addItem, getItemQuantity, updateQuantity } = useCart();
  const { toast } = useToast();
  const { padarias, loading } = usePadarias(selectedLocation);

  const filteredPadarias = useMemo(() => {
    if (!padarias) return [];
    let result = padarias;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p: any) =>
        p.nome_padaria?.toLowerCase().includes(term) ||
        p.endereco?.toLowerCase().includes(term) ||
        p.produtos?.some((prod: any) =>
          prod.nome_produto?.toLowerCase().includes(term) ||
          prod.tipo_pao?.toLowerCase().includes(term)
        )
      );
    }

    if (tipoPaoFilter !== "todos") {
      result = result.filter((p: any) =>
        p.produtos?.some((prod: any) =>
          prod.tipo_pao?.toLowerCase() === tipoPaoFilter.toLowerCase()
        )
      );
    }

    return result;
  }, [padarias, searchTerm, tipoPaoFilter]);

  const allTipos = useMemo(() => {
    if (!padarias) return [];
    const tipos = new Set<string>();
    padarias.forEach((p: any) => {
      p.produtos?.forEach((prod: any) => {
        if (prod.tipo_pao) tipos.add(prod.tipo_pao);
      });
    });
    return Array.from(tipos).sort();
  }, [padarias]);

  const handleLocationChange = (location: string) => {
    if (location) {
      setSearchParams({ location });
    } else {
      setSearchParams({});
    }
  };

  const handleAddToCart = (produto: any, padaria: any) => {
    const currentQuantity = getItemQuantity(produto.id);
    if (currentQuantity > 0) {
      updateQuantity(produto.id, currentQuantity + 1);
    } else {
      const cartItem = {
        id: produto.id,
        nome_produto: produto.nome_produto,
        preco: produto.preco,
        quantidade: 1,
        padaria: padaria.nome_padaria
      };
      addItem(cartItem);
    }
    
    toast({
      title: "Produto adicionado!",
      description: `${produto.nome_produto} adicionado ao carrinho`,
    });
  };

  if (showCheckout) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={() => setShowCheckout(false)}
              variant="outline"
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Produtos
            </Button>
            <CheckoutCart />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-bread-crust mb-4">
            Fazer Pedido
          </h1>
          <p className="text-lg text-muted-foreground">
            Escolha sua padaria favorita e faça seu pedido
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <LocationFilter
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
            />

            {/* Search and filter */}
            <div className="flex gap-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar padaria ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {allTipos.length > 0 && (
                <Select value={tipoPaoFilter} onValueChange={setTipoPaoFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Tipo de pão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tipos</SelectItem>
                    {allTipos.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : filteredPadarias.length > 0 ? (
              <div className="grid gap-6 mt-4">
                {filteredPadarias.map((padaria: any) => (
                  <BakeryCard
                    key={padaria.id}
                    padaria={padaria}
                    onAddToCart={handleAddToCart}
                    getItemQuantity={getItemQuantity}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  {searchTerm || tipoPaoFilter !== "todos"
                    ? "Nenhum resultado para a pesquisa"
                    : selectedLocation
                    ? `Nenhuma padaria encontrada em ${selectedLocation}`
                    : "Selecione uma localização para ver as padarias disponíveis"}
                </p>
                {(searchTerm || tipoPaoFilter !== "todos") && (
                  <button
                    onClick={() => { setSearchTerm(""); setTipoPaoFilter("todos"); }}
                    className="text-sm text-primary underline mt-2"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:w-80">
            <div className="sticky top-4">
              <CartSummary 
                itemCount={state.items.reduce((sum, item) => sum + item.quantidade, 0)}
                total={state.total}
              />
              {state.items.length > 0 && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-bread-golden hover:bg-bread-crust"
                  >
                    Finalizar Pedido
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FazerPedido;