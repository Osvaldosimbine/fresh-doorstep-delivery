import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingCart, Tag, Smartphone, Banknote } from 'lucide-react';

const COUPONS: Record<string, { type: 'percent' | 'fixed'; value: number; label: string }> = {
  'BREAD10': { type: 'percent', value: 10, label: '10% de desconto' },
  'PROMO5': { type: 'fixed', value: 5, label: '5 MT de desconto' },
  'BEMVINDO': { type: 'percent', value: 15, label: '15% de desconto (boas-vindas)' },
};

const Cart = () => {
  const { items, updateQuantity, removeFromCart, getTotal, getTotalSavings } = useCart();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'percent' | 'fixed'; value: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'dinheiro'>(() => {
    return (localStorage.getItem('payment_method') as any) || 'dinheiro';
  });
  const [mpesaPhone, setMpesaPhone] = useState(localStorage.getItem('payment_phone') || '');

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const coupon = COUPONS[code];
    if (!coupon) {
      setCouponError('Cupão inválido ou expirado.');
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon({ code, ...coupon });
    setCouponError('');
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handlePaymentMethodChange = (method: 'mpesa' | 'emola' | 'dinheiro') => {
    setPaymentMethod(method);
    localStorage.setItem('payment_method', method);
  };

  const handlePhoneChange = (phone: string) => {
    setMpesaPhone(phone);
    localStorage.setItem('payment_phone', phone);
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
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
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? total * (appliedCoupon.value / 100)
      : Math.min(appliedCoupon.value, total)
    : 0;
  const finalTotal = Math.max(0, total - couponDiscount);

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
          
          <div className="space-y-4">
            {/* Coupon */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Cupão de Desconto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 rounded-md px-3 py-2">
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      {appliedCoupon.code} — {appliedCoupon.label}
                    </span>
                    <button onClick={handleRemoveCoupon} className="text-xs text-destructive underline">Remover</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código do cupão"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="text-sm"
                    />
                    <Button variant="outline" size="sm" onClick={handleApplyCoupon}>
                      Aplicar
                    </Button>
                  </div>
                )}
                {couponError && <p className="text-xs text-destructive">{couponError}</p>}
              </CardContent>
            </Card>

            {/* Payment method */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(['mpesa', 'emola', 'dinheiro'] as const).map((method) => (
                  <label key={method} className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-colors ${paymentMethod === method ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => handlePaymentMethodChange(method)}
                      className="accent-primary"
                    />
                    {method === 'mpesa' && <span className="text-sm font-medium">M-Pesa</span>}
                    {method === 'emola' && <span className="text-sm font-medium">e-Mola</span>}
                    {method === 'dinheiro' && <><Banknote className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Dinheiro na Entrega</span></>}
                  </label>
                ))}
                {(paymentMethod === 'mpesa' || paymentMethod === 'emola') && (
                  <div className="pt-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">Número {paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'}</Label>
                    <Input
                      placeholder="8X XXX XXXX"
                      value={mpesaPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">O pagamento será confirmado antes da preparação.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{total.toFixed(2)} MT</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto volume:</span>
                    <span>-{savings.toFixed(2)} MT</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Cupão ({appliedCoupon!.code}):</span>
                    <span>-{couponDiscount.toFixed(2)} MT</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{finalTotal.toFixed(2)} MT</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pagamento: {paymentMethod === 'mpesa' ? 'M-Pesa' : paymentMethod === 'emola' ? 'e-Mola' : 'Dinheiro na Entrega'}
                </p>
                <Button
                  onClick={() => navigate('/fazer-pedido')}
                  className="w-full bg-bread-golden hover:bg-bread-crust"
                >
                  Ir para Checkout
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
