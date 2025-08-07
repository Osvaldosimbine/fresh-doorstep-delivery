import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bike, Store } from "lucide-react";
import BakeryRegistrationForm from "@/components/BakeryRegistrationForm";
import DeliveryRegistrationForm from "@/components/DeliveryRegistrationForm";

const JoinUs = () => {
  return (
    <section id="junte-se" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-bread-crust mb-4">
            Junte-se a Nós
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Faça parte da nossa rede e ajude a levar pão fresco para toda a cidade
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Entregadores */}
          <Card className="border-none bg-gradient-primary text-white shadow-warm hover:shadow-button-custom transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Bike className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Seja um Entregador
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-white/90 leading-relaxed">
                Ganhe dinheiro extra entregando pão fresco pela cidade. Horários flexíveis e boa remuneração.
              </p>
              <ul className="text-sm text-white/80 space-y-2">
                <li>• Horários flexíveis</li>
                <li>• Pagamento semanal</li>
                <li>• Suporte completo</li>
                <li>• Área de cobertura ampla</li>
              </ul>
              <DeliveryRegistrationForm>
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary transition-all duration-300"
                >
                  Cadastrar como Entregador
                </Button>
              </DeliveryRegistrationForm>
            </CardContent>
          </Card>

          {/* Padarias */}
          <Card className="border-none bg-white shadow-card-custom hover:shadow-warm transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-bread-golden/20 rounded-full flex items-center justify-center">
                <Store className="h-8 w-8 text-bread-golden" />
              </div>
              <CardTitle className="text-2xl font-bold text-bread-crust">
                Cadastre sua Padaria
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Expanda seu negócio e alcance mais clientes com nossa plataforma de entrega.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Aumente suas vendas</li>
                <li>• Gestão simplificada</li>
                <li>• Marketing incluído</li>
                <li>• Suporte especializado</li>
              </ul>
              <BakeryRegistrationForm>
                <Button className="w-full shadow-button-custom hover:scale-105 transition-transform">
                  Cadastrar Padaria
                </Button>
              </BakeryRegistrationForm>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default JoinUs;