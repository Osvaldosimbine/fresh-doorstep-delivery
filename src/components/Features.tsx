import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Shield, CreditCard, Users, Star } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Clock,
      title: "Entrega Rápida",
      description: "Receba seu pão fresco em até 30 minutos após o pedido.",
      color: "text-delivery-green",
    },
    {
      icon: MapPin,
      title: "Cobertura Total",
      description: "Atendemos toda a cidade de Maputo e Matola.",
      color: "text-primary",
    },
    {
      icon: Shield,
      title: "Qualidade Garantida",
      description: "Parceria com as melhores padarias da região.",
      color: "text-bread-golden",
    },
    {
      icon: CreditCard,
      title: "Mesmo Preço",
      description: "Preços idênticos aos da padaria, sem taxas extras.",
      color: "text-delivery-green",
    },
    {
      icon: Users,
      title: "82 Padarias",
      description: "Rede extensa de parceiros para melhor atendimento.",
      color: "text-primary",
    },
    {
      icon: Star,
      title: "Satisfação",
      description: "Mais de 95% de satisfação dos nossos clientes.",
      color: "text-bread-golden",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-bread-crust mb-4">
            Por que escolher a Bread Delivery?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Revolucionamos a forma como você compra pão em Maputo. 
            Conveniência, qualidade e preço justo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card-custom transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card"
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-gradient-warm">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-bread-crust mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-primary rounded-2xl p-8 text-white max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para experimentar?
            </h3>
            <p className="text-white/90 mb-6">
              Junte-se a milhares de clientes que já descobriram a conveniência 
              de ter pão fresco entregue em casa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-2xl">📱</span>
                <span>App fácil de usar</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-2xl">🍞</span>
                <span>Pão sempre fresco</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <span className="text-2xl">🚚</span>
                <span>Entrega garantida</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;