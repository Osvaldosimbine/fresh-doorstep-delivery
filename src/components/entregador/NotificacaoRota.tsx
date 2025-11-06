import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock, Package, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificacaoRotaProps {
  rota: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAceitar: () => void;
}

export const NotificacaoRota = ({ rota, open, onOpenChange, onAceitar }: NotificacaoRotaProps) => {
  const [tempoRestante, setTempoRestante] = useState(60);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setTempoRestante(60);
      return;
    }

    const interval = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleRecusar();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  const handleAceitar = async () => {
    try {
      const { error } = await supabase
        .from('rotas_otimizadas')
        .update({
          status: 'aceita',
          aceita_em: new Date().toISOString(),
        })
        .eq('id', rota.id);

      if (error) throw error;

      toast({
        title: 'Rota aceita!',
        description: 'Você pode começar a navegação',
      });
      
      onAceitar();
      onOpenChange(false);
    } catch (error) {
      console.error('Error accepting route:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar a rota',
        variant: 'destructive',
      });
    }
  };

  const handleRecusar = async () => {
    try {
      const { error } = await supabase
        .from('rotas_otimizadas')
        .update({
          status: 'recusada',
          entregador_id: null,
        })
        .eq('id', rota.id);

      if (error) throw error;

      toast({
        title: 'Rota recusada',
        description: 'A rota será oferecida a outro entregador',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error declining route:', error);
    }
  };

  if (!rota) return null;

  const numParagens = rota.ordem_paragens?.length - 1 || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nova Rota Disponível! 🚚</DialogTitle>
          <DialogDescription>
            Você tem {tempoRestante} segundos para aceitar esta rota
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4 bg-primary/5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <MapPin className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Padaria de Recolha</p>
                  <p className="font-semibold">{rota.padarias?.nome_padaria}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Package className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Paragens</p>
                  <p className="font-semibold">{numParagens} clientes</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Navigation className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Distância Estimada</p>
                  <p className="font-semibold">{rota.distancia_total_km?.toFixed(1)} km</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="text-primary mt-1" size={20} />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Estimado</p>
                  <p className="font-semibold">{rota.tempo_estimado_minutos} min</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Endereços de entrega:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {rota.ordem_paragens?.slice(1).map((paragem: any, index: number) => (
                <p key={index} className="text-sm">
                  {index + 1}. {paragem.endereco}
                </p>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleRecusar}>
            Recusar
          </Button>
          <Button onClick={handleAceitar} className="bg-green-600 hover:bg-green-700">
            Aceitar Rota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
