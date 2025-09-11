import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, MapPin, CreditCard, TrendingDown } from "lucide-react";
import { MAPUTO_LOCATIONS } from "@/constants/locations";
import { Badge } from "@/components/ui/badge";

const CheckoutCart = () => {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [complement, setComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleFinalizePedido = async () => {
    if (!selectedLocation) {
      toast({
        title: "Endereço necessário",
        description: "Por favor, selecione uma localização para entrega",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Forma de pagamento necessária",
        description: "Por favor, selecione uma forma de pagamento",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Aqui seria implementada a lógica de finalização do pedido
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular API call
      
      toast({
        title: "Pedido enviado!",
        description: "Seu pedido foi enviado para a padaria. Você receberá uma confirmação em breve.",
      });
      
      clearCart();
    } catch (error) {
      toast({
        title: "Erro ao enviar pedido",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Seu carrinho está vazio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bread-crust">
            <CreditCard className="h-5 w-5" />
            Seu Pedido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {state.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-card-foreground">{item.nome_produto}</h4>
                <p className="text-sm text-muted-foreground">{item.padaria}</p>
                <div className="flex items-center gap-2">
                  {item.desconto_aplicado > 0 ? (
                    <>
                      <span className="text-xs text-muted-foreground line-through">
                        {item.preco_original.toFixed(2)} MT
                      </span>
                      <p className="text-sm font-semibold text-bread-crust">
                        {item.preco.toFixed(2)} MT
                      </p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        -{item.desconto_aplicado.toFixed(1)} MT
                      </Badge>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-bread-crust">{item.preco.toFixed(2)} MT</p>
                  )}
                </div>
                {item.economia_total > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Economia: {item.economia_total.toFixed(2)} MT
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">{item.quantidade}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}
                >
                  +
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Separator />
          
          {state.totalSavings > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold text-sm">Desconto por Quantidade Aplicado!</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal original:</span>
                  <span className="line-through">{state.originalTotal.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Economia total:</span>
                  <span className="text-green-600 font-semibold">-{state.totalSavings.toFixed(2)} MT</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total a pagar:</span>
            <span className="text-bread-crust">{state.total.toFixed(2)} MT</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bread-crust">
            <MapPin className="h-5 w-5" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Localização</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione sua localização" />
              </SelectTrigger>
              <SelectContent>
                {MAPUTO_LOCATIONS.map((location) => (
                  <SelectItem key={location.value} value={location.value}>
                    {location.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="complement">Complemento (rua, número, apartamento)</Label>
            <Input
              id="complement"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Ex: Rua da Paz, 123, Apt 4B"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-bread-crust">Forma de Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma de pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="emola">E-Mola</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button 
        className="w-full bg-bread-golden hover:bg-bread-crust"
        onClick={handleFinalizePedido}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Enviando..." : `Finalizar Pedido - ${state.total.toFixed(2)} MT`}
      </Button>
    </div>
  );
};

export default CheckoutCart;