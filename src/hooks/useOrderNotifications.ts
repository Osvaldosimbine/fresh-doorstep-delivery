import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type NotificationMode = "padaria" | "entregador";

function requestPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showNotification(title: string, body: string, icon?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: icon ?? "/favicon.ico" });
  } catch {
    // Some browsers block notifications from non-HTTPS; ignore silently
  }
}

export function useOrderNotifications(mode: NotificationMode, entityId: string | null) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    requestPermission();
  }, []);

  useEffect(() => {
    if (!entityId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    if (mode === "padaria") {
      const channel = supabase
        .channel(`notify-padaria-${entityId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "pedidos",
            filter: `padaria_id=eq.${entityId}`,
          },
          (payload) => {
            const order = payload.new as any;
            showNotification(
              "Novo pedido recebido!",
              `Pedido #${String(order.id).slice(0, 8)} — ${Number(order.valor_total || 0).toFixed(2)} MT`
            );
          }
        )
        .subscribe();
      channelRef.current = channel;
    }

    if (mode === "entregador") {
      const channel = supabase
        .channel(`notify-entregador-${entityId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "rotas_otimizadas",
          },
          () => {
            showNotification(
              "Nova rota disponível!",
              "Há uma nova rota de entrega disponível para si."
            );
          }
        )
        .subscribe();
      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [mode, entityId]);
}
