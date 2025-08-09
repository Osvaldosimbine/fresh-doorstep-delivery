import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

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
  const handleDecrease = () => {
    if (quantity > 1) {
      onAddToCart({ ...produto, quantidade: -1 } as any, padaria);
    }
  };

  const handleIncrease = () => {
    onAddToCart(produto, padaria);
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:border-bread-golden transition-colors duration-200">
      <div className="flex-1 space-y-1">
        <h5 className="font-medium text-card-foreground">{produto.nome_produto}</h5>
        <p className="text-sm text-muted-foreground">{produto.tipo_pao}</p>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-bread-crust">{produto.preco.toFixed(2)} MT</p>
          {produto.estoque_atual <= 5 && produto.estoque_atual > 0 && (
            <span className="text-xs text-destructive font-medium">
              Estoque baixo ({produto.estoque_atual})
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {quantity > 0 ? (
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
            >
              <Plus className="h-4 w-4" />
            </Button>
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
    </div>
  );
};

export default PedidosProductCard;