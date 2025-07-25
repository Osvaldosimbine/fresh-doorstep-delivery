import ProductCard from "./ProductCard";
import baguetteImg from "@/assets/baguette.jpg";
import sourdoughImg from "@/assets/sourdough.jpg";
import whiteBreadImg from "@/assets/white-bread.jpg";

const ProductGrid = () => {
  const products = [
    {
      id: "1",
      name: "Pão Baguete",
      description: "Crocante por fora, macio por dentro. Perfeito para sanduíches.",
      price: 15,
      image: baguetteImg,
      bakery: "Padaria Central",
      rating: 4.8,
      inStock: true,
    },
    {
      id: "2", 
      name: "Pão de Forma",
      description: "Ideal para torradas e sanduíches. Fatias uniformes e macias.",
      price: 25,
      image: whiteBreadImg,
      bakery: "Padaria do Bairro",
      rating: 4.6,
      inStock: true,
    },
    {
      id: "3",
      name: "Pão Artesanal",
      description: "Massa mãe tradicional. Sabor único e textura especial.",
      price: 35,
      image: sourdoughImg,
      bakery: "Artisan Bakery",
      rating: 4.9,
      inStock: true,
    },
    {
      id: "4",
      name: "Pão Integral",
      description: "Rico em fibras e nutrientes. Opção saudável para o dia a dia.",
      price: 20,
      image: whiteBreadImg,
      bakery: "Vida Saudável",
      rating: 4.5,
      inStock: false,
    },
    {
      id: "5",
      name: "Pão Doce",
      description: "Levemente doce, perfeito para o café da manhã.",
      price: 18,
      image: baguetteImg,
      bakery: "Doce Manhã",
      rating: 4.7,
      inStock: true,
    },
    {
      id: "6",
      name: "Pão de Centeio",
      description: "Sabor marcante e textura densa. Ideal para acompanhamentos.",
      price: 30,
      image: sourdoughImg,
      bakery: "Tradição Europeia",
      rating: 4.4,
      inStock: true,
    },
  ];

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
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="text-center mt-12">
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