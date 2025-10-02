import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LocationSelect from "@/components/LocationSelect";
import { MAPUTO_LOCATIONS } from "@/constants/locations";

const bakerySchema = z.object({
  nome_padaria: z.string().min(2, "Nome da padaria deve ter pelo menos 2 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .regex(/^(\+?258)?[8][0-9]{8}$/, "Formato inválido. Ex: 843123456"),
  email: z.string()
    .min(1, "Email é obrigatório")
    .email("Email inválido")
    .regex(
      /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
      "Formato de email inválido. Use: exemplo@dominio.com"
    ),
  localizacao: z.string().min(1, "Selecione uma localização"),
  horario_funcionamento: z.string().optional(),
});

type BakeryFormData = z.infer<typeof bakerySchema>;

interface BakeryRegistrationFormProps {
  children?: React.ReactNode;
  inline?: boolean;
}

export default function BakeryRegistrationForm({ children, inline = false }: BakeryRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<BakeryFormData>({
    resolver: zodResolver(bakerySchema),
    defaultValues: {
      nome_padaria: "",
      endereco: "",
      telefone: "",
      email: "",
      localizacao: "",
      horario_funcionamento: "",
    },
  });

  const onSubmit = async (values: BakeryFormData) => {
    setLoading(true);
    try {
      const location = MAPUTO_LOCATIONS.find(loc => loc.value === values.localizacao);
      
      const { data, error } = await supabase
        .from("padarias")
        .insert([
          {
            nome_padaria: values.nome_padaria,
            endereco: values.endereco,
            localizacao: values.localizacao,
            coordenadas_lat: location?.coordinates.lat,
            coordenadas_lng: location?.coordinates.lng,
            horario_funcionamento: values.horario_funcionamento ? 
              { info: values.horario_funcionamento } : null,
          }
        ])
        .select();

      if (error) {
        console.error("Erro ao cadastrar padaria:", error);
        toast({
          title: "Erro ao cadastrar padaria",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Padaria cadastrada com sucesso!",
          description: "Seu cadastro foi realizado e está sendo analisado.",
        });
        form.reset();
        setOpen(false);
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nome_padaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Padaria *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Padaria Central"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço Completo *</FormLabel>
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

        <LocationSelect
          control={form.control}
          name="localizacao"
          label="Localização *"
          placeholder="Selecione a área da padaria"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="843123456"
                    {...field} 
                  />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="padaria@exemplo.com"
                    type="email"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="horario_funcionamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Horário de Funcionamento</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ex: Segunda a Sábado: 6h às 18h"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          {!inline && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-primary hover:scale-105 transition-transform"
          >
            {loading ? "Cadastrando..." : "Cadastrar Padaria"}
          </Button>
        </div>
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-bread-crust">
            Cadastre sua Padaria
          </DialogTitle>
        </DialogHeader>
        
        {formContent}
      </DialogContent>
    </Dialog>
  );
}