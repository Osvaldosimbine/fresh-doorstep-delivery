import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBread from "@/assets/hero-bread.jpg";
import UserTypeSelector from "@/components/UserTypeSelector";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  const handleAuthenticatedCTA = () => {
    switch (userProfile?.role) {
      case 'padaria':
        navigate('/padaria/dashboard');
        break;
      case 'entregador':
        navigate('/entregador/dashboard');
        break;
      default:
        navigate('/fazer-pedido');
    }
  };

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBread})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-hero"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-slide-up">
            Pão fresco direto da 
            <br />
            <span className="text-primary-glow">padaria para sua casa</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
            Conecte-se às melhores padarias da cidade e receba pão fresquinho, quentinho e crocante diretamente na sua porta.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{animationDelay: '0.4s'}}>
            {user ? (
              <Button size="lg" className="text-lg px-8 py-4 shadow-button-custom hover:scale-105 transition-transform" onClick={handleAuthenticatedCTA}>
                {userProfile?.role === 'padaria' ? 'Ir para o Painel' : userProfile?.role === 'entregador' ? 'Ir para o Dashboard' : 'Fazer Pedido'}
              </Button>
            ) : (
              <UserTypeSelector>
                <Button size="lg" className="text-lg px-8 py-4 shadow-button-custom hover:scale-105 transition-transform">
                  Quero Experimentar
                </Button>
              </UserTypeSelector>
            )}
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="h-6 w-6 text-white/70" />
      </div>
    </section>
  );
};

export default Hero;