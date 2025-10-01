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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationSelect from "@/components/LocationSelect";
import { MAPUTO_LOCATIONS } from "@/constants/locations";

const deliveryRegistrationSchema = z.object({
  nome_completo: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .regex(/^(\+?258)?[8][0-9]{8}$/, "Formato inválido. Ex: 823456789"),
  localizacao_atual: z.string().min(1, "Selecione uma localização"),
});

type DeliveryRegistrationData = z.infer<typeof deliveryRegistrationSchema>;

interface DeliveryRegistrationFormProps {
  children: React.ReactNode;
}

const DeliveryRegistrationForm = ({ children }: DeliveryRegistrationFormProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<DeliveryRegistrationData>({
    resolver: zodResolver(deliveryRegistrationSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      localizacao_atual: "",
    },
  });

  const onSubmit = async (data: DeliveryRegistrationData) => {
    setIsLoading(true);
    
    try {
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: Math.random().toString(36).slice(-8), // Generate temporary password
        options: {
          data: {
            full_name: data.nome_completo,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create profile in usuarios table
        const { error: profileError } = await supabase
          .from("usuarios")
          .insert({
            user_id: authData.user.id,
            nome_completo: data.nome_completo,
            email: data.email,
            telefone: data.telefone,
            localizacao_atual: data.localizacao_atual,
            tipo_usuario: "entregador",
            status_cadastro: "pendente",
          });

        if (profileError) {
          throw profileError;
        }

        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Seu cadastro está sendo analisado. Você receberá um email com as próximas instruções.",
        });

        form.reset();
        setOpen(false);
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar entregador:", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro ao processar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LocationSelect
              control={form.control}
              name="localizacao_atual"
              label="Localização Atual"
              placeholder="Selecione a área onde trabalha"
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar como Entregador"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryRegistrationForm;