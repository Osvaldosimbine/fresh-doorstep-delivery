import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Home,
  ArrowLeft 
} from "lucide-react";

const OrderTracking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};
  const [currentStatus, setCurrentStatus] = useState(0);

  const orderStatuses = [
    {
      id: 0,
      title: "Pedido Confirmado",
      description: "Seu pedido foi confirmado e está sendo processado",
      icon: CheckCircle,
      completed: true,
      time: "14:30"
    },
    {
      id: 1,
      title: "Preparando",
      description: "A padaria está preparando seu pedido",
      icon: Package,
      completed: currentStatus >= 1,
      time: currentStatus >= 1 ? "14:35" : null
    },
    {
      id: 2,
      title: "Pronto para Entrega",
      description: "Entregador a caminho da padaria",
      icon: Truck,
      completed: currentStatus >= 2,
      time: currentStatus >= 2 ? "14:45" : null
    },
    {
      id: 3,
      title: "Em Trânsito",
      description: "Entregador a caminho do seu endereço",
      icon: MapPin,
      completed: currentStatus >= 3,
      time: currentStatus >= 3 ? "14:50" : null
    },
    {
      id: 4,
      title: "Entregue",
      description: "Pedido entregue com sucesso!",
      icon: Home,
      completed: currentStatus >= 4,
      time: currentStatus >= 4 ? "15:05" : null
    }
  ];

  // Simulate status progression
  useEffect(() => {
    if (currentStatus < 4) {
      const timer = setTimeout(() => {
        setCurrentStatus(prev => Math.min(prev + 1, 4));
      }, 5000); // Update every 5 seconds for demo
      
      return () => clearTimeout(timer);
    }
  }, [currentStatus]);

  if (!orderId) {
    navigate("/pedidos");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => navigate("/pedidos")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-bread-crust">
                Acompanhar Entrega
              </h1>
              <p className="text-muted-foreground">Pedido #{orderId}</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Status da Entrega</span>
                <Badge variant={currentStatus === 4 ? "default" : "secondary"}>
                  {currentStatus === 4 ? "Concluído" : "Em Andamento"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {orderStatuses.map((status, index) => {
                  const Icon = status.icon;
                  const isActive = currentStatus === status.id;
                  const isCompleted = status.completed;
                  
                  return (
                    <div key={status.id} className="flex items-start gap-4">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full border-2
                        ${isCompleted 
                          ? 'bg-green-100 border-green-500 text-green-600' 
                          : isActive 
                            ? 'bg-bread-golden/20 border-bread-golden text-bread-crust animate-pulse'
                            : 'bg-gray-100 border-gray-300 text-gray-400'
                        }
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-medium ${
                            isCompleted ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {status.title}
                          </h3>
                          {status.time && (
                            <span className="text-sm text-muted-foreground">
                              {status.time}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {status.description}
                        </p>
                        
                        {isActive && currentStatus !== 4 && (
                          <div className="mt-2">
                            <div className="text-xs text-bread-crust font-medium">
                              Tempo estimado: {
                                currentStatus === 0 ? "5 min" :
                                currentStatus === 1 ? "10 min" :
                                currentStatus === 2 ? "5 min" :
                                currentStatus === 3 ? "15 min" : "Concluído"
                              }
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {index < orderStatuses.length - 1 && (
                        <div className={`
                          absolute left-5 mt-10 w-0.5 h-6 -ml-px
                          ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Informações da Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo estimado total:</span>
                <span className="font-medium">30-45 minutos</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entregador:</span>
                <span className="font-medium">
                  {currentStatus >= 2 ? "João Silva" : "A definir"}
                </span>
              </div>
              
              {currentStatus >= 2 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contacto:</span>
                  <span className="font-medium">+258 84 123 4567</span>
                </div>
              )}
              
              <Separator />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Tem alguma dúvida? Entre em conatcto conosco pelo WhatsApp
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Falar no WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentStatus === 4 && (
            <div className="mt-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Entrega Concluída!
                </h3>
                <p className="text-green-700 mb-4">
                  Seu pedido foi entregue com sucesso. Obrigado por escolher a Bread Easy!
                </p>
                <Button 
                  onClick={() => navigate("/")}
                  className="bg-bread-golden hover:bg-bread-crust"
                >
                  Fazer Novo Pedido
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderTracking;