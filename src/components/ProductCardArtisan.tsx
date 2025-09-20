import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ShoppingCart, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardArtisanProps {
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
  variant?: 'small' | 'medium' | 'large';
  orientation?: 'vertical' | 'horizontal' | 'square';
}

const ProductCardArtisan = ({ product, variant = 'medium', orientation = 'vertical' }: ProductCardArtisanProps) => {
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

  const getImageHeight = () => {
    if (orientation === 'horizontal') return 'h-24';
    if (variant === 'large') return 'h-64';
    if (variant === 'small') return 'h-32';
    return 'h-48';
  };

  const getCardClasses = () => {
    const baseClasses = "group hover:shadow-warm transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-card to-bread-cream/50 border-0 relative overflow-hidden";
    
    if (orientation === 'horizontal') {
      return cn(baseClasses, "hover:rotate-1");
    }
    
    if (variant === 'large') {
      return cn(baseClasses, "hover:-rotate-1 shadow-card-custom");
    }
    
    if (variant === 'small') {
      return cn(baseClasses, "hover:rotate-2");
    }
    
    return cn(baseClasses, "hover:-rotate-1");
  };

  const getLayoutClasses = () => {
    if (orientation === 'horizontal') {
      return "flex items-center gap-4";
    }
    return "flex flex-col";
  };

  const renderVerticalLayout = () => (
    <>
      <div className="relative overflow-hidden rounded-t-xl">
        <img 
          src={product.imagem_url || "/placeholder.svg"} 
          alt={product.nome_produto}
          className={cn(
            "w-full object-cover group-hover:scale-110 transition-transform duration-700",
            getImageHeight()
          )}
        />
        {!product.disponivel && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <Badge variant="destructive" className="animate-bread-bounce">Esgotado</Badge>
          </div>
        )}
        
        {/* Decorative corner element */}
        <div className="absolute top-3 right-3 w-8 h-8 bg-bread-golden/20 rounded-full backdrop-blur-sm border border-white/30"></div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className={cn(
            "font-bold text-bread-crust mb-1 line-clamp-2",
            variant === 'large' ? 'text-xl' : variant === 'small' ? 'text-sm' : 'text-lg'
          )}>
            {product.nome_produto}
          </h3>
          
          <p className={cn(
            "text-muted-foreground mb-3 line-clamp-1",
            variant === 'small' ? 'text-xs' : 'text-sm'
          )}>
            {product.tipo_pao || 'Pão artesanal'}
          </p>
          
          {product.padaria && (
            <div className={cn(
              "flex items-center gap-1 text-muted-foreground mb-3",
              variant === 'small' ? 'text-xs' : 'text-xs'
            )}>
              <MapPin className="h-3 w-3 text-bread-golden" />
              <span className="truncate">{product.padaria.nome_padaria}</span>
            </div>
          )}
        </div>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              "font-bold text-primary",
              variant === 'large' ? 'text-2xl' : variant === 'small' ? 'text-lg' : 'text-xl'
            )}>
              {product.preco.toFixed(2)} MT
            </div>
            {variant !== 'small' && (
              <Badge variant="secondary" className="text-xs bg-delivery-green/10 text-delivery-green border-delivery-green/20">
                Entrega grátis
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {variant === 'small' ? (
              <Button 
                onClick={handleAddToCart}
                size="sm" 
                className="w-full flex items-center justify-center gap-1 hover:bg-primary-glow transition-colors"
                disabled={!product.disponivel}
              >
                <ShoppingCart className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Link to={`/product/${product.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full hover:bg-bread-golden/10">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </Link>
                <Button 
                  onClick={handleAddToCart}
                  size="sm" 
                  className="flex-1 flex items-center justify-center gap-1 hover:shadow-button-custom transition-all"
                  disabled={!product.disponivel}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Adicionar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  const renderHorizontalLayout = () => (
    <div className={getLayoutClasses()}>
      <div className="relative overflow-hidden rounded-l-xl w-24 flex-shrink-0">
        <img 
          src={product.imagem_url || "/placeholder.svg"} 
          alt={product.nome_produto}
          className={cn("w-full object-cover group-hover:scale-110 transition-transform duration-700", getImageHeight())}
        />
        {!product.disponivel && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">Esgotado</Badge>
          </div>
        )}
      </div>
      
      <div className="flex-1 p-3 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-bread-crust mb-1 line-clamp-1">
            {product.nome_produto}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
            {product.tipo_pao || 'Pão artesanal'}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-primary">
            {product.preco.toFixed(2)} MT
          </div>
          <Button 
            onClick={handleAddToCart}
            size="sm" 
            className="p-2"
            disabled={!product.disponivel}
          >
            <ShoppingCart className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={getCardClasses()}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-bread-golden/5 pointer-events-none"></div>
      
      <CardContent className="p-0 h-full relative z-10">
        {orientation === 'horizontal' ? renderHorizontalLayout() : renderVerticalLayout()}
      </CardContent>
    </Card>
  );
};

export default ProductCardArtisan;