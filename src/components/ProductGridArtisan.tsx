import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCardArtisan from "./ProductCardArtisan";
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

const ProductGridArtisan = () => {
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
        .limit(8);

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

  // Define card size pattern for asymmetric layout
  const getCardVariant = (index: number): 'small' | 'medium' | 'large' => {
    const patterns: ('small' | 'medium' | 'large')[] = ['large', 'small', 'medium', 'small', 'medium', 'large', 'small', 'medium'];
    return patterns[index % patterns.length];
  };

  const getCardOrientation = (index: number): 'vertical' | 'horizontal' | 'square' => {
    const orientations: ('vertical' | 'horizontal' | 'square')[] = ['vertical', 'horizontal', 'vertical', 'square', 'vertical', 'horizontal', 'square', 'vertical'];
    return orientations[index % orientations.length];
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-warm relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-bread-golden/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-bread-crust/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-bread-crust mb-4">
              Vitrine Artesanal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Carregando nossa seleção especial...
            </p>
          </div>
          
          <div className="bakery-window-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`bakery-card-${getCardVariant(i)} animate-pulse`}>
                <div className="bg-card rounded-2xl p-6 h-full">
                  <div className="h-32 bg-muted rounded-xl mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-warm relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-bread-golden/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-bread-crust/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      {/* Breadcrumb trail decoration */}
      <svg className="absolute top-1/2 left-1/4 w-8 h-8 text-bread-golden/20 animate-bread-bounce" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <circle cx="6" cy="6" r="2"/>
        <circle cx="18" cy="18" r="2"/>
        <circle cx="6" cy="18" r="1.5"/>
        <circle cx="18" cy="6" r="1.5"/>
      </svg>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-bread-crust mb-4">
            Vitrine Artesanal
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma curadoria especial dos melhores pães de Maputo, 
            apresentada numa vitrine única como numa padaria tradicional.
          </p>
        </div>

        <div className="bakery-window-grid">
          {produtos.map((produto, index) => (
            <div 
              key={produto.id} 
              className={`bakery-card-${getCardVariant(index)} animate-slide-up`}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <ProductCardArtisan 
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
                variant={getCardVariant(index)}
                orientation={getCardOrientation(index)}
              />
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="relative inline-block">
            <Link to="/pedidos">
              <Button size="lg" className="mb-4 shadow-button-custom hover:shadow-warm transition-all duration-300 transform hover:scale-105">
                Explorar Toda Coleção
              </Button>
            </Link>
            {/* Decorative underline */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-primary rounded-full"></div>
          </div>
          
          <p className="text-muted-foreground mb-2 mt-6">
            Procura algo especial?
          </p>
          <p className="text-sm text-muted-foreground">
            Contacte-nos para encomendas personalizadas e sabores únicos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductGridArtisan;