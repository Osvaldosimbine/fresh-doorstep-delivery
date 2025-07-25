import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Star } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  bakery: string;
  rating: number;
  inStock: boolean;
}

const ProductCard = ({ name, description, price, image, bakery, rating, inStock }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(0);

  const handleAddToCart = () => {
    setQuantity(prev => prev + 1);
  };

  const handleRemoveFromCart = () => {
    setQuantity(prev => Math.max(0, prev - 1));
  };

  return (
    <Card className="group hover:shadow-card-custom transition-all duration-300 hover:-translate-y-1 bg-gradient-warm border-border/50">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-md">
          <img 
            src={image} 
            alt={name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Esgotado</Badge>
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Badge className="bg-white/90 text-bread-crust">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {rating}
            </Badge>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-bread-crust mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{description}</p>
          <p className="text-xs text-muted-foreground mb-3">📍 {bakery}</p>
          
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary">
              {price} MT
            </div>
            <Badge variant="secondary" className="text-xs">
              Entrega incluída
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        {quantity === 0 ? (
          <Button 
            onClick={handleAddToCart}
            disabled={!inStock}
            variant="golden" 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar ao Carrinho
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Button
              onClick={handleRemoveFromCart}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-lg px-4">{quantity}</span>
            <Button
              onClick={handleAddToCart}
              variant="golden"
              size="icon"
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;