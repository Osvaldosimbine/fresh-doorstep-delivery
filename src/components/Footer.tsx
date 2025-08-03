import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contato" className="bg-bread-crust text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-bread-cream">Bread Easy</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Conectando você às melhores padarias de Maputo com entrega rápida e pão sempre fresco.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:text-bread-cream hover:bg-white/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-bread-cream hover:bg-white/10">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-bread-cream">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#inicio" className="text-white/80 hover:text-bread-cream transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="text-white/80 hover:text-bread-cream transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#baixe-app" className="text-white/80 hover:text-bread-cream transition-colors">
                  Baixe o App
                </a>
              </li>
              <li>
                <a href="#junte-se" className="text-white/80 hover:text-bread-cream transition-colors">
                  Junte-se a Nós
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-bread-cream">Contacto</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-bread-cream" />
                <span className="text-white/80">Maputo, Moçambique</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-bread-cream" />
                <span className="text-white/80">+258 84 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-bread-cream" />
                <span className="text-white/80">contato@breadeasy.co.mz</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-semibold text-bread-cream">Newsletter</h4>
            <p className="text-white/80 text-sm">
              Receba novidades e promoções especiais
            </p>
            <div className="space-y-2">
              <Input 
                type="email" 
                placeholder="Seu e-mail" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button className="w-full bg-bread-cream text-bread-crust hover:bg-white">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/60 text-sm">
            © 2024 Bread Easy. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#privacy" className="text-white/60 hover:text-bread-cream transition-colors">
              Política de Privacidade
            </a>
            <a href="#terms" className="text-white/60 hover:text-bread-cream transition-colors">
              Termos de Uso
            </a>
          </div>
          <p className="text-white/40 text-xs">
            Desenvolvido por Osvaldo Orlando Simbine
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;