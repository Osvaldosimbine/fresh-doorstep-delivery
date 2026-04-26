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
import MapboxAddressInput, { type AddressResult } from '@/components/MapboxAddressInput';
import { EmailVerificationNotice } from '@/components/EmailVerificationNotice';
import { RoleBasedRedirect } from '@/components/RoleBasedRedirect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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
    message: 'Selecione o tipo de usuário',
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
    return 'O servidor de verificação limita envios a 1 email por minuto. O seu registo pode já ter sido criado — verifique a sua caixa de entrada antes de tentar novamente.';
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
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) {
      toast({
        title: 'Erro ao entrar com Google',
        description: mapAuthError(error),
        variant: 'destructive',
      });
      setGoogleLoading(false);
    }
    // On success the browser redirects — no need to setGoogleLoading(false)
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      toast({ title: "Erro", description: mapAuthError(error), variant: "destructive" });
    } else {
      setForgotSent(true);
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
                  {/* Google OAuth */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-4"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || isSubmitDisabled}
                  >
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="ml-2">Continuar com Google</span>
                  </Button>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou com email</span>
                    </div>
                  </div>

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

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => { setForgotMode(!forgotMode); setForgotSent(false); setForgotEmail(''); }}
                          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                        >
                          Esqueci a senha
                        </button>
                      </div>
                    </form>
                  </Form>

                  {forgotMode && (
                    <div className="mt-4 border-t pt-4">
                      {forgotSent ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Link de recuperação enviado! Verifique seu email.
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-3">
                          <p className="text-sm text-muted-foreground">Digite seu email para receber o link de recuperação:</p>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                          />
                          <Button type="submit" variant="outline" className="w-full" disabled={forgotLoading}>
                            {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar link de recuperação'}
                          </Button>
                        </form>
                      )}
                    </div>
                  )}
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
                  {/* Google OAuth */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mb-4"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || isSubmitDisabled}
                  >
                    {googleLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    <span className="ml-2">Registar com Google</span>
                  </Button>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou preencha o formulário</span>
                    </div>
                  </div>

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
                      
                      <FormField
                        control={registerForm.control}
                        name="localizacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Localização</FormLabel>
                            <FormControl>
                              <MapboxAddressInput
                                value={field.value}
                                onChange={(result: AddressResult) => {
                                  field.onChange(result.address);
                                  registerForm.setValue('endereco', result.address);
                                }}
                                placeholder="Digite o endereço ou use GPS"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
