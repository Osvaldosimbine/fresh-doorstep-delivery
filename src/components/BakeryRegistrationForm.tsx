import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

interface BakeryRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

export default function BakeryRegistrationForm({ children, inline = false }: BakeryRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/register?tab=register&tipo=padaria');
  };

  const content = (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">
        Cadastre sua padaria e comece a vender para toda a cidade.
      </p>
      <Button 
        onClick={handleRedirect} 
        className="w-full bg-gradient-primary hover:scale-105 transition-transform"
      >
        Cadastrar Padaria
      </Button>
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-bread-crust">
            Cadastre sua Padaria
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
