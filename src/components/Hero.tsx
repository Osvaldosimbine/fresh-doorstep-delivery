import { Button } from "@/components/ui/button";
import { Clock, MapPin, Star } from "lucide-react";
import heroImage from "@/assets/hero-bread.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center text-white">
        <div className="max-w-4xl mx-auto animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Pão Fresco
            <span className="block text-primary-glow">Na Sua Porta</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Entregamos pão fresco das melhores padarias de Maputo. 
            Mesmo preço, máxima conveniência.
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="h-5 w-5 text-primary-glow" />
              <span className="text-sm font-medium">Entrega em 30min</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <MapPin className="h-5 w-5 text-primary-glow" />
              <span className="text-sm font-medium">Todo Maputo</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Star className="h-5 w-5 text-primary-glow" />
              <span className="text-sm font-medium">Melhor Qualidade</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" className="text-lg px-8 py-4">
              Fazer Pedido Agora
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
              Ver Produtos
            </Button>
          </div>

          <p className="mt-6 text-white/80 text-sm">
            🍞 Mais de <strong>82 padarias</strong> parceiras em Maputo
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;