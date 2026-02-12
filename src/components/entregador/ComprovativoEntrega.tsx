import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Camera, KeyRound, Loader2 } from 'lucide-react';

interface ComprovativoEntregaProps {
  pedidoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmado: () => void;
}

export const ComprovativoEntrega = ({ pedidoId, open, onOpenChange, onConfirmado }: ComprovativoEntregaProps) => {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const [modo, setModo] = useState<'escolha' | 'foto' | 'pin'>('escolha');
  const [pin, setPin] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !userProfile?.id) return;
    setEnviando(true);

    try {
      const path = `${user.id}/entrega-${pedidoId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('entregador-fotos')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('entregador-fotos')
        .getPublicUrl(path);

      const { error } = await supabase.from('comprovativo_entrega').insert({
        pedido_id: pedidoId,
        entregador_id: userProfile.id,
        tipo: 'foto',
        foto_url: urlData.publicUrl,
      });

      if (error) throw error;

      toast({ title: '📸 Foto registada!', description: 'Comprovativo guardado.' });
      onConfirmado();
      onOpenChange(false);
      setModo('escolha');
    } catch (error) {
      toast({ title: 'Erro no upload', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  const handlePinConfirm = async () => {
    if (pin.length !== 4 || !userProfile?.id) return;
    setEnviando(true);

    try {
      const { error } = await supabase.from('comprovativo_entrega').insert({
        pedido_id: pedidoId,
        entregador_id: userProfile.id,
        tipo: 'pin',
        pin_confirmado: true,
      });

      if (error) throw error;

      toast({ title: '✅ PIN confirmado!', description: 'Entrega comprovada.' });
      onConfirmado();
      onOpenChange(false);
      setModo('escolha');
      setPin('');
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setModo('escolha'); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comprovativo de Entrega</DialogTitle>
        </DialogHeader>

        {modo === 'escolha' && (
          <div className="grid grid-cols-2 gap-4 pt-4">
            <Button
              variant="outline"
              className="h-28 flex flex-col gap-2"
              onClick={() => setModo('foto')}
            >
              <Camera size={32} />
              <span>Tirar Foto</span>
            </Button>
            <Button
              variant="outline"
              className="h-28 flex flex-col gap-2"
              onClick={() => setModo('pin')}
            >
              <KeyRound size={32} />
              <span>PIN do Cliente</span>
            </Button>
          </div>
        )}

        {modo === 'foto' && (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">Tire uma foto da entrega realizada</p>
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              {enviando ? (
                <Loader2 className="animate-spin" size={32} />
              ) : (
                <>
                  <Camera size={32} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Toque para abrir câmera</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFotoUpload}
                disabled={enviando}
              />
            </label>
            <Button variant="ghost" className="w-full" onClick={() => setModo('escolha')}>
              Voltar
            </Button>
          </div>
        )}

        {modo === 'pin' && (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Peça ao cliente o PIN de 4 dígitos recebido no telemóvel
            </p>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="0000"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="text-center text-3xl tracking-[1em] font-mono"
            />
            <Button
              className="w-full"
              onClick={handlePinConfirm}
              disabled={pin.length !== 4 || enviando}
            >
              {enviando ? 'Verificando...' : 'Confirmar PIN'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setModo('escolha')}>
              Voltar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
