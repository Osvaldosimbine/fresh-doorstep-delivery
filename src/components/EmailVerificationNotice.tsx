import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmailVerificationNoticeProps {
  email: string;
}

export const EmailVerificationNotice = ({ email }: EmailVerificationNoticeProps) => {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

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

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        if (error.message.includes('email_send_rate_limit') || error.message.includes('rate limit')) {
          setCooldown(60);
          toast({
            title: "Aguarde um momento",
            description: "Por favor, aguarde 60 segundos antes de solicitar um novo email.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setCooldown(60);
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada e pasta de spam.",
        });
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      toast({
        title: "Erro ao reenviar email",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-6">
      <Alert className="border-primary/50 bg-primary/5">
        <Mail className="h-5 w-5 text-primary" />
        <AlertTitle className="text-lg font-semibold mb-2">
          Verifique seu email
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            Enviamos um email de confirmação para <strong>{email}</strong>
          </p>
          
          <div className="bg-background/50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Clique no link do email para confirmar seu cadastro</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>Verifique a pasta de spam se não encontrar o email</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span>O link expira em 24 horas</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
            >
              {isResending ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Reenviando...</>
              ) : cooldown > 0 ? (
                `Reenviar em ${cooldown}s`
              ) : (
                "Reenviar Email"
              )}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
