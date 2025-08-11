import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Star, Receipt, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReceiptGenerator from "@/components/ReceiptGenerator";
import { useToast } from "@/hooks/use-toast";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const { produto, quantity, location: deliveryLocation, discountInfo } = location.state || {};

  if (!produto || !quantity || !deliveryLocation) {
    navigate("/");
    return null;
  }

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call to create order
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOrderConfirmed(true);
      
      toast({
        title: "Pedido confirmado!",
        description: "Entregadores próximos foram notificados",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar pedido. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = discountInfo.discountedPrice * quantity;
  const orderData = {
    id: `ORD-${Date.now()}`,
    produto,
    quantity,
    location: deliveryLocation,
    total,
    discountInfo,
    timestamp: new Date()
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-bread-crust mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-lg text-muted-foreground">
                Entregadores próximos foram notificados
              </p>
            </div>

            <ReceiptGenerator orderData={orderData} />

            <div className="mt-8 space-y-4">
              <Button 
                onClick={() => navigate("/")}
                className="w-full"
              >
                Fazer Novo Pedido
              </Button>
              <Button 
                onClick={() => navigate("/order-tracking", { state: { orderId: orderData.id }})}
                variant="outline"
                className="w-full"
              >
                Acompanhar Entrega
              </Button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Receipt className="mx-auto h-12 w-12 text-bread-golden mb-4" />
            <h1 className="text-3xl font-bold text-bread-crust mb-2">
              Confirmar Encomenda
            </h1>
            <p className="text-lg text-muted-foreground">
              Revise os detalhes antes de finalizar
            </p>
          </div>

          <div className="space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={produto.imagem_url || "/placeholder.svg"}
                    alt={produto.nome_produto}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{produto.nome_produto}</h3>
                    <p className="text-muted-foreground">{produto.tipo_pao}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{produto.padarias.nome_padaria}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">4.5</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Local de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{deliveryLocation.address}</p>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Quantidade:</span>
                  <span className="font-semibold">{quantity} {quantity === 1 ? 'pão' : 'pães'}</span>
                </div>
                
                {discountInfo.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Preço original (cada):</span>
                      <span className="line-through text-muted-foreground">
                        {produto.preco.toFixed(2)} MT
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Preço com desconto (cada):</span>
                      <span className="font-semibold text-green-600">
                        {discountInfo.discountedPrice.toFixed(2)} MT
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Economia total:</span>
                      <span className="font-semibold text-green-600">
                        -{discountInfo.totalSavings.toFixed(2)} MT
                      </span>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total a pagar:</span>
                  <span className="text-bread-crust">{total.toFixed(2)} MT</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tempo de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Estimativa: 30-45 minutos após aceite do entregador
                </p>
              </CardContent>
            </Card>

            {/* Confirm Button */}
            <Button
              onClick={handleConfirmOrder}
              disabled={isSubmitting}
              className="w-full h-12 text-lg bg-bread-golden hover:bg-bread-crust"
            >
              {isSubmitting ? "Processando..." : `Confirmar Pedido - ${total.toFixed(2)} MT`}
            </Button>

            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;