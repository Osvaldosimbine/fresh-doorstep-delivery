import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, MapPin, CreditCard, TrendingDown, Truck, Clock, Calendar } from "lucide-react";
import { MAPUTO_LOCATIONS } from "@/constants/locations";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getLocationCoordinates, getServiceFeeTier } from "@/lib/serviceFee";
import { isOrderTimeAllowed, getNextAvailableTime, ORDER_TIME_SLOTS } from "@/lib/timeUtils";
import PaymentConfirmationDialog from "./PaymentConfirmationDialog";

const CheckoutCart = () => {
  const { state, removeItem, updateQuantity, updateServiceFees, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [complement, setComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");

  // Update service fees when location changes
  useEffect(() => {
    if (selectedLocation && state.items.length > 0) {
      const coordinates = getLocationCoordinates(selectedLocation);
      if (coordinates) {
        updateServiceFees(coordinates);
      }
    }
  }, [selectedLocation, state.items.length]);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
      // Recalculate service fees if location is selected
      if (selectedLocation) {
        const coordinates = getLocationCoordinates(selectedLocation);
        if (coordinates) {
          updateServiceFees(coordinates);
        }
      }
    }
  };

  const handleCheckout = () => {
    if (state.items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione produtos ao carrinho antes de finalizar o pedido.",
        variant: "destructive"
      });
      return;
    }

    setShowPaymentDialog(true);
  };

  const handleFinalizePedido = async () => {
    if (!selectedLocation || !paymentMethod || !selectedTimeSlot) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, selecione a localização, horário de entrega e forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    // Show payment confirmation dialog for mobile money
    if (["mpesa", "emola"].includes(paymentMethod)) {
      setShowPaymentDialog(true);
      return;
    }

    // For other payment methods, process directly
    await processOrder();
  };

  const processOrder = async () => {

    setIsSubmitting(true);

    try {
      // Prepare order data for secure processing
      const orderData = {
        produtos: state.items.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        })),
        endereco_entrega: `${selectedLocation}${complement ? `, ${complement}` : ''}`,
        forma_pagamento: paymentMethod as 'dinheiro' | 'cartao' | 'mbway',
        observacoes: complement,
        taxa_servico_total: state.totalServiceFee,
        localizacao_entrega: selectedLocation
      };

      // Process order through secure Edge Function with proper auth headers
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-order', {
        body: orderData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Pedido realizado com sucesso!",
          description: data.message || "Você receberá uma confirmação em breve.",
        });
        clearCart();
        
        // Navigate to order confirmation page or orders list
        setTimeout(() => {
          navigate('/order-confirmation', {
            state: {
              orderData: {
                id: data.order_id,
                produtos: state.items,
                total: state.total,
                endereco_entrega: `${selectedLocation}${complement ? `, ${complement}` : ''}`,
                forma_pagamento: paymentMethod,
                timestamp: new Date()
              }
            }
          });
        }, 2000);
      } else {
        throw new Error(data?.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Order processing error:', error);
      toast({
        title: "Erro ao processar pedido",
        description: error.message || "Tente novamente em alguns instantes.",
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
                
                <div className="space-y-1">
                  {item.economia_total > 0 && (
                    <p className="text-xs text-green-600 font-medium">
                      Economia: {item.economia_total.toFixed(2)} MT
                    </p>
                  )}
                  {item.taxa_servico_unitaria && (
                    <p className="text-xs text-orange-600 font-medium">
                      Taxa de serviço: +{item.taxa_servico_unitaria.toFixed(2)} MT/un ({item.distancia_km}km)
                    </p>
                  )}
                </div>
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
          
          {/* Detailed Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo dos pães:</span>
              <span>{(state.total - state.totalServiceFee - (state.items.reduce((sum, item) => sum + item.quantidade, 0) * 3)).toFixed(2)} MT</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de serviço (3 MT/pão):</span>
              <span>+{(state.items.reduce((sum, item) => sum + item.quantidade, 0) * 3).toFixed(2)} MT</span>
            </div>
            
            {state.totalSavings > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <TrendingDown className="h-4 w-4" />
                  <span className="font-semibold text-sm">Desconto por Volume (50+ pães)</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Preço original:</span>
                    <span className="line-through">{state.originalTotal.toFixed(2)} MT</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">Desconto aplicado:</span>
                    <span className="text-green-600 font-semibold">-{state.totalSavings.toFixed(2)} MT</span>
                  </div>
                </div>
              </div>
            )}
            
            {state.totalServiceFee > 0 && selectedLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <Truck className="h-4 w-4" />
                  <span className="font-semibold text-sm">Taxa de Mobilidade</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {state.items[0]?.distancia_km && getServiceFeeTier(state.items[0].distancia_km)}
                    </span>
                    <span className="text-blue-600 font-semibold">+{state.totalServiceFee.toFixed(2)} MT</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
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
          <CardTitle className="flex items-center gap-2 text-bread-crust">
            <Clock className="h-5 w-5" />
            Horário de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOrderTimeAllowed() && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Fora do horário de funcionamento.</strong> Seu pedido será agendado para: {getNextAvailableTime()}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="time-slot">Selecione o horário desejado</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Escolha um horário" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {ORDER_TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.start} value={slot.label}>
                    {slot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600">
              Seu pedido ficará em espera até o horário selecionado
            </p>
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
      
      <PaymentConfirmationDialog
        isOpen={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onConfirm={() => {
          setShowPaymentDialog(false);
          processOrder();
        }}
        paymentMethod={paymentMethod}
        amount={state.total}
      />
    </div>
  );
};

export default CheckoutCart;