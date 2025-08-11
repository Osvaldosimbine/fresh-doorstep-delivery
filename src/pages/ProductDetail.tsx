import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateBulkDiscount, getDiscountTier } from "@/lib/discount";
import { isOrderTimeAllowed, getNextAvailableTime } from "@/lib/timeUtils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationSelector from "@/components/LocationSelector";
import DeliveryAreaChecker from "@/components/DeliveryAreaChecker";
import { useToast } from "@/hooks/use-toast";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  imagem_url: string;
  padaria_id: string;
  padarias: {
    nome_padaria: string;
    endereco: string;
    localizacao: string;
    coordenadas_lat: number;
    coordenadas_lng: number;
  };
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    coordinates: { lat: number; lng: number };
  } | null>(null);
  const [deliveryAllowed, setDeliveryAllowed] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);

  const isTimeAllowed = isOrderTimeAllowed();

  useEffect(() => {
    if (id) {
      fetchProduto();
    }
  }, [id]);

  const fetchProduto = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id,
          nome_produto,
          preco,
          tipo_pao,
          imagem_url,
          padaria_id,
          padarias!inner (
            nome_padaria,
            endereco,
            localizacao,
            coordenadas_lat,
            coordenadas_lng
          )
        `)
        .eq("id", id)
        .eq("disponivel", true)
        .single();

      if (error) throw error;
      setProduto(data);
    } catch (error) {
      console.error("Erro ao carregar produto:", error);
      toast({
        title: "Erro",
        description: "Produto não encontrado",
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  const handleLocationSelected = (location: { address: string; coordinates: { lat: number; lng: number }}) => {
    setSelectedLocation(location);
    setShowLocationSelector(false);
  };

  const handleProceedToOrder = () => {
    if (!selectedLocation) {
      setShowLocationSelector(true);
      return;
    }

    if (!deliveryAllowed) {
      toast({
        title: "Área não coberta",
        description: "Infelizmente não entregamos nesta localização ainda",
        variant: "destructive",
      });
      return;
    }

    if (!isTimeAllowed) {
      toast({
        title: "Fora do horário",
        description: `Pedidos aceitos apenas nos horários: ${getNextAvailableTime()}`,
        variant: "destructive",
      });
      return;
    }

    // Navigate to order confirmation with product and location data
    navigate("/order-confirmation", {
      state: {
        produto,
        quantity,
        location: selectedLocation,
        discountInfo: calculateBulkDiscount(produto!.preco, quantity)
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-lg mb-6"></div>
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-4"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
          <Button onClick={() => navigate("/")}>Voltar ao início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const discountInfo = calculateBulkDiscount(produto.preco, quantity);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="space-y-4">
            <img
              src={produto.imagem_url || "/placeholder.svg"}
              alt={produto.nome_produto}
              className="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-bread-crust mb-2">
                {produto.nome_produto}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {produto.tipo_pao}
              </p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">4.5</span>
                </div>
                <Badge variant="secondary">Disponível</Badge>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                {discountInfo.discountAmount > 0 ? (
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-bread-crust">
                        {discountInfo.discountedPrice.toFixed(2)} MT
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        {produto.preco.toFixed(2)} MT
                      </span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        -{discountInfo.discountAmount.toFixed(1)} MT
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600 font-medium">
                      Economia total: {discountInfo.totalSavings.toFixed(2)} MT
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getDiscountTier(quantity)}
                    </p>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-bread-crust">
                    {produto.preco.toFixed(2)} MT
                  </span>
                )}
              </div>
            </div>

            {/* Bakery Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Padaria de Origem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold">{produto.padarias.nome_padaria}</h3>
                  <p className="text-sm text-muted-foreground">{produto.padarias.endereco}</p>
                  <p className="text-sm text-muted-foreground">
                    📍 {produto.padarias.localizacao}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <h3 className="font-semibold">Quantidade</h3>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleQuantityChange(-1)}
                  variant="outline"
                  size="icon"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-xl w-16 text-center">{quantity}</span>
                <Button
                  onClick={() => handleQuantityChange(1)}
                  variant="outline"
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Time Status */}
            {!isTimeAllowed && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <Clock className="h-4 w-4 text-destructive" />
                <div className="text-sm">
                  <p className="text-destructive font-medium">Fora do horário de pedidos</p>
                  <p className="text-muted-foreground">
                    Próximo horário: {getNextAvailableTime()}
                  </p>
                </div>
              </div>
            )}

            {/* Location Selection */}
            {selectedLocation ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Local de entrega:</h4>
                      <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLocationSelector(true)}
                    >
                      Alterar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLocationSelector(true)}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Selecionar local de entrega
              </Button>
            )}

            {/* Delivery Area Check */}
            {selectedLocation && (
              <DeliveryAreaChecker
                userLocation={selectedLocation.coordinates}
                bakeryLocation={{
                  lat: produto.padarias.coordenadas_lat,
                  lng: produto.padarias.coordenadas_lng
                }}
                onDeliveryStatusChange={setDeliveryAllowed}
              />
            )}

            {/* Order Button */}
            <Button
              onClick={handleProceedToOrder}
              disabled={!isTimeAllowed || !selectedLocation || !deliveryAllowed}
              className="w-full h-12 text-lg bg-bread-golden hover:bg-bread-crust"
            >
              {!selectedLocation 
                ? "Selecione o local de entrega"
                : !deliveryAllowed
                  ? "Área não coberta"
                  : !isTimeAllowed
                    ? "Fora do horário"
                    : `Encomendar ${quantity} ${quantity === 1 ? 'pão' : 'pães'} - ${(discountInfo.discountedPrice * quantity).toFixed(2)} MT`
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <LocationSelector
          onLocationSelected={handleLocationSelected}
          onClose={() => setShowLocationSelector(false)}
        />
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;