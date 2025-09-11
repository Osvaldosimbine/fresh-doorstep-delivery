import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-bread-crust mb-2">Nossos Produtos</h1>
          <p className="text-muted-foreground">Descubra os melhores pães artesanais de Maputo</p>
        </div>
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Products;