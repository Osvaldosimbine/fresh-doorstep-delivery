import { useEffect, useState } from 'react';
import { MapboxMap, fetchMapboxDirections, formatETA, type MapMarker, type RouteInfo } from './MapboxMap';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryTrackingMapProps {
  orderId: string;
  bakeryAddress?: string;
  bakeryCoords?: { lat: number; lng: number } | null;
  deliveryAddress: string;
  entregadorId?: string | null;
  className?: string;
}

export function DeliveryTrackingMap({
  orderId,
  bakeryCoords,
  bakeryAddress,
  deliveryAddress,
  entregadorId,
  className = '',
}: DeliveryTrackingMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [eta, setEta] = useState<string>('');
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Poll driver location
  useEffect(() => {
    if (!entregadorId) return;

    const fetchLocation = async () => {
      const { data } = await supabase
        .from('entregador_status')
        .select('coordenadas_lat, coordenadas_lng')
        .eq('entregador_id', entregadorId)
        .single();

      if (data?.coordenadas_lat && data?.coordenadas_lng) {
        setDriverCoords({ lat: data.coordenadas_lat, lng: data.coordenadas_lng });
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 10000); // every 10s
    return () => clearInterval(interval);
  }, [entregadorId]);

  // Build markers
  useEffect(() => {
    const m: MapMarker[] = [];

    if (bakeryCoords) {
      m.push({
        id: 'bakery',
        lng: bakeryCoords.lng,
        lat: bakeryCoords.lat,
        type: 'bakery',
        label: bakeryAddress || 'Padaria',
        popup: `<strong>${bakeryAddress || 'Padaria'}</strong>`,
      });
    }

    if (driverCoords) {
      m.push({
        id: 'driver',
        lng: driverCoords.lng,
        lat: driverCoords.lat,
        type: 'delivery',
        label: 'Entregador',
        popup: '<strong>Entregador</strong><br/>Em trânsito',
      });
    }

    setMarkers(m);
  }, [bakeryCoords, driverCoords, bakeryAddress]);

  // Calculate route & ETA
  useEffect(() => {
    if (!bakeryCoords || !driverCoords) return;

    const origin: [number, number] = [driverCoords.lng, driverCoords.lat];
    // For now use bakery as destination since we may not have geocoded delivery address
    const dest: [number, number] = [bakeryCoords.lng, bakeryCoords.lat];

    fetchMapboxDirections(origin, dest).then(info => {
      if (info) {
        setRoute(info);
        setEta(formatETA(info.duration));
      }
    });
  }, [driverCoords, bakeryCoords]);

  if (markers.length === 0 && !bakeryCoords) {
    return null; // No geo data available
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rounded-lg overflow-hidden h-[250px]">
        <MapboxMap markers={markers} route={route} className="h-full" />
      </div>
      {eta && (
        <p className="text-sm text-muted-foreground text-center">
          ETA: <span className="font-semibold text-foreground">{eta}</span>
        </p>
      )}
    </div>
  );
}
