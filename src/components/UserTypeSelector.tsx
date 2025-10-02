import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Store, Bike } from "lucide-react";
import CustomerRegistrationForm from "@/components/CustomerRegistrationForm";
import BakeryRegistrationForm from "@/components/BakeryRegistrationForm";
import DeliveryRegistrationForm from "@/components/DeliveryRegistrationForm";

interface UserTypeSelectorProps {
  children: React.ReactNode;
}

const UserTypeSelector = ({ children }: UserTypeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const userTypes = [
    {
      id: "cliente",
      title: "Cliente",
      description: "Receba pão fresco na sua porta",
      icon: User,
      benefits: [
        "Pão fresco todos os dias",
        "Entrega rápida",
        "Descontos por volume",
        "Pagamento flexível"
      ],
      FormComponent: CustomerRegistrationForm
    },
    {
      id: "entregador",
      title: "Entregador",
      description: "Ganhe dinheiro extra entregando pão",
      icon: Bike,
      benefits: [
        "Horários flexíveis",
        "Pagamento semanal",
        "Suporte completo",
        "Área de cobertura ampla"
      ],
      FormComponent: DeliveryRegistrationForm
    },
    {
      id: "padaria",
      title: "Padaria",
      description: "Expanda seu negócio",
      icon: Store,
      benefits: [
        "Aumente suas vendas",
        "Gestão simplificada",
        "Marketing incluído",
        "Suporte especializado"
      ],
      FormComponent: BakeryRegistrationForm
    }
  ];

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  const selectedUserType = userTypes.find(type => type.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center text-bread-crust">
            {selectedType ? "Cadastro" : "Escolha seu Perfil"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {selectedType 
              ? "Preencha os dados abaixo para se cadastrar" 
              : "Selecione como você quer usar o Bread Easy"
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedType ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {userTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card 
                  key={type.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-bread-golden"
                  onClick={() => handleTypeSelect(type.id)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className="mx-auto mb-3 w-14 h-14 bg-bread-golden/20 rounded-full flex items-center justify-center">
                      <Icon className="h-7 w-7 text-bread-golden" />
                    </div>
                    <CardTitle className="text-lg text-bread-crust">
                      {type.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </CardHeader>
                  <CardContent className="text-center space-y-2">
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {type.benefits.map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTypeSelect(type.id);
                      }}
                    >
                      Selecionar
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mb-2"
            >
              ← Voltar
            </Button>
            {selectedUserType && (
              <selectedUserType.FormComponent>
                <div className="hidden" />
              </selectedUserType.FormComponent>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserTypeSelector;
