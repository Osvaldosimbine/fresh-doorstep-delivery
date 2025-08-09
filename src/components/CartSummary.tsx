import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface CartSummaryProps {
  itemCount: number;
  total: number;
}

const CartSummary = ({ itemCount, total }: CartSummaryProps) => {
  if (itemCount === 0) return null;

  return (
    <Badge 
      variant="secondary" 
      className="flex items-center gap-2 bg-bread-golden text-primary-foreground hover:bg-bread-crust"
    >
      <ShoppingCart className="h-4 w-4" />
      {itemCount} {itemCount === 1 ? "item" : "itens"} - {total.toFixed(2)} MT
    </Badge>
  );
};

export default CartSummary;