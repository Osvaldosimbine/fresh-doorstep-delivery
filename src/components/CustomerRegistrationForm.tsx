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

const customerRegistrationSchema = z.object({
  nome_completo: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .regex(/^(\+?258)?[8][0-9]{8}$/, "Formato inválido. Ex: 823456789"),
  localizacao: z.string().min(1, "Selecione uma localização"),
  endereco: z.string().min(10, "Endereço deve ter pelo menos 10 caracteres"),
});

type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>;

interface CustomerRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

const CustomerRegistrationForm = ({ children, inline = false }: CustomerRegistrationFormProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CustomerRegistrationData>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      nome_completo: "",
      email: "",
      telefone: "",
      localizacao: "",
      endereco: "",
    },
  });

  const onSubmit = async (data: CustomerRegistrationData) => {
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
            tipo_usuario: 'cliente',
            localizacao: data.localizacao,
            endereco: data.endereco,
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
      
      // Redirect to verification page
      window.location.href = `/register?email=${encodeURIComponent(data.email)}&verify=true`;
    } catch (error: any) {
      console.error("Erro ao cadastrar cliente:", error);
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
          name="localizacao"
          label="Localização"
          placeholder="Selecione a sua área"
        />
        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Rua, número, bairro, cidade"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? "Cadastrando..." : "Quero Experimentar"}
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
          <DialogTitle>Cadastro de Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para começar a usar o Bread Easy
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerRegistrationForm;