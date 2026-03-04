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

interface DeliveryRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

const DeliveryRegistrationForm = ({ children, inline = false }: DeliveryRegistrationFormProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRedirect = () => {
    navigate('/register?tab=register&tipo=entregador');
  };

  const content = (
    <div className="space-y-4 text-center">
      <p className="text-muted-foreground">
        Cadastre-se como entregador e comece a ganhar realizando entregas.
      </p>
      <Button onClick={handleRedirect} className="w-full">
        Criar Conta de Entregador
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
          <DialogTitle>Cadastro de Entregador</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para se cadastrar como entregador
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryRegistrationForm;
