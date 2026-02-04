import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  Package, 
  Navigation, 
  DollarSign,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

interface RotaDisponivel {
  id: string;
  padaria_id: string;
  pedidos_ids: string[];
  ordem_paragens: any;
  distancia_total_km: number;
  tempo_estimado_minutos: number;
  status: string;
  created_at: string;
  padarias?: {
    nome_padaria: string;
    endereco: string;
  } | null;
}

export const PedidosDisponiveis = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [rotasDisponiveis, setRotasDisponiveis] = useState<RotaDisponivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState<string | null>(null);

  useEffect(() => {
    fetchRotasDisponiveis();
    
    // Subscribe to new routes
    const channel = supabase
      .channel('rotas-disponiveis')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rotas_otimizadas',
        },
        () => {
          fetchRotasDisponiveis();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRotasDisponiveis = async () => {
    try {
      setLoading(true);
      
      // Fetch routes without an assigned driver or waiting for driver
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('*, padarias(nome_padaria, endereco)')
        .or('entregador_id.is.null,status.eq.aguardando_entregador,status.eq.pendente')
        .in('status', ['pendente', 'aguardando_entregador'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRotasDisponiveis(data || []);
    } catch (error) {
      console.error('Erro ao buscar rotas disponíveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularLucroEstimado = (rota: RotaDisponivel): number => {
    // Comissão: 10% do valor ou valor fixo por km
    // Assumindo comissão média de 50 MZN por rota + 5 MZN/km
    const baseComissao = 50;
    const comissaoPorKm = 5;
    return baseComissao + (rota.distancia_total_km * comissaoPorKm);
  };

  const handleAceitarRota = async (rotaId: string) => {
    if (!userProfile?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para aceitar rotas',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAceitando(rotaId);

      const { error } = await supabase
        .from('rotas_otimizadas')
        .update({
          entregador_id: userProfile.id,
          status: 'aceita',
          aceita_em: new Date().toISOString(),
        })
        .eq('id', rotaId)
        .eq('status', 'pendente'); // Only accept if still pending

      if (error) throw error;

      toast({
        title: 'Rota aceita!',
        description: 'A rota foi atribuída a você. Verifique suas rotas ativas.',
      });

      fetchRotasDisponiveis();
    } catch (error) {
      console.error('Erro ao aceitar rota:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aceitar a rota. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setAceitando(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (rotasDisponiveis.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Package size={48} className="text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma rota disponível</h3>
            <p className="text-muted-foreground">
              Novas rotas aparecerão aqui quando houver pedidos prontos para entrega.
            </p>
          </div>
          <Button onClick={fetchRotasDisponiveis} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Rotas Disponíveis</h2>
        <Button onClick={fetchRotasDisponiveis} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {rotasDisponiveis.map((rota) => {
          const lucroEstimado = calcularLucroEstimado(rota);
          const numParagens = (rota.ordem_paragens?.length || 1) - 1;
          
          return (
            <Card key={rota.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {rota.padarias?.nome_padaria || 'Padaria'}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {rota.padarias?.endereco}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {rota.pedidos_ids?.length || 0} pedidos
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distância</p>
                      <p className="font-semibold">{rota.distancia_total_km?.toFixed(1)} km</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Est.</p>
                      <p className="font-semibold">{rota.tempo_estimado_minutos} min</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Paragens</p>
                      <p className="font-semibold">{numParagens}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lucro Est.</p>
                      <p className="font-semibold text-primary">{lucroEstimado.toFixed(0)} MZN</p>
                    </div>
                  </div>
                </div>

                {/* Destinations Preview */}
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Destinos:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {rota.ordem_paragens?.slice(1).map((paragem: any, index: number) => (
                      <p key={index} className="text-sm flex items-center gap-1">
                        <span className="bg-primary/10 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {index + 1}
                        </span>
                        {paragem.endereco}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Accept Button */}
                <Button 
                  onClick={() => handleAceitarRota(rota.id)}
                  disabled={aceitando === rota.id}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {aceitando === rota.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Aceitando...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Aceitar Rota - Lucro: {lucroEstimado.toFixed(0)} MZN
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
