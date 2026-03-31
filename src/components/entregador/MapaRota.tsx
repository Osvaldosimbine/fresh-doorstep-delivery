import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Clock, Route } from 'lucide-react';
import { MapboxMap, fetchMapboxDirections, formatETA, type MapMarker, type RouteInfo } from '@/components/map/MapboxMap';

interface MapaRotaProps {
  rota: any;
}

export const MapaRota = ({ rota }: MapaRotaProps) => {
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  const abrirNavegacao = (endereco: string) => {
    const encoded = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const proximaParagem = rota.ordem_paragens?.find(
    (p: any) => p.tipo === 'entrega' && !p.concluida
  ) || rota.ordem_paragens?.[0];

  // Build markers and route from paragens
  useEffect(() => {
    const paragens = rota.ordem_paragens;
    if (!Array.isArray(paragens) || paragens.length === 0) return;

    const newMarkers: MapMarker[] = paragens.map((p: any, i: number) => ({
      id: `stop-${i}`,
      lng: p.coordenadas_lng || p.lng || 32.5732,
      lat: p.coordenadas_lat || p.lat || -25.9692,
      type: p.tipo === 'coleta' ? 'bakery' as const : 'customer' as const,
      label: p.local || p.endereco || `Paragem ${i + 1}`,
      popup: `<strong>${p.local || `Paragem ${i + 1}`}</strong><br/>${p.endereco || ''}`,
    }));
    setMarkers(newMarkers);

    // Fetch directions if we have coordinates
    const coords = newMarkers.filter(m => m.lng !== 32.5732 || m.lat !== -25.9692);
    if (coords.length >= 2) {
      const origin: [number, number] = [coords[0].lng, coords[0].lat];
      const dest: [number, number] = [coords[coords.length - 1].lng, coords[coords.length - 1].lat];
      const waypoints = coords.slice(1, -1).map(c => [c.lng, c.lat] as [number, number]);
      
      fetchMapboxDirections(origin, dest, waypoints).then(info => {
        if (info) setRouteInfo(info);
      });
    }
  }, [rota.ordem_paragens]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Navegação da Rota</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Route size={14} />
              {routeInfo 
                ? `${(routeInfo.distance / 1000).toFixed(1)} km` 
                : `${rota.distancia_total_km?.toFixed(1)} km`}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {routeInfo 
                ? formatETA(routeInfo.duration)
                : `${rota.tempo_estimado_minutos} min`}
            </span>
          </div>
        </div>
        <Button onClick={() => abrirNavegacao(proximaParagem?.endereco || '')} className="gap-2">
          <Navigation size={16} />
          Navegar
        </Button>
      </div>

      <div className="rounded-lg overflow-hidden h-[350px]">
        <MapboxMap
          markers={markers}
          route={routeInfo}
          showUserLocation
          className="h-full"
        />
      </div>

      {proximaParagem && (
        <Card className="p-4 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-1">Próxima Paragem:</p>
          <p className="font-semibold">{proximaParagem.local || proximaParagem.endereco}</p>
          <p className="text-sm text-muted-foreground mt-1">{proximaParagem.endereco}</p>
        </Card>
      )}
    </Card>
  );
};
