import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Package } from 'lucide-react';
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export const GanhosSection = () => {
  const { userProfile } = useAuth();

  const { data: ganhosSemana, isLoading: loadingSemana } = useQuery({
    queryKey: ['ganhos-semana', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return 0;
      
      const inicio = startOfWeek(new Date());
      const fim = endOfWeek(new Date());
      
      const { data, error } = await supabase
        .from('pagamentos_comissoes')
        .select('valor_recebido')
        .eq('entregador_id', userProfile.id)
        .gte('created_at', inicio.toISOString())
        .lte('created_at', fim.toISOString());

      if (error) throw error;
      
      return data?.reduce((sum, item) => sum + Number(item.valor_recebido || 0), 0) || 0;
    },
    enabled: !!userProfile?.id,
  });

  const { data: viagensHoje, isLoading: loadingViagens } = useQuery({
    queryKey: ['viagens-hoje', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return 0;
      
      const inicio = startOfDay(new Date());
      const fim = endOfDay(new Date());
      
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('id', { count: 'exact' })
        .eq('entregador_id', userProfile.id)
        .eq('status', 'concluida')
        .gte('concluida_em', inicio.toISOString())
        .lte('concluida_em', fim.toISOString());

      if (error) throw error;
      
      return data?.length || 0;
    },
    enabled: !!userProfile?.id,
  });

  const { data: viagensSemana, isLoading: loadingViagensSemana } = useQuery({
    queryKey: ['viagens-semana', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return 0;
      
      const inicio = startOfWeek(new Date());
      const fim = endOfWeek(new Date());
      
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('id', { count: 'exact' })
        .eq('entregador_id', userProfile.id)
        .eq('status', 'concluida')
        .gte('concluida_em', inicio.toISOString())
        .lte('concluida_em', fim.toISOString());

      if (error) throw error;
      
      return data?.length || 0;
    },
    enabled: !!userProfile?.id,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ganhos Esta Semana</p>
              <p className="text-3xl font-bold">
                {loadingSemana ? '...' : `${ganhosSemana?.toFixed(2)} MT`}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Viagens Hoje</p>
              <p className="text-3xl font-bold">
                {loadingViagens ? '...' : viagensHoje}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Viagens Esta Semana</p>
              <p className="text-3xl font-bold">
                {loadingViagensSemana ? '...' : viagensSemana}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Gráfico de Desempenho</h3>
        <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Gráfico de ganhos em desenvolvimento</p>
        </div>
      </Card>
    </div>
  );
};
