import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Products;