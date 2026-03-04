import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface CustomerRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

const CustomerRegistrationForm = ({ children, inline = false }: CustomerRegistrationFormProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/register?tab=register&tipo=cliente');
  };

  const content = (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">
        Crie sua conta para começar a encomendar pão fresco das melhores padarias.
      </p>
      <Button onClick={handleRedirect} className="w-full">
        Criar Conta de Cliente
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastro de Cliente</DialogTitle>
          <DialogDescription>
            Crie sua conta para começar a usar o Bread Easy
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerRegistrationForm;
