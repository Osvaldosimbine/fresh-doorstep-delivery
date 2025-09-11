import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    nome_produto: string;
    preco: number;
    tipo_pao?: string;
    imagem_url?: string;
    padaria?: {
      nome_padaria: string;
      localizacao?: string;
    };
    disponivel: boolean;
    estoque_atual: number;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleAddToCart = () => {
    if (!user) {
      navigate('/register');
      return;
    }
    
    addToCart({
      id: product.id,
      nome_produto: product.nome_produto,
      preco: product.preco,
      padaria: product.padaria?.nome_padaria || 'Padaria',
    });
    
    toast({
      title: "Produto adicionado!",
      description: `${product.nome_produto} foi adicionado ao carrinho.`,
    });
  };

  return (
    <Card className="group hover:shadow-card-custom transition-all duration-300 hover:-translate-y-1 bg-gradient-warm border-border/50">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-md">
          <img 
            src={product.imagem_url || "/placeholder.svg"} 
            alt={product.nome_produto}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!product.disponivel && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Esgotado</Badge>
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-bread-crust mb-1">{product.nome_produto}</h3>
          <p className="text-sm text-muted-foreground mb-2">{product.tipo_pao || 'Pão artesanal'}</p>
          
          {product.padaria && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3" />
              <span>{product.padaria.nome_padaria}</span>
              {product.padaria.localizacao && (
                <span>• {product.padaria.localizacao}</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-primary">
              {product.preco.toFixed(2)} MT
            </div>
            <Badge variant="secondary" className="text-xs">
              Entrega incluída
            </Badge>
          </div>
          
          <div className="flex justify-between items-center gap-2">
            <Link to={`/product/${product.id}`}>
              <Button variant="outline" size="sm">
                Ver Detalhes
              </Button>
            </Link>
            <Button 
              onClick={handleAddToCart}
              size="sm" 
              className="flex items-center gap-1"
              disabled={!product.disponivel}
            >
              <ShoppingCart className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;