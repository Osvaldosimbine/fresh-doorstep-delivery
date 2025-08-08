import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import HowItWorks from "@/components/HowItWorks";
import JoinUs from "@/components/JoinUs";
import DownloadApp from "@/components/DownloadApp";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <HowItWorks />
        <JoinUs />
        <DownloadApp />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
