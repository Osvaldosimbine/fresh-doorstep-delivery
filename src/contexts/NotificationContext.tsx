import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  type: "order" | "route" | "system";
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

let _idCounter = 0;
const nextId = () => `notif-${++_idCounter}-${Date.now()}`;

const STORAGE_KEY = "app_notifications";
const MAX_STORED = 30;

function loadFromStorage(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as any[]).map((n) => ({ ...n, createdAt: new Date(n.createdAt) }));
  } catch {
    return [];
  }
}

function saveToStorage(notifications: AppNotification[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications.slice(0, MAX_STORED))
    );
  } catch {}
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadFromStorage());

  const addNotification = useCallback((n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    const newNotif: AppNotification = {
      ...n,
      id: nextId(),
      read: false,
      createdAt: new Date(),
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, MAX_STORED);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  // Subscribe to realtime events for current user
  useEffect(() => {
    if (!userProfile?.id) return;

    const role = userProfile.role;

    if (role === "padaria") {
      // Watch for new orders — need padaria ID first
      supabase
        .from("padarias")
        .select("id")
        .eq("user_id", userProfile.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!data?.id) return;
          const channel = supabase
            .channel(`in-app-padaria-${data.id}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "pedidos", filter: `padaria_id=eq.${data.id}` }, (payload) => {
              const order = payload.new as any;
              addNotification({
                title: "Novo pedido recebido!",
                body: `Pedido #${String(order.id).slice(0, 8)} — ${Number(order.valor_total || 0).toFixed(2)} MT`,
                type: "order",
              });
            })
            .subscribe();
          return () => supabase.removeChannel(channel);
        });
    }

    if (role === "entregador") {
      const channel = supabase
        .channel(`in-app-entregador-${userProfile.id}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "rotas_otimizadas" }, () => {
          addNotification({
            title: "Nova rota disponível!",
            body: "Há uma nova rota de entrega disponível para si.",
            type: "route",
          });
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }

    if (role === "cliente") {
      // Watch for order status updates
      const channel = supabase
        .channel(`in-app-cliente-${userProfile.id}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos" }, (payload) => {
          const order = payload.new as any;
          const labels: Record<string, string> = {
            em_preparacao: "A sua encomenda está a ser preparada.",
            a_caminho: "A sua encomenda está a caminho!",
            entregue: "A sua encomenda foi entregue. Bom apetite!",
            cancelado: "O seu pedido foi cancelado.",
          };
          const msg = labels[order.status_pedido];
          if (msg) {
            addNotification({
              title: `Pedido #${String(order.id).slice(0, 8)}`,
              body: msg,
              type: "order",
            });
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [userProfile?.id, userProfile?.role, addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
