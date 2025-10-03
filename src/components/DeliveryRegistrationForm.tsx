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
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .regex(/^(\+?258)?[8][0-9]{8}$/, "Formato inválido. Ex: 823456789"),
  localizacao_atual: z.string().min(1, "Selecione uma localização"),
});

type DeliveryRegistrationData = z.infer<typeof deliveryRegistrationSchema>;

interface DeliveryRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

const DeliveryRegistrationForm = ({ children, inline = false }: DeliveryRegistrationFormProps) => {
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
      // Create a temporary password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;
      
      // Sign up the user with Supabase Auth - metadata will trigger automatic profile creation
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: tempPassword,
        options: {
          data: {
            nome_completo: data.nome_completo,
            telefone: data.telefone,
            tipo_usuario: 'entregador',
            localizacao: data.localizacao_atual,
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        // Check for rate limit error
        if (authError.message.includes('over_email_send_rate_limit')) {
          throw new Error('Você tentou cadastrar muitas vezes. Por favor, aguarde 60 segundos e tente novamente.');
        }
        throw authError;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar o cadastro.",
      });

      form.reset();
      setOpen(false);
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

  const formContent = (
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
  );

  if (inline) {
    return formContent;
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
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryRegistrationForm;