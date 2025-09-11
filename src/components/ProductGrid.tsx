import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import baguetteImg from "@/assets/baguette.jpg";
import sourdoughImg from "@/assets/sourdough.jpg";
import whiteBreadImg from "@/assets/white-bread.jpg";

interface Produto {
  id: string;
  nome_produto: string;
  preco: number;
  tipo_pao: string;
  padaria_id: string;
  disponivel: boolean;
  estoque_atual: number;
  padarias: {
    nome_padaria: string;
    localizacao?: string;
  };
}

const ProductGrid = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id,
          nome_produto,
          preco,
          tipo_pao,
          padaria_id,
          disponivel,
          estoque_atual,
          padarias!inner (
            nome_padaria,
            localizacao
          )
        `)
        .eq("disponivel", true)
        .limit(6);

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getImageForType = (tipo: string) => {
    if (tipo?.toLowerCase().includes("baguete")) return baguetteImg;
    if (tipo?.toLowerCase().includes("artesanal")) return sourdoughImg;
    return whiteBreadImg;
  };

  if (loading) {
    return (
      <section id="products" className="py-20 bg-gradient-warm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-bread-crust mb-4">
              Nossos Produtos
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Carregando produtos frescos...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                <div className="h-48 bg-muted rounded mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-bread-crust mb-4">
            Nossos Produtos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Seleção especial de pães frescos das melhores padarias de Maputo. 
            Entregue na sua porta com o mesmo preço da padaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {produtos.map((produto) => (
            <ProductCard 
              key={produto.id} 
              product={{
                id: produto.id,
                nome_produto: produto.nome_produto,
                preco: produto.preco,
                tipo_pao: produto.tipo_pao,
                imagem_url: getImageForType(produto.tipo_pao),
                padaria: {
                  nome_padaria: produto.padarias.nome_padaria,
                  localizacao: produto.padarias.localizacao
                },
                disponivel: produto.disponivel,
                estoque_atual: produto.estoque_atual
              }}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/pedidos">
            <Button size="lg" className="mb-4">
              Ver Todos os Produtos
            </Button>
          </Link>
          <p className="text-muted-foreground mb-4">
            Não encontrou o que procura?
          </p>
          <p className="text-sm text-muted-foreground">
            Entre em contacto connosco para produtos especiais ou pedidos personalizados.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;