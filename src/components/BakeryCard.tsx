import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PedidosProductCard from "./PedidosProductCard";

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

interface BakeryCardProps {
  padaria: Padaria;
  onAddToCart: (produto: Produto, padaria: Padaria) => void;
  getItemQuantity: (productId: string) => number;
}

const BakeryCard = ({ padaria, onAddToCart, getItemQuantity }: BakeryCardProps) => {
  return (
    <Card className="hover:shadow-warm transition-all duration-300 border-border bg-card">
      <CardHeader>
        <CardTitle className="text-bread-crust">{padaria.nome_padaria}</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-bread-golden text-bread-crust">
              {padaria.localizacao}
            </Badge>
          </div>
          <div className="text-muted-foreground text-sm">{padaria.endereco}</div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3 tracking-wider">
            PRODUTOS DISPONÍVEIS
          </h4>
          <div className="space-y-3">
            {padaria.produtos?.filter(p => p.disponivel).map((produto) => (
              <PedidosProductCard
                key={produto.id}
                produto={produto}
                padaria={padaria}
                onAddToCart={onAddToCart}
                quantity={getItemQuantity(produto.id)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BakeryCard;