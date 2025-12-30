import { 
  CheckCircle, 
  Clock, 
  Package, 
  Truck, 
  Home,
  XCircle,
  Loader2 
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["status_pedido"];

interface OrderTrackingStatusProps {
  statusOrder: OrderStatus[];
  currentStatus: OrderStatus;
  statusLabels: Record<OrderStatus, string>;
  statusDescriptions: Record<OrderStatus, string>;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    description: string;
  }[];
}

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pendente: Clock,
  em_preparacao: Package,
  a_caminho: Truck,
  entregue: Home,
  cancelado: XCircle,
};

export function OrderTrackingStatus({
  statusOrder,
  currentStatus,
  statusLabels,
  statusDescriptions,
  statusHistory,
}: OrderTrackingStatusProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isCancelled = currentStatus === "cancelado";

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isCancelled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/20">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Pedido Cancelado</h3>
            <p className="text-sm text-muted-foreground">
              Este pedido foi cancelado
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {statusOrder.map((status, index) => {
        const Icon = STATUS_ICONS[status];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const historyEntry = statusHistory.find((h) => h.status === status);

        return (
          <div key={status} className="relative">
            <div className="flex items-start gap-4 py-3">
              {/* Status Icon */}
              <div
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${isCompleted 
                    ? "bg-primary/10 border-primary text-primary" 
                    : isCurrent 
                      ? "bg-primary border-primary text-primary-foreground animate-pulse"
                      : "bg-muted border-border text-muted-foreground"
                  }
                `}
              >
                {isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              {/* Status Content */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-medium ${
                      isPending ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {statusLabels[status]}
                  </h3>
                  {historyEntry && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(historyEntry.timestamp)}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-0.5 ${
                    isPending ? "text-muted-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {statusDescriptions[status]}
                </p>
              </div>
            </div>

            {/* Connecting Line */}
            {index < statusOrder.length - 1 && (
              <div
                className={`
                  absolute left-5 top-12 w-0.5 h-6 -translate-x-1/2 transition-colors
                  ${isCompleted ? "bg-primary" : "bg-border"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
