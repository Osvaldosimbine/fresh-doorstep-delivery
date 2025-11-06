import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";
import { calculateBulkDiscount, getDiscountTier } from "@/lib/discount";
import OrderConfirmationDialog from "@/components/OrderConfirmationDialog";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  estoque_atual: number;
  disponivel: boolean;
}

interface Padaria {
  id: string;
  nome_padaria: string;
  endereco: string;
  localizacao: string;
  produtos: Produto[];
}

interface PedidosProductCardProps {
  produto: Produto;
  padaria: Padaria;
  onAddToCart: (produto: Produto, padaria: Padaria) => void;
  quantity: number;
}

const PedidosProductCard = ({ produto, padaria, onAddToCart, quantity }: PedidosProductCardProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDecrease = () => {
    if (quantity > 0) {
      onAddToCart({ ...produto, quantidade: -1 } as any, padaria);
    }
  };

  const handleIncrease = () => {
    onAddToCart(produto, padaria);
  };

  const handleConfirmOrder = () => {
    onAddToCart(produto, padaria);
    setShowConfirmDialog(false);
  };

  // Calculate discount for current quantity
  const discountInfo = quantity > 0 ? calculateBulkDiscount(produto.preco, quantity) : null;

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:border-bread-golden transition-colors duration-200">
      <div className="flex-1 space-y-1">
        <h5 className="font-medium text-card-foreground">{produto.nome_produto}</h5>
        <p className="text-sm text-muted-foreground">{produto.tipo_pao}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {discountInfo ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">
                  {produto.preco.toFixed(2)} MT
                </span>
                <p className="font-semibold text-bread-crust">
                  {discountInfo.discountedPrice.toFixed(2)} MT
                </p>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  -{discountInfo.discountAmount.toFixed(1)} MT
                </Badge>
              </div>
            ) : (
              <p className="font-semibold text-bread-crust">{produto.preco.toFixed(2)} MT</p>
            )}
            {produto.estoque_atual <= 5 && produto.estoque_atual > 0 && (
              <span className="text-xs text-destructive font-medium">
                Estoque baixo ({produto.estoque_atual})
              </span>
            )}
          </div>
          
          {quantity > 0 && discountInfo && (
            <div className="space-y-1">
              <p className="text-xs text-green-600 font-medium">
                Economia total: {discountInfo.totalSavings.toFixed(2)} MT
              </p>
              <p className="text-xs text-muted-foreground">
                {getDiscountTier(quantity)}
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        {quantity > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 w-8 p-0 border-bread-golden hover:bg-bread-golden hover:text-primary-foreground"
                onClick={handleDecrease}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <Button 
                size="sm"
                className="h-8 w-8 p-0 bg-bread-golden hover:bg-bread-crust"
                onClick={handleIncrease}
                disabled={produto.estoque_atual === 0}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {quantity >= 10 && (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmDialog(true)}
                className="text-xs"
              >
                Confirmar Encomenda
              </Button>
            )}
          </div>
        ) : (
          <Button 
            size="sm"
            onClick={handleIncrease}
            disabled={produto.estoque_atual === 0}
            className="bg-bread-golden hover:bg-bread-crust disabled:opacity-50"
          >
            {produto.estoque_atual === 0 ? "Esgotado" : "Adicionar"}
          </Button>
        )}
      </div>
      
      <OrderConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        produto={produto}
        padaria={padaria}
        quantity={quantity}
        onConfirm={handleConfirmOrder}
      />
    </div>
  );
};

export default PedidosProductCard;