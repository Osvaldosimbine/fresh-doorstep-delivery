import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Clock, Navigation, Calendar } from 'lucide-react';

type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'ano' | 'todos';

export const HistoricoViagens = () => {
  const { userProfile } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');

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
        .limit(200);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  const filtrado = useMemo(() => {
    if (!historico) return [];
    if (periodo === 'todos') return historico;

    const now = new Date();
    let inicio: Date;
    switch (periodo) {
      case 'hoje': inicio = startOfDay(now); break;
      case 'semana': inicio = startOfWeek(now, { locale: ptBR }); break;
      case 'mes': inicio = startOfMonth(now); break;
      case 'ano': inicio = startOfYear(now); break;
      default: return historico;
    }

    return historico.filter((v) => {
      if (!v.concluida_em) return false;
      return new Date(v.concluida_em) >= inicio;
    });
  }, [historico, periodo]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Carregando histórico...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-xl font-semibold">Histórico de Viagens</h3>
        <Badge variant="secondary">{filtrado.length} viagens</Badge>
      </div>

      <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="semana">Semana</TabsTrigger>
          <TabsTrigger value="mes">Mês</TabsTrigger>
          <TabsTrigger value="ano">Ano</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtrado.length === 0 ? (
        <Card className="p-8">
          <div className="text-center space-y-2">
            <Calendar size={48} className="mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Nenhuma viagem neste período</h3>
            <p className="text-muted-foreground">
              Suas viagens concluídas aparecerão aqui
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtrado.map((viagem) => {
            const ordemParagens = Array.isArray(viagem.ordem_paragens) ? viagem.ordem_paragens : [];
            const numEntregas = Math.max(ordemParagens.length - 1, 0);
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
                        {dataEntrega
                          ? format(dataEntrega, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                          : 'Data não disponível'}
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
      )}
    </div>
  );
};
