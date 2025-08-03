import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Bell, Download } from "lucide-react";
import { useState } from "react";

const DownloadApp = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      // Aqui você adicionaria a lógica para salvar o email
    }
  };

  return (
    <section id="baixe-app" className="py-20 bg-gradient-warm">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="mx-auto mb-6 w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
              <Smartphone className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-bread-crust mb-4">
              Baixe o App Bread Easy
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nosso aplicativo está em desenvolvimento. Deixe seu e-mail e seja notificado quando estiver disponível.
            </p>
          </div>

          {/* Coming Soon Card */}
          <Card className="border-none bg-white/80 backdrop-blur shadow-card-custom max-w-2xl mx-auto mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Download className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold text-bread-crust">
                  Em breve na Play Store
                </span>
              </div>
              
              {!isSubscribed ? (
                <form onSubmit={handleNotifyMe} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button type="submit" className="shadow-button-custom">
                      <Bell className="h-4 w-4 mr-2" />
                      Notificar-me
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Você receberá um e-mail assim que o app estiver disponível
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-delivery-green/20 rounded-full flex items-center justify-center mx-auto">
                    <Bell className="h-6 w-6 text-delivery-green" />
                  </div>
                  <h3 className="font-semibold text-bread-crust">
                    Obrigado! Você será notificado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enviaremos um e-mail assim que o app estiver pronto para download
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg">📱</span>
              </div>
              <h4 className="font-semibold text-bread-crust">Interface Intuitiva</h4>
              <p className="text-sm text-muted-foreground">App fácil de usar</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg">🥖</span>
              </div>
              <h4 className="font-semibold text-bread-crust">Pão Sempre Fresco</h4>
              <p className="text-sm text-muted-foreground">Qualidade garantida</p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-lg">🚀</span>
              </div>
              <h4 className="font-semibold text-bread-crust">Entrega Garantida</h4>
              <p className="text-sm text-muted-foreground">Rápido e seguro</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;