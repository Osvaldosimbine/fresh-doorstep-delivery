import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import breadIcon from "@/assets/bread-icon.jpg";

const Footer = () => {
  return (
    <footer className="bg-bread-crust text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={breadIcon} 
                alt="Bread Delivery" 
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-bold">Bread Delivery</h3>
                <p className="text-sm text-white/80">Pão fresco na sua porta</p>
              </div>
            </div>
            <p className="text-white/80 mb-4">
              Disponibilizar pão a qualquer momento e em qualquer lugar. 
              Começamos em Maputo, sonhamos com o mundo.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Facebook
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Instagram
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#home" className="hover:text-white transition-colors">Início</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Produtos</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Maputo, Moçambique</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+258 84 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@breaddelivery.mz</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Horário de Funcionamento</h4>
            <div className="space-y-2 text-white/80">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <div className="text-sm">
                  <div>Segunda - Sexta: 6h - 22h</div>
                  <div>Sábado: 6h - 20h</div>
                  <div>Domingo: 7h - 18h</div>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-sm text-white/90">
                <strong>Entrega 24/7</strong><br />
                Encomende a qualquer hora através da nossa aplicação.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/80">
          <p>&copy; 2024 Bread Delivery. Todos os direitos reservados.</p>
          <p className="text-sm mt-2">
            Fundado por <strong>Osvaldo Orlando Simbine</strong> | 
            Desenvolvido em Maputo, Moçambique
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;