import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LocationSelect from '@/components/LocationSelect';
import { EmailVerificationNotice } from '@/components/EmailVerificationNotice';
import { RoleBasedRedirect } from '@/components/RoleBasedRedirect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

const registerSchema = z.object({
  nome_completo: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres'),
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido. Ex: nome@email.com'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(72, 'Senha não pode exceder 72 caracteres'),
  telefone: z.string()
    .min(9, 'Telefone deve ter pelo menos 9 dígitos')
    .regex(/^(\+?258)?[8][0-9]{8}$/, 'Formato inválido. Ex: 823456789 ou +258823456789'),
  tipo_usuario: z.union([z.literal('cliente'), z.literal('padaria'), z.literal('entregador')], {
    errorMap: () => ({ message: 'Selecione o tipo de usuário' }),
  }),
  localizacao: z.string().min(1, 'Selecione a sua localização'),
  endereco: z.string()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(200, 'Endereço não pode exceder 200 caracteres'),
  numero_documento: z.string()
    .min(1, 'Número do documento é obrigatório')
    .max(30, 'Número do documento inválido'),
});

const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Maps Supabase auth error messages/codes to user-friendly Portuguese messages.
 */
function mapAuthError(error: any): string {
  const msg = error?.message?.toLowerCase() || '';
  const code = error?.code?.toLowerCase() || '';

  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit') || code === 'over_email_send_rate_limit') {
    return 'Muitas tentativas. Por favor, aguarde 60 segundos antes de tentar novamente.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered') || code === 'user_already_exists') {
    return 'Este email já está cadastrado. Tente fazer login na aba "Entrar".';
  }
  if (msg.includes('weak_password') || msg.includes('password') && msg.includes('weak')) {
    return 'Senha muito fraca. Use pelo menos 6 caracteres com letras e números.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Email ou senha incorretos. Verifique seus dados e tente novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  if (msg.includes('signup_disabled')) {
    return 'O cadastro está temporariamente desativado. Tente mais tarde.';
  }
  if (msg.includes('validation_failed')) {
    return 'Verifique os campos destacados em vermelho.';
  }
  // Fallback
  return error?.message || 'Ocorreu um erro inesperado. Tente novamente.';
}

const Register = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const verify = searchParams.get('verify');
    const email = searchParams.get('email');
    const tab = searchParams.get('tab');
    const tipo = searchParams.get('tipo');
    
    if (verify === 'true' && email) {
      setShowVerification(true);
      setUserEmail(email);
    }
    
    if (tab === 'register') {
      setActiveTab('register');
    }
    
    if (tipo && ['cliente', 'padaria', 'entregador'].includes(tipo)) {
      registerForm.setValue('tipo_usuario', tipo as 'cliente' | 'padaria' | 'entregador');
    }
  }, [searchParams]);

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      tipo_usuario: 'cliente',
      nome_completo: '',
      email: '',
      password: '',
      telefone: '',
      localizacao: '',
      endereco: '',
      numero_documento: '',
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const startCooldown = useCallback((seconds: number = 60) => {
    setCooldown(seconds);
  }, []);

  const onRegister = async (data: RegisterFormData) => {
    if (cooldown > 0) return;
    setLoading(true);
    setFormError(null);
    
    try {
      const { error } = await signUp(data.email, data.password, {
        nome_completo: data.nome_completo,
        telefone: data.telefone,
        tipo_usuario: data.tipo_usuario,
        localizacao: data.localizacao,
        endereco: data.endereco,
        numero_documento: data.numero_documento,
      });

      if (error) {
        const friendlyMsg = mapAuthError(error);
        
        if (error.message?.includes('rate_limit') || error.message?.includes('rate limit')) {
          startCooldown(60);
        }
        
        setFormError(friendlyMsg);
        toast({
          title: "Erro no cadastro",
          description: friendlyMsg,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      });
      
      window.location.href = `/register?email=${encodeURIComponent(data.email)}&verify=true`;
    } catch (error: any) {
      const friendlyMsg = mapAuthError(error);
      
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        // Network error — no cooldown needed
      } else if (error.message?.includes('rate_limit') || error.message?.includes('rate limit')) {
        startCooldown(60);
      }
      
      setFormError(friendlyMsg);
      toast({
        title: "Erro no cadastro",
        description: friendlyMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onLogin = async (data: LoginFormData) => {
    if (cooldown > 0) return;
    setLoading(true);
    setFormError(null);
    
    const { error } = await signIn(data.email, data.password);

    if (error) {
      const friendlyMsg = mapAuthError(error);
      setFormError(friendlyMsg);
      toast({
        title: "Erro no login",
        description: friendlyMsg,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Login realizado com sucesso!",
      });
      setShouldRedirect(true);
    }
  };

  if (shouldRedirect && user) {
    return <RoleBasedRedirect />;
  }

  if (showVerification && userEmail) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <EmailVerificationNotice email={userEmail} />
        </main>
        <Footer />
      </div>
    );
  }

  const isSubmitDisabled = loading || cooldown > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setFormError(null); }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Entrar na sua conta</CardTitle>
                  <CardDescription>
                    Entre com suas credenciais para acessar sua conta.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
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
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="********" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                        {loading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                        ) : cooldown > 0 ? (
                          `Aguarde ${cooldown}s`
                        ) : (
                          'Entrar'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar nova conta</CardTitle>
                  <CardDescription>
                    Preencha todos os campos abaixo para se cadastrar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {formError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="tipo_usuario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de usuário</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cliente">Cliente</SelectItem>
                                <SelectItem value="padaria">Padaria</SelectItem>
                                <SelectItem value="entregador">Entregador</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="nome_completo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="823456789" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <LocationSelect 
                        control={registerForm.control}
                        name="localizacao"
                        label="Localização"
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="endereco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input placeholder="Av. Julius Nyerere, 123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="numero_documento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do documento</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678901234" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
                        {loading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</>
                        ) : cooldown > 0 ? (
                          `Aguarde ${cooldown}s para tentar novamente`
                        ) : (
                          'Cadastrar'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
