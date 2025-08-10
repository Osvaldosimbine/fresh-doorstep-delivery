import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { calculateBulkDiscount, getDiscountTier } from "@/lib/discount";
import { getCurrentTimeSlot } from "@/lib/timeUtils";
import { useToast } from "@/hooks/use-toast";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
}

interface Padaria {
  id: string;
  nome_padaria: string;
  endereco: string;
  localizacao: string;
}

interface OrderConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  produto: Produto;
  padaria: Padaria;
  quantity: number;
  onConfirm: () => void;
}

const OrderConfirmationDialog = ({
  isOpen,
  onClose,
  produto,
  padaria,
  quantity,
  onConfirm
}: OrderConfirmationDialogProps) => {
  const [observacoes, setObservacoes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const discountInfo = calculateBulkDiscount(produto.preco, quantity);
  const currentTimeSlot = getCurrentTimeSlot();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Here you would normally save the order to the database
      onConfirm();
      toast({
        title: "Encomenda confirmada!",
        description: `Sua encomenda de ${quantity} ${produto.nome_produto} foi registrada.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar a encomenda. Tente novamente.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Encomenda</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border">
            <h4 className="font-semibold mb-2">{produto.nome_produto}</h4>
            <p className="text-sm text-muted-foreground mb-2">{padaria.nome_padaria}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Quantidade:</span>
                <span className="font-medium">{quantity} unidades</span>
              </div>
              
              <div className="flex justify-between">
                <span>Preço original:</span>
                <span className="line-through text-muted-foreground">
                  {(produto.preco * quantity).toFixed(2)} MT
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Preço com desconto:</span>
                <span className="font-semibold text-green-600">
                  {(discountInfo.discountedPrice * quantity).toFixed(2)} MT
                </span>
              </div>
              
              <div className="flex justify-between text-green-600">
                <span>Economia total:</span>
                <span className="font-semibold">
                  {discountInfo.totalSavings.toFixed(2)} MT
                </span>
              </div>
              
              <Badge variant="secondary" className="w-full justify-center">
                {getDiscountTier(quantity)}
              </Badge>
            </div>
          </div>

          {currentTimeSlot && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Horário atual:</strong> {currentTimeSlot.label}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações sobre a encomenda..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Confirmando..." : "Confirmar Encomenda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderConfirmationDialog;