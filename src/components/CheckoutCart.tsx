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
import { Trash2, MapPin, CreditCard, TrendingDown, Truck, Clock, Calendar, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getServiceFeeTier } from "@/lib/serviceFee";
import { isOrderTimeAllowed, getNextAvailableTime, getAvailableDeliveryDates, getTimeSlotsForDate, buildScheduledTime } from "@/lib/timeUtils";
import PaymentConfirmationDialog from "./PaymentConfirmationDialog";
import MapboxAddressInput, { type AddressResult } from "@/components/MapboxAddressInput";

const CheckoutCart = () => {
  const { state, removeItem, updateQuantity, updateServiceFees, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [complement, setComplement] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");

  const deliveryDates = getAvailableDeliveryDates();
  const availableSlots = selectedDate ? getTimeSlotsForDate(selectedDate) : [];

  // Update service fees when location changes
  useEffect(() => {
    if (selectedCoordinates && state.items.length > 0) {
      updateServiceFees(selectedCoordinates);
    }
  }, [selectedCoordinates, state.items.length]);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
      if (selectedCoordinates) {
        updateServiceFees(selectedCoordinates);
      }
    }
  };

  const handleAddressSelected = (result: AddressResult) => {
    setSelectedLocation(result.address);
    setSelectedCoordinates(result.coordinates);
  };

  const validateFields = (): boolean => {
    if (state.items.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione produtos antes de finalizar.", variant: "destructive" });
      return false;
    }
    if (!selectedLocation) {
      toast({ title: "Localização obrigatória", description: "Selecione ou detecte a sua localização.", variant: "destructive" });
      return false;
    }
    if (!paymentMethod) {
      toast({ title: "Pagamento obrigatório", description: "Selecione a forma de pagamento.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFinalizePedido = () => {
    if (!validateFields()) return;
    setShowPaymentDialog(true);
  };

  const processOrder = async () => {
    setIsSubmitting(true);

    try {
      let horarioAgendado: string | null = null;
      if (selectedDate && selectedTimeSlot && selectedTimeSlot !== "assim_que_possivel") {
        // Find slot start time from label
        const slot = availableSlots.find(s => s.label === selectedTimeSlot);
        if (slot) {
          horarioAgendado = buildScheduledTime(selectedDate, slot.start);
        }
      }

      const orderData = {
        produtos: state.items.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        })),
        endereco_entrega: `${selectedLocation}${complement ? `, ${complement}` : ''}`,
        forma_pagamento: paymentMethod as 'dinheiro' | 'mpesa' | 'emola' | 'mkesh',
        observacoes: complement,
        taxa_servico_total: state.totalServiceFee,
        localizacao_entrega: selectedLocation,
        horario_agendado: horarioAgendado,
      };

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast({ title: "Sessão expirada", description: "Por favor, faça login novamente.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('process-order', {
        body: orderData,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data?.success) {
        // Navigate to confirmation page with order data
        const confirmationData = {
          orderId: data.order_id,
          items: state.items,
          total: state.total,
          totalSavings: state.totalSavings,
          totalServiceFee: state.totalServiceFee,
          paymentMethod,
          location: selectedLocation,
          complement,
          horarioAgendado,
          timestamp: new Date().toISOString(),
        };
        
        clearCart();
        navigate('/order-confirmation', { state: confirmationData });
      } else {
        throw new Error(data?.error || 'Erro desconhecido');
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
          <Button onClick={() => navigate('/fazer-pedido')} className="mt-4">
            Ver Produtos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Items */}
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
                      <span className="text-xs text-muted-foreground line-through">{item.preco_original.toFixed(2)} MT</span>
                      <p className="text-sm font-semibold text-bread-crust">{item.preco.toFixed(2)} MT</p>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">-{item.desconto_aplicado.toFixed(1)} MT</Badge>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-bread-crust">{item.preco.toFixed(2)} MT</p>
                  )}
                </div>
                <div className="space-y-1">
                  {item.economia_total > 0 && (
                    <p className="text-xs text-green-600 font-medium">Economia: {item.economia_total.toFixed(2)} MT</p>
                  )}
                  {item.taxa_servico_unitaria && (
                    <p className="text-xs text-orange-600 font-medium">Taxa de serviço: +{item.taxa_servico_unitaria.toFixed(2)} MT/un ({item.distancia_km}km)</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}>-</Button>
                <span className="w-8 text-center font-medium">{item.quantidade}</span>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}>+</Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Separator />
          
          {/* Breakdown */}
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
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço original:</span>
                  <span className="line-through">{state.originalTotal.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-medium">Desconto aplicado:</span>
                  <span className="text-green-600 font-semibold">-{state.totalSavings.toFixed(2)} MT</span>
                </div>
              </div>
            )}
            
            {state.totalServiceFee > 0 && selectedLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-blue-700">
                  <Truck className="h-4 w-4" />
                  <span className="font-semibold text-sm">Taxa de Mobilidade</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {state.items[0]?.distancia_km && getServiceFeeTier(state.items[0].distancia_km)}
                  </span>
                  <span className="text-blue-600 font-semibold">+{state.totalServiceFee.toFixed(2)} MT</span>
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

      {/* Location with Mapbox Autocomplete */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bread-crust">
            <MapPin className="h-5 w-5" />
            Endereço de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endereço de entrega</Label>
            <MapboxAddressInput
              value={selectedLocation}
              onChange={handleAddressSelected}
              placeholder="Digite o endereço ou use GPS"
            />
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

      {/* Scheduling with Date + Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-bread-crust">
            <Clock className="h-5 w-5" />
            Data e Horário de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOrderTimeAllowed() && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Fora do horário de funcionamento.</strong> Próximo horário: {getNextAvailableTime()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Data de entrega</Label>
            <Select value={selectedDate} onValueChange={(v) => { setSelectedDate(v); setSelectedTimeSlot(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a data" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {deliveryDates.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Horário de entrega</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot} disabled={!selectedDate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={selectedDate ? "Selecione o horário" : "Selecione a data primeiro"} />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="assim_que_possivel">Entregar assim que possível</SelectItem>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot.start} value={slot.label}>{slot.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600">
              {selectedTimeSlot && selectedTimeSlot !== "assim_que_possivel"
                ? `Pedido agendado para ${deliveryDates.find(d => d.value === selectedDate)?.label || selectedDate} - ${selectedTimeSlot}`
                : "O pedido será processado assim que possível"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
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
              <SelectItem value="mkesh">Mkesh</SelectItem>
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
