import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentMethod: string;
  amount: number;
}

const PaymentConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paymentMethod, 
  amount 
}: PaymentConfirmationDialogProps) => {
  const [pin, setPin] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConfirmPayment = async () => {
    if (["mpesa", "emola"].includes(paymentMethod) && !pin) {
      toast({
        title: "PIN obrigatório",
        description: "Por favor, insira seu PIN para confirmar o pagamento.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Pagamento confirmado!",
        description: `Pagamento de ${amount.toFixed(2)} MT processado com sucesso.`,
      });
      
      onConfirm();
    } catch (error) {
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case "mpesa":
      case "emola":
        return <Smartphone className="h-6 w-6 text-green-600" />;
      case "cartao":
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      default:
        return <CreditCard className="h-6 w-6" />;
    }
  };

  const getPaymentMethodName = () => {
    switch (paymentMethod) {
      case "mpesa":
        return "M-Pesa";
      case "emola":
        return "E-Mola";
      case "cartao":
        return "Cartão";
      case "dinheiro":
        return "Dinheiro";
      default:
        return paymentMethod;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getPaymentIcon()}
            Confirmar Pagamento - {getPaymentMethodName()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-bread-crust">
              {amount.toFixed(2)} MT
            </div>
            <p className="text-muted-foreground">
              Valor a ser pago via {getPaymentMethodName()}
            </p>
          </div>

          {["mpesa", "emola"].includes(paymentMethod) && (
            <div className="space-y-2">
              <Label htmlFor="pin">PIN do {getPaymentMethodName()}</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="Digite seu PIN de 4 dígitos"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-center text-lg tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Digite o PIN associado à sua conta {getPaymentMethodName()}
              </p>
            </div>
          )}

          {paymentMethod === "dinheiro" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Pagamento em dinheiro:</strong> O entregador receberá o valor no momento da entrega.
                Tenha o valor exato disponível.
              </p>
            </div>
          )}

          {paymentMethod === "cartao" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Pagamento por cartão:</strong> Você será redirecionado para o gateway de pagamento seguro.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              className="flex-1 bg-bread-golden hover:bg-bread-crust"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Pagamento"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationDialog;