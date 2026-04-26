import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, LogOut, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";
import logoIcon from "@/assets/logo-icon.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MobileNavigation from "./MobileNavigation";
import { NotificationBell } from "./NotificationBell";

const Header = () => {
  const { user, userProfile, signOut } = useAuth();
  const { items } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado com sucesso!",
      });
      navigate('/');
    }
  };

  const cartItemsCount = items.reduce((total, item) => total + item.quantidade, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={logoIcon} 
            alt="Bread Easy Logo" 
            className="h-16 w-16 object-contain mix-blend-multiply"
          />
          <div>
            <h1 className="text-xl font-bold text-bread-crust">Bread Easy</h1>
            <p className="text-xs text-muted-foreground">Conectando você às melhores padarias</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {userProfile?.role === 'padaria' ? (
            <Link to="/padaria/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Meu Painel
            </Link>
          ) : userProfile?.role === 'entregador' ? (
            <Link to="/entregador/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Meu Dashboard
            </Link>
          ) : (
            <>
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Página Principal
              </Link>
              <Link to="/como-funciona" className="text-sm font-medium hover:text-primary transition-colors">
                Como Funciona
              </Link>
              <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
                Produtos
              </Link>
              {user && (
                <Link to="/pedidos" className="text-sm font-medium hover:text-primary transition-colors">
                  Pedidos
                </Link>
              )}
              {!user && (
                <Link to="/register" className="text-sm font-medium hover:text-primary transition-colors">
                  Entrar / Cadastrar
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Icon - only for non-bakery users */}
          {userProfile?.role !== 'padaria' && userProfile?.role !== 'entregador' && (
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* Support dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Suporte">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Suporte ao Cliente
                </DialogTitle>
                <DialogDescription>
                  Precisa de ajuda? Entre em contacto connosco através de um dos canais abaixo.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <a
                  href="https://wa.me/258840000000?text=Olá,%20preciso%20de%20ajuda%20com%20o%20Bread%20Easy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-muted-foreground">+258 84 000 0000</p>
                  </div>
                </a>
                <a
                  href="tel:+258840000000"
                  className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                >
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-xs text-muted-foreground">+258 84 000 0000</p>
                  </div>
                </a>
                <a
                  href="mailto:suporte@breadeasy.mz"
                  className="flex items-center gap-3 p-3 rounded-md border hover:bg-accent transition-colors"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">suporte@breadeasy.mz</p>
                  </div>
                </a>
              </div>
            </DialogContent>
          </Dialog>

          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                {userProfile?.role === 'cliente' && (
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Meu Perfil
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/register">
              <Button className="hidden sm:flex shadow-button-custom">
                Entrar / Cadastrar
              </Button>
            </Link>
          )}

          <MobileNavigation />
        </div>
      </div>
    </header>
  );
};

export default Header;