import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, LogOut } from "lucide-react";
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
import MobileNavigation from "./MobileNavigation";

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
              <Link to="/register" className="text-sm font-medium hover:text-primary transition-colors">
                Registro
              </Link>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Icon - only for non-bakery users */}
          {userProfile?.role !== 'padaria' && (
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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
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