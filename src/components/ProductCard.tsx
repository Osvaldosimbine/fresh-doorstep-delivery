import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

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

const ProductCard = ({ id, name, description, price, image, bakery, rating, inStock }: ProductCardProps) => {

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
        <Link to={`/product/${id}`} className="w-full">
          <Button 
            disabled={!inStock}
            variant="golden" 
            className="w-full"
          >
            {inStock ? "Ver Detalhes" : "Esgotado"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;