import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  Info, 
  Package, 
  ShoppingBag, 
  UserPlus, 
  LogOut,
  ShoppingCart
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const MobileNavigation = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const { toast } = useToast();

  const cartItemsCount = items.reduce((total, item) => total + item.quantidade, 0);

  const handleSignOut = async () => {
    setOpen(false);
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

  const navItems = [
    { to: "/", label: "Página Principal", icon: Home },
    { to: "/como-funciona", label: "Como Funciona", icon: Info },
    { to: "/products", label: "Produtos", icon: Package },
    { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
    { to: "/cart", label: "Carrinho", icon: ShoppingCart, badge: cartItemsCount },
  ];

  const handleNavClick = (to: string) => {
    setOpen(false);
    // Small delay to allow sheet to close before navigation
    setTimeout(() => {
      navigate(to);
    }, 100);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 bg-background">
        <SheetHeader>
          <SheetTitle className="text-bread-crust">Bread Easy</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <button
                key={item.to}
                onClick={() => handleNavClick(item.to)}
                className={`
                  flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors
                  ${isActive 
                    ? 'bg-bread-golden/10 text-bread-crust border border-bread-golden/20' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
          
          <div className="border-t border-border pt-4 mt-4">
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-destructive/10 text-destructive hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sair</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavClick('/register')}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-left transition-colors hover:bg-primary/10 text-primary hover:text-primary"
              >
                <UserPlus className="h-5 w-5" />
                <span className="font-medium">Entrar / Cadastrar</span>
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;