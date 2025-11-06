import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Navigation, Calendar } from 'lucide-react';

export const HistoricoViagens = () => {
  const { userProfile } = useAuth();

  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-viagens', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('*, padarias(nome_padaria, endereco)')
        .eq('entregador_id', userProfile.id)
        .eq('status', 'concluida')
        .order('concluida_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Carregando histórico...</p>
      </Card>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-2">
          <Calendar size={48} className="mx-auto text-muted-foreground" />
          <h3 className="text-xl font-semibold">Nenhuma viagem concluída</h3>
          <p className="text-muted-foreground">
            Suas viagens concluídas aparecerão aqui
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Histórico de Viagens</h3>
        <Badge variant="secondary">{historico.length} viagens concluídas</Badge>
      </div>

      <div className="space-y-3">
        {historico.map((viagem) => {
          const ordemParagens = Array.isArray(viagem.ordem_paragens) ? viagem.ordem_paragens : [];
          const numEntregas = ordemParagens.length - 1 || 0;
          const dataEntrega = viagem.concluida_em ? new Date(viagem.concluida_em) : null;
          const dataInicio = viagem.iniciada_em ? new Date(viagem.iniciada_em) : null;
          
          let tempoExecucao = 0;
          if (dataEntrega && dataInicio) {
            tempoExecucao = Math.round((dataEntrega.getTime() - dataInicio.getTime()) / 60000);
          }

          return (
            <Card key={viagem.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span className="font-semibold">
                      {dataEntrega ? format(dataEntrega, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span className="text-muted-foreground">Padaria:</span>
                      <span className="font-medium">{viagem.padarias?.nome_padaria}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Navigation size={14} className="text-primary" />
                      <span className="text-muted-foreground">Distância:</span>
                      <span className="font-medium">{viagem.distancia_total_km?.toFixed(1)} km</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      <span className="text-muted-foreground">Entregas:</span>
                      <span className="font-medium">{numEntregas} clientes</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-muted-foreground">Tempo:</span>
                      <span className="font-medium">{tempoExecucao} min</span>
                    </div>
                  </div>
                </div>

                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Concluída
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
