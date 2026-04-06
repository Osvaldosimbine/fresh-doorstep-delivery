import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import HowItWorks from "@/components/HowItWorks";
import JoinUs from "@/components/JoinUs";
import DownloadApp from "@/components/DownloadApp";
import Footer from "@/components/Footer";

const Index = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === 'entregador') {
        navigate('/entregador/dashboard', { replace: true });
      } else if (userProfile.role === 'padaria') {
        navigate('/padaria/dashboard', { replace: true });
      }
    }
  }, [userProfile, loading, navigate]);

  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
