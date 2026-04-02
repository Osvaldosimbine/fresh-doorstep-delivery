import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MapboxAddressInput, { type AddressResult } from "@/components/MapboxAddressInput";

const bakerySchema = z.object({
  nome_padaria: z.string().min(2, "Nome da padaria deve ter pelo menos 2 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  telefone: z.string()
    .min(9, "Telefone deve ter pelo menos 9 dígitos")
    .regex(/^(\+?258)?[8][0-9]{8}$/, "Formato inválido. Ex: 843123456"),
  localizacao: z.string().min(1, "Selecione uma localização"),
  horario_funcionamento: z.string().optional(),
});

type BakeryFormData = z.infer<typeof bakerySchema>;

export default function CompletarCadastroPadaria() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<BakeryFormData>({
    resolver: zodResolver(bakerySchema),
    defaultValues: {
      nome_padaria: "",
      endereco: "",
      telefone: "",
      localizacao: "",
      horario_funcionamento: "",
    },
  });

  useEffect(() => {
    // Redirecionar se não estiver autenticado ou não for padaria
    if (!authLoading && (!user || !userProfile || userProfile.role !== 'padaria')) {
      navigate('/register');
    }
  }, [user, userProfile, authLoading, navigate]);

  const onSubmit = async (values: BakeryFormData) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("padarias")
        .insert([
          {
            user_id: user.id,
            nome_padaria: values.nome_padaria,
            endereco: values.endereco,
            localizacao: values.localizacao,
            coordenadas_lat: (form as any).__coordenadas?.lat ?? null,
            coordenadas_lng: (form as any).__coordenadas?.lng ?? null,
            horario_funcionamento: values.horario_funcionamento ? 
              { info: values.horario_funcionamento } : null,
            status_ativa: true,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Padaria cadastrada com sucesso!",
        description: "Bem-vindo ao seu painel de gestão.",
      });
      
      // Redirecionar para o dashboard
      navigate('/padaria/dashboard');
    } catch (error: any) {
      console.error("Erro ao cadastrar padaria:", error);
      toast({
        title: "Erro ao cadastrar padaria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Complete o Cadastro da sua Padaria</CardTitle>
              <CardDescription>
                Olá {userProfile?.nome_completo}! Para acessar seu painel, precisamos de algumas informações sobre sua padaria.
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-primary hover:scale-105 transition-transform"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Completar Cadastro"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
