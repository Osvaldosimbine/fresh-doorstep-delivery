import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, NavigationOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  entregadorId: string;
  pedidoId?: string;
}

export function EntregadorLocationShare({ entregadorId, pedidoId }: Props) {
  const [sharing, setSharing] = useState(false);
  const watchRef = useRef<number | null>(null);
  const { toast } = useToast();

  async function updateLocation(lat: number, lng: number) {
    try {
      await supabase.from("entregador_localizacao" as any).upsert(
        { entregador_id: entregadorId, lat, lng, pedido_id: pedidoId ?? null, updated_at: new Date().toISOString() },
        { onConflict: "entregador_id" }
      );
    } catch {}
  }

  function startSharing() {
    if (!navigator.geolocation) {
      toast({ title: "GPS não disponível", description: "O seu dispositivo não suporta geolocalização.", variant: "destructive" });
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast({ title: "Erro de localização", description: "Não foi possível obter a localização.", variant: "destructive" });
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setSharing(true);
    toast({ title: "Localização partilhada", description: "O cliente pode agora ver a sua posição em tempo real." });
  }

  function stopSharing() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setSharing(false);
  }

  useEffect(() => () => stopSharing(), []);

  return (
    <div className="flex items-center gap-2">
      {sharing && <Badge variant="default" className="bg-green-500 animate-pulse text-xs">GPS ativo</Badge>}
      <Button
        variant={sharing ? "destructive" : "outline"}
        size="sm"
        onClick={sharing ? stopSharing : startSharing}
      >
        {sharing ? (
          <><NavigationOff className="h-4 w-4 mr-1" />Parar GPS</>
        ) : (
          <><Navigation className="h-4 w-4 mr-1" />Partilhar GPS</>
        )}
      </Button>
    </div>
  );
}
