import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";

const Products = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !userProfile) return;

    if (userProfile.role === "padaria") {
      navigate("/padaria/dashboard", { replace: true });
    }

    if (userProfile.role === "entregador") {
      navigate("/entregador/dashboard", { replace: true });
    }
  }, [loading, navigate, userProfile]);

  if (loading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userProfile?.role === "padaria" || userProfile?.role === "entregador") {
    return null;
  }

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