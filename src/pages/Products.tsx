import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGridArtisan from "@/components/ProductGridArtisan";

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ProductGridArtisan />
      </main>
      <Footer />
    </div>
  );
};

export default Products;