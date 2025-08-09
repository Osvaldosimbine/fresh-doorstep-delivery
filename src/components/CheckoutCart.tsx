import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, MapPin, CreditCard } from "lucide-react";
import { MAPUTO_LOCATIONS } from "@/constants/locations";

const CheckoutCart = () => {
  const { state, removeItem, updateQuantity, clearCart } = useCart();
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [complement, setComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleFinalizePedido = () => {
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

    // Aqui seria implementada a lógica de finalização do pedido
    toast({
      title: "Pedido enviado!",
      description: "Seu pedido foi enviado para a padaria. Você receberá uma confirmação em breve.",
    });
    
    clearCart();
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
                <p className="text-sm text-muted-foreground">{item.padaria_nome}</p>
                <p className="text-sm font-semibold text-bread-crust">{item.preco.toFixed(2)} MT</p>
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
          
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total:</span>
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
      >
        Finalizar Pedido - {state.total.toFixed(2)} MT
      </Button>
    </div>
  );
};

export default CheckoutCart;