import { Card, CardContent } from "@/components/ui/card";
import { Search, ShoppingCart, Truck } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Escolha a padaria",
    description: "Navegue pelas melhores padarias da sua região e encontre seus pães favoritos.",
    color: "text-bread-golden"
  },
  {
    icon: ShoppingCart,
    title: "Faça o pedido",
    description: "Selecione os pães desejados, adicione ao carrinho e finalize seu pedido.",
    color: "text-delivery-green"
  },
  {
    icon: Truck,
    title: "Receba em casa",
    description: "Relaxe enquanto entregamos pão fresco e quentinho na sua porta em minutos.",
    color: "text-bread-crust"
  }
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-bread-crust mb-4">
            Como Funciona
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 3 passos simples, você tem pão fresco na sua mesa
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <Card className="relative border-none bg-white/80 backdrop-blur shadow-card-custom hover:shadow-warm transition-all duration-300 group-hover:-translate-y-2">
                <CardContent className="p-8">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className={`mb-6 flex justify-center`}>
                    <step.icon className={`h-12 w-12 ${step.color}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-semibold text-bread-crust mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>

              {/* Connector Arrow (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-primary/30"></div>
                  <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-0 h-0 border-l-4 border-l-primary/30 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;