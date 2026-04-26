import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Order {
  status: string;
  padaria?: { endereco?: string; coordenadas?: { lat: number; lng: number } };
  coordenadas_entrega?: { lat: number; lng: number };
  created_at?: string;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const PREP_MINUTES: Record<string, number> = {
  pendente: 25,
  confirmado: 20,
  em_preparacao: 15,
  pronto: 5,
  em_transito: 0,
};

export function ETADisplay({ order }: { order: Order }) {
  const statusMinutes = PREP_MINUTES[order.status];
  if (statusMinutes === undefined) return null;

  let deliveryMinutes = 10;
  const bakCoords = order.padaria?.coordenadas;
  const destCoords = order.coordenadas_entrega;
  if (bakCoords && destCoords) {
    const km = haversineKm(bakCoords.lat, bakCoords.lng, destCoords.lat, destCoords.lng);
    deliveryMinutes = Math.round(km * 3 + 5);
  }

  const totalMinutes = statusMinutes + deliveryMinutes;

  const label: Record<string, string> = {
    pendente: "A aguardar confirmação da padaria",
    confirmado: "A padaria confirmou o pedido",
    em_preparacao: "O pão está a ser preparado",
    pronto: "Pronto, a aguardar entregador",
    em_transito: "Em trânsito para si",
  };

  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="flex items-center gap-3 py-3">
        <Clock className="h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {label[order.status] ?? "Em processamento"}
          </p>
          <p className="text-xs text-muted-foreground">
            Tempo estimado: ~{totalMinutes} min para entrega
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
