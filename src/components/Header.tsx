import { Button } from "@/components/ui/button";
import { ShoppingCart, User, Menu } from "lucide-react";
import breadIcon from "@/assets/bread-icon.jpg";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={breadIcon} 
            alt="Bread Delivery" 
            className="h-10 w-10 rounded-full object-cover animate-bread-bounce"
          />
          <div>
            <h1 className="text-xl font-bold text-bread-crust">Bread Delivery</h1>
            <p className="text-xs text-muted-foreground">Pão fresco na sua porta</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#home" className="text-sm font-medium hover:text-primary transition-colors">
            Início
          </a>
          <a href="#products" className="text-sm font-medium hover:text-primary transition-colors">
            Produtos
          </a>
          <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
            Sobre
          </a>
          <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
            Contacto
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-white flex items-center justify-center">
              0
            </span>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="hero" className="hidden sm:flex">
            Fazer Pedido
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;