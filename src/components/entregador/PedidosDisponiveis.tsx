import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { calculateHaversineDistance, DEFAULT_RANGE_KM } from '@/lib/distance';
import {
  MapPin,
  Clock,
  Package,
  Navigation,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Locate,
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
    coordenadas_lat: number | null;
    coordenadas_lng: number | null;
  } | null;
  distanciaAteEntregador?: number | null;
}

export const PedidosDisponiveis = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [aceitando, setAceitando] = useState<string | null>(null);

  // Fetch driver's current position
  const { data: driverStatus } = useQuery({
    queryKey: ['entregador-status-pos', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      const { data } = await supabase
        .from('entregador_status')
        .select('coordenadas_lat, coordenadas_lng')
        .eq('entregador_id', userProfile.id)
        .maybeSingle();
      return data;
    },
    enabled: !!userProfile?.id,
  });

  // Fetch available routes
  const { data: rotasRaw, isLoading: loading, refetch } = useQuery({
    queryKey: ['rotas-disponiveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('*, padarias(nome_padaria, endereco, coordenadas_lat, coordenadas_lng)')
        .is('entregador_id', null)
        .in('status', ['pendente', 'aguardando_entregador'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as RotaDisponivel[];
    },
    refetchInterval: 15000, // auto-refresh every 15s
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('rotas-disponiveis-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rotas_otimizadas' }, () => {
        refetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Calculate distance for each route
  const rotasComDistancia = useMemo(() => {
    if (!rotasRaw) return [];
    const driverLat = driverStatus?.coordenadas_lat;
    const driverLng = driverStatus?.coordenadas_lng;

    return rotasRaw.map((rota) => {
      let dist: number | null = null;
      if (driverLat && driverLng && rota.padarias?.coordenadas_lat && rota.padarias?.coordenadas_lng) {
        dist = calculateHaversineDistance(
          Number(driverLat), Number(driverLng),
          Number(rota.padarias.coordenadas_lat), Number(rota.padarias.coordenadas_lng)
        );
      }
      return { ...rota, distanciaAteEntregador: dist };
    }).sort((a, b) => {
      if (a.distanciaAteEntregador == null && b.distanciaAteEntregador == null) return 0;
      if (a.distanciaAteEntregador == null) return 1;
      if (b.distanciaAteEntregador == null) return -1;
      return a.distanciaAteEntregador - b.distanciaAteEntregador;
    });
  }, [rotasRaw, driverStatus]);

  const rotasProximas = useMemo(
    () => rotasComDistancia.filter((r) => r.distanciaAteEntregador != null && r.distanciaAteEntregador <= DEFAULT_RANGE_KM),
    [rotasComDistancia]
  );

  const calcularLucroEstimado = (rota: RotaDisponivel): number => {
    const baseComissao = 50;
    const comissaoPorKm = 5;
    return baseComissao + (rota.distancia_total_km * comissaoPorKm);
  };

  const handleAceitarRota = async (rotaId: string) => {
    if (!userProfile?.id) {
      toast({ title: 'Erro', description: 'Você precisa estar logado para aceitar rotas', variant: 'destructive' });
      return;
    }

    try {
      setAceitando(rotaId);

      const { data: rotaData, error } = await supabase
        .from('rotas_otimizadas')
        .update({
          entregador_id: userProfile.id,
          status: 'aceita',
          aceita_em: new Date().toISOString(),
        })
        .eq('id', rotaId)
        .eq('status', 'pendente')
        .select('pedidos_ids')
        .single();

      if (error) throw error;

      if (rotaData?.pedidos_ids && rotaData.pedidos_ids.length > 0) {
        await supabase
          .from('pedidos')
          .update({ entregador_id: userProfile.id, status_pedido: 'a_caminho' as const })
          .in('id', rotaData.pedidos_ids);
      }

      toast({ title: 'Rota aceita!', description: 'A rota foi atribuída a você.' });
      refetch();
    } catch (error) {
      console.error('Erro ao aceitar rota:', error);
      toast({ title: 'Erro', description: 'Não foi possível aceitar a rota.', variant: 'destructive' });
    } finally {
      setAceitando(null);
    }
  };

  const renderRotaCard = (rota: RotaDisponivel) => {
    const lucroEstimado = calcularLucroEstimado(rota);
    const numParagens = (rota.ordem_paragens?.length || 1) - 1;
    const dist = rota.distanciaAteEntregador;
    const dentroAlcance = dist != null && dist <= DEFAULT_RANGE_KM;

    return (
      <Card key={rota.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {rota.padarias?.nome_padaria || 'Padaria'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{rota.padarias?.endereco}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                {rota.pedidos_ids?.length || 0} pedidos
              </Badge>
              {dist != null && (
                <Badge
                  variant={dentroAlcance ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  <Locate className="h-3 w-3" />
                  {dist.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Dist. Rota</p>
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

  if (!rotasComDistancia || rotasComDistancia.length === 0) {
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
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </Card>
    );
  }

  const hasDriverLocation = driverStatus?.coordenadas_lat != null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Rotas Disponíveis</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {!hasDriverLocation && (
        <Card className="p-3 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <Locate className="h-4 w-4" />
            Localização não definida. Ative o turno para ver distâncias.
          </p>
        </Card>
      )}

      <Tabs defaultValue={hasDriverLocation ? 'proximos' : 'todos'}>
        <TabsList className="w-full">
          <TabsTrigger value="proximos" className="flex-1">
            Próximos ({rotasProximas.length})
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex-1">
            Todos ({rotasComDistancia.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="mt-4">
          {rotasProximas.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                {hasDriverLocation
                  ? `Nenhuma rota dentro de ${DEFAULT_RANGE_KM} km. Veja a aba "Todos".`
                  : 'Ative o turno para filtrar por distância.'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">{rotasProximas.map(renderRotaCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <div className="grid gap-4">{rotasComDistancia.map(renderRotaCard)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
