import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Power, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const EntregadorStatusToggle = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tempoTurno, setTempoTurno] = useState('00:00:00');

  const { data: status, isLoading } = useQuery({
    queryKey: ['entregador-status', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      
      const { data, error } = await supabase
        .from('entregador_status')
        .select('*')
        .eq('entregador_id', userProfile.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userProfile?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async (novoStatus: boolean) => {
      if (!userProfile?.id) throw new Error('User not found');

      let position: { lat: number; lng: number } | null = null;
      
      if (novoStatus && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
        } catch (error) {
          console.error('Error getting location:', error);
        }
      }

      const updateData: any = {
        disponivel: novoStatus,
        ultimo_update: new Date().toISOString(),
        ...(novoStatus ? { turno_iniciado_em: new Date().toISOString() } : { turno_iniciado_em: null }),
        ...(position ? {
          coordenadas_lat: position.lat,
          coordenadas_lng: position.lng,
        } : {}),
      };

      if (status) {
        const { error } = await supabase
          .from('entregador_status')
          .update(updateData)
          .eq('entregador_id', userProfile.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('entregador_status')
          .insert({
            entregador_id: userProfile.id,
            ...updateData,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: (_, novoStatus) => {
      queryClient.invalidateQueries({ queryKey: ['entregador-status'] });
      toast({
        title: novoStatus ? 'Turno iniciado!' : 'Turno encerrado!',
        description: novoStatus 
          ? 'Você está disponível para receber rotas'
          : 'Você não receberá mais notificações de rotas',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
      console.error('Error toggling status:', error);
    },
  });

  useEffect(() => {
    if (!status?.disponivel || !status?.turno_iniciado_em) {
      setTempoTurno('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const inicio = new Date(status.turno_iniciado_em);
      const agora = new Date();
      const diff = agora.getTime() - inicio.getTime();
      
      const horas = Math.floor(diff / 3600000);
      const minutos = Math.floor((diff % 3600000) / 60000);
      const segundos = Math.floor((diff % 60000) / 1000);
      
      setTempoTurno(
        `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const isDisponivel = status?.disponivel || false;

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Status de Disponibilidade</h2>
          <p className="text-muted-foreground">
            {isDisponivel 
              ? 'Você está disponível para receber rotas' 
              : 'Ative para começar a receber entregas'}
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => toggleMutation.mutate(!isDisponivel)}
          disabled={isLoading || toggleMutation.isPending}
          className={`
            w-64 h-64 rounded-full text-2xl font-bold transition-all duration-300
            ${isDisponivel 
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/50' 
              : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/50'}
          `}
        >
          <div className="flex flex-col items-center gap-4">
            <Power size={64} />
            <span>{isDisponivel ? 'DISPONÍVEL' : 'INDISPONÍVEL'}</span>
          </div>
        </Button>

        {isDisponivel && (
          <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock size={16} />
                <span className="text-sm">Tempo de Turno</span>
              </div>
              <p className="text-2xl font-bold">{tempoTurno}</p>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin size={16} />
                <span className="text-sm">Localização</span>
              </div>
              <p className="text-sm font-medium">
                {status?.coordenadas_lat && status?.coordenadas_lng
                  ? 'Ativa'
                  : 'Desativada'}
              </p>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
