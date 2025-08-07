import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import breadIcon from "@/assets/bread-icon.jpg";
import CustomerRegistrationForm from "@/components/CustomerRegistrationForm";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={breadIcon} 
            alt="Bread Easy" 
            className="h-10 w-10 rounded-full object-cover animate-bread-bounce"
          />
          <div>
            <h1 className="text-xl font-bold text-bread-crust">Bread Easy</h1>
            <p className="text-xs text-muted-foreground">Conectando você às melhores padarias</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#inicio" className="text-sm font-medium hover:text-primary transition-colors">
            Início
          </a>
          <a href="#como-funciona" className="text-sm font-medium hover:text-primary transition-colors">
            Como Funciona
          </a>
          <a href="#baixe-app" className="text-sm font-medium hover:text-primary transition-colors">
            Baixe o App
          </a>
          <a href="#junte-se" className="text-sm font-medium hover:text-primary transition-colors">
            Junte-se a Nós
          </a>
          <a href="#contato" className="text-sm font-medium hover:text-primary transition-colors">
            Contato
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <CustomerRegistrationForm>
            <Button className="hidden sm:flex shadow-button-custom">
              Quero Experimentar
            </Button>
          </CustomerRegistrationForm>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;