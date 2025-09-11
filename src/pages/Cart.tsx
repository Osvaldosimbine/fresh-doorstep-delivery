import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Minus, ShoppingCart, Clock } from 'lucide-react';
import { ORDER_TIME_SLOTS, isOrderTimeAllowed, getNextAvailableTime } from '@/lib/timeUtils';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotal, getTotalSavings, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (!selectedTime) {
      toast({
        title: "Horário não selecionado",
        description: "Por favor, selecione um horário para entrega.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Simulate order creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Pedido realizado com sucesso!",
        description: `Seu pedido foi agendado para ${selectedTime}.`,
      });
      
      clearCart();
      navigate('/order-confirmation');
    } catch (error) {
      toast({
        title: "Erro ao processar pedido",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-bread-crust mb-2">Seu carrinho está vazio</h1>
            <p className="text-muted-foreground mb-6">Adicione alguns produtos deliciosos!</p>
            <Button onClick={() => navigate('/products')}>
              Ver Produtos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const total = getTotal();
  const savings = getTotalSavings();
  const isTimeAllowed = isOrderTimeAllowed();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-bread-crust mb-6">Seu Carrinho</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.nome_produto}</h3>
                      <p className="text-sm text-muted-foreground">Padaria: {item.padaria}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {item.preco_original && item.preco_original > item.preco && (
                          <span className="text-sm text-muted-foreground line-through">
                            {item.preco_original.toFixed(2)} MT
                          </span>
                        )}
                        <span className="font-semibold">{item.preco.toFixed(2)} MT</span>
                        {item.desconto_aplicado && item.desconto_aplicado > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            -{item.desconto_aplicado.toFixed(2)} MT
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantidade - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantidade}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantidade + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Subtotal: {(item.preco * item.quantidade).toFixed(2)} MT
                    </span>
                    {item.economia_total && item.economia_total > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Economia: {item.economia_total.toFixed(2)} MT
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total dos produtos:</span>
                    <span>{total.toFixed(2)} MT</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total economizado:</span>
                      <span>-{savings.toFixed(2)} MT</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total final:</span>
                      <span>{total.toFixed(2)} MT</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time-slot">Horário de entrega</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot.start} value={slot.label}>
                          {slot.label}
                        </SelectItem>
                      ))}
                      {!isTimeAllowed && (
                        <SelectItem value="next-available">
                          {getNextAvailableTime()}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {!isTimeAllowed && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <p className="text-sm text-yellow-700">
                      Fora do horário de entregas. Seu pedido será processado no próximo horário disponível.
                    </p>
                  </div>
                )}
                
                <Button 
                  onClick={handleCheckout}
                  disabled={loading || !selectedTime}
                  className="w-full"
                >
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;