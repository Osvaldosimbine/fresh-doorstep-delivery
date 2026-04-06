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
  ShoppingBag,
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

interface PedidoIndividual {
  id: string;
  endereco_entrega: string;
  valor_total: number;
  status_pedido: string;
  created_at: string;
  padaria_id: string;
  padarias?: {
    nome_padaria: string;
    endereco: string;
    coordenadas_lat: number | null;
    coordenadas_lng: number | null;
  } | null;
  distanciaAteEntregador?: number | null;
}

export const PedidosDisponiveis = () => {
  const { userProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [aceitando, setAceitando] = useState<string | null>(null);
  const canLoadDriverData = !authLoading && userProfile?.role === 'entregador' && !!userProfile?.id;

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
    enabled: canLoadDriverData,
  });

  // Fetch available routes
  const { data: rotasRaw, isLoading: loadingRotas, refetch: refetchRotas } = useQuery({
    queryKey: ['rotas-disponiveis', userProfile?.id],
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
    enabled: canLoadDriverData,
    refetchInterval: 15000,
  });

  // Fetch individual orders without a driver (em_preparacao)
  const { data: pedidosRaw, isLoading: loadingPedidos, refetch: refetchPedidos } = useQuery({
    queryKey: ['pedidos-disponiveis', userProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('listar-pedidos-disponiveis');

      if (error) throw error;
      return ((data?.pedidos || []) as PedidoIndividual[]);
    },
    enabled: canLoadDriverData,
    refetchInterval: 15000,
  });

  const refetch = () => {
    refetchRotas();
    refetchPedidos();
  };

  // Subscribe to realtime changes for both tables
  useEffect(() => {
    if (!canLoadDriverData) return;

    const channel = supabase
      .channel('pedidos-disponiveis-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rotas_otimizadas' }, () => {
        refetchRotas();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        refetchPedidos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [canLoadDriverData, refetchRotas, refetchPedidos]);

  const driverLat = driverStatus?.coordenadas_lat ? Number(driverStatus.coordenadas_lat) : null;
  const driverLng = driverStatus?.coordenadas_lng ? Number(driverStatus.coordenadas_lng) : null;

  // Filter out pedidos that are already in a route
  const pedidosSemRota = useMemo(() => {
    if (!pedidosRaw) return [];
    const pedidosEmRotas = new Set<string>();
    rotasRaw?.forEach(r => r.pedidos_ids?.forEach(id => pedidosEmRotas.add(id)));
    return pedidosRaw.filter(p => !pedidosEmRotas.has(p.id));
  }, [pedidosRaw, rotasRaw]);

  // Calculate distance for routes
  const rotasComDistancia = useMemo(() => {
    if (!rotasRaw) return [];
    return rotasRaw.map((rota) => {
      let dist: number | null = null;
      if (driverLat && driverLng && rota.padarias?.coordenadas_lat && rota.padarias?.coordenadas_lng) {
        dist = calculateHaversineDistance(driverLat, driverLng, Number(rota.padarias.coordenadas_lat), Number(rota.padarias.coordenadas_lng));
      }
      return { ...rota, distanciaAteEntregador: dist };
    }).sort((a, b) => {
      if (a.distanciaAteEntregador == null && b.distanciaAteEntregador == null) return 0;
      if (a.distanciaAteEntregador == null) return 1;
      if (b.distanciaAteEntregador == null) return -1;
      return a.distanciaAteEntregador - b.distanciaAteEntregador;
    });
  }, [rotasRaw, driverLat, driverLng]);

  // Calculate distance for individual orders
  const pedidosComDistancia = useMemo(() => {
    return pedidosSemRota.map((pedido) => {
      let dist: number | null = null;
      if (driverLat && driverLng && pedido.padarias?.coordenadas_lat && pedido.padarias?.coordenadas_lng) {
        dist = calculateHaversineDistance(driverLat, driverLng, Number(pedido.padarias.coordenadas_lat), Number(pedido.padarias.coordenadas_lng));
      }
      return { ...pedido, distanciaAteEntregador: dist };
    }).sort((a, b) => {
      if (a.distanciaAteEntregador == null && b.distanciaAteEntregador == null) return 0;
      if (a.distanciaAteEntregador == null) return 1;
      if (b.distanciaAteEntregador == null) return -1;
      return a.distanciaAteEntregador - b.distanciaAteEntregador;
    });
  }, [pedidosSemRota, driverLat, driverLng]);

  // Combined items for proximity filtering
  const allProximos = useMemo(() => {
    const rotasP = rotasComDistancia.filter(r => r.distanciaAteEntregador != null && r.distanciaAteEntregador <= DEFAULT_RANGE_KM);
    const pedidosP = pedidosComDistancia.filter(p => p.distanciaAteEntregador != null && p.distanciaAteEntregador <= DEFAULT_RANGE_KM);
    return { rotas: rotasP, pedidos: pedidosP, total: rotasP.length + pedidosP.length };
  }, [rotasComDistancia, pedidosComDistancia]);

  const totalAll = (rotasComDistancia?.length || 0) + pedidosComDistancia.length;

  const calcularLucroEstimado = (rota: RotaDisponivel): number => {
    const baseComissao = 50;
    const comissaoPorKm = 5;
    return baseComissao + (rota.distancia_total_km * comissaoPorKm);
  };

  const handleAceitarRota = async (rotaId: string) => {
    if (!userProfile?.id) return;
    try {
      setAceitando(rotaId);
      const { data: rotaData, error } = await supabase
        .from('rotas_otimizadas')
        .update({ entregador_id: userProfile.id, status: 'aceita', aceita_em: new Date().toISOString() })
        .eq('id', rotaId)
        .eq('status', 'pendente')
        .select('pedidos_ids')
        .single();

      if (error) throw error;

      if (rotaData?.pedidos_ids?.length) {
        await supabase
          .from('pedidos')
          .update({ entregador_id: userProfile.id, status_pedido: 'a_caminho' as const })
          .in('id', rotaData.pedidos_ids);
      }

      toast({ title: 'Rota aceita!', description: 'A rota foi atribuída a você.' });
      refetch();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível aceitar a rota.', variant: 'destructive' });
    } finally {
      setAceitando(null);
    }
  };

  const handleAceitarPedido = async (pedidoId: string) => {
    if (!userProfile?.id) return;
    try {
      setAceitando(pedidoId);
      const { error } = await supabase
        .from('pedidos')
        .update({ entregador_id: userProfile.id, status_pedido: 'a_caminho' as const })
        .eq('id', pedidoId)
        .is('entregador_id', null);

      if (error) throw error;

      toast({ title: 'Pedido aceite!', description: 'O pedido foi atribuído a você.' });
      refetch();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível aceitar o pedido.', variant: 'destructive' });
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
      <Card key={`rota-${rota.id}`} className="overflow-hidden">
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
                <Badge variant={dentroAlcance ? 'default' : 'destructive'} className="flex items-center gap-1">
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
              <div><p className="text-xs text-muted-foreground">Dist. Rota</p><p className="font-semibold">{rota.distancia_total_km?.toFixed(1)} km</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <div><p className="text-xs text-muted-foreground">Tempo Est.</p><p className="font-semibold">{rota.tempo_estimado_minutos} min</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <div><p className="text-xs text-muted-foreground">Paragens</p><p className="font-semibold">{numParagens}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div><p className="text-xs text-muted-foreground">Lucro Est.</p><p className="font-semibold text-primary">{lucroEstimado.toFixed(0)} MZN</p></div>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">Destinos:</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {rota.ordem_paragens?.slice(1).map((paragem: any, index: number) => (
                <p key={index} className="text-sm flex items-center gap-1">
                  <span className="bg-primary/10 text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">{index + 1}</span>
                  {paragem.endereco}
                </p>
              ))}
            </div>
          </div>

          <Button onClick={() => handleAceitarRota(rota.id)} disabled={aceitando === rota.id} className="w-full bg-green-600 hover:bg-green-700">
            {aceitando === rota.id ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Aceitando...</>) : (<><DollarSign className="h-4 w-4 mr-2" />Aceitar Rota - Lucro: {lucroEstimado.toFixed(0)} MZN</>)}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderPedidoCard = (pedido: PedidoIndividual) => {
    const dist = pedido.distanciaAteEntregador;
    const dentroAlcance = dist != null && dist <= DEFAULT_RANGE_KM;
    const lucroEstimado = 50 + (dist ?? 5) * 5;

    return (
      <Card key={`pedido-${pedido.id}`} className="overflow-hidden border-l-4 border-l-orange-400">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-orange-500" />
                {pedido.padarias?.nome_padaria || 'Padaria'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{pedido.padarias?.endereco}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Pedido individual
              </Badge>
              {dist != null && (
                <Badge variant={dentroAlcance ? 'default' : 'destructive'} className="flex items-center gap-1">
                  <Locate className="h-3 w-3" />
                  {dist.toFixed(1)} km
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div><p className="text-xs text-muted-foreground">Entrega</p><p className="font-semibold text-sm">{pedido.endereco_entrega}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-semibold">{pedido.valor_total?.toFixed(0)} MZN</p></div>
            </div>
          </div>

          <Button onClick={() => handleAceitarPedido(pedido.id)} disabled={aceitando === pedido.id} className="w-full bg-orange-500 hover:bg-orange-600">
            {aceitando === pedido.id ? (<><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Aceitando...</>) : (<><DollarSign className="h-4 w-4 mr-2" />Aceitar Pedido - ~{lucroEstimado.toFixed(0)} MZN</>)}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const loading = authLoading || loadingRotas || loadingPedidos;

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (totalAll === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Package size={48} className="text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Nenhum pedido disponível</h3>
            <p className="text-muted-foreground">
              Novos pedidos aparecerão aqui automaticamente quando houver encomendas prontas.
            </p>
          </div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </Card>
    );
  }

  const hasDriverLocation = driverLat != null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Pedidos Disponíveis</h2>
        <Button onClick={refetch} variant="outline" size="sm">
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
            Próximos ({allProximos.total})
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex-1">
            Todos ({totalAll})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="mt-4">
          {allProximos.total === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                {hasDriverLocation
                  ? `Nenhum pedido dentro de ${DEFAULT_RANGE_KM} km. Veja a aba "Todos".`
                  : 'Ative o turno para filtrar por distância.'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {allProximos.rotas.map(renderRotaCard)}
              {allProximos.pedidos.map(renderPedidoCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <div className="grid gap-4">
            {rotasComDistancia.map(renderRotaCard)}
            {pedidosComDistancia.map(renderPedidoCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
