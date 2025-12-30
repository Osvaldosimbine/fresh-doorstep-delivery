import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["status_pedido"];

interface OrderDetails {
  id: string;
  status_pedido: OrderStatus;
  created_at: string;
  updated_at: string;
  valor_total: number;
  taxa_servico_total: number | null;
  endereco_entrega: string;
  forma_pagamento: string;
  horario_agendado: string | null;
  observacoes: string | null;
  padaria: {
    nome_padaria: string;
    endereco: string;
  } | null;
  entregador: {
    nome_completo: string;
    telefone: string;
  } | null;
  itens: {
    id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    produto: {
      nome_produto: string;
      imagem_url: string | null;
    } | null;
  }[];
}

interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  description: string;
}

const STATUS_ORDER: OrderStatus[] = [
  "pendente",
  "em_preparacao",
  "a_caminho",
  "entregue",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendente: "Pedido Recebido",
  em_preparacao: "Preparando",
  a_caminho: "Em Trânsito",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pendente: "Seu pedido foi recebido e aguarda confirmação",
  em_preparacao: "A padaria está preparando seu pedido",
  a_caminho: "Entregador a caminho do seu endereço",
  entregue: "Pedido entregue com sucesso!",
  cancelado: "Pedido foi cancelado",
};

export function useOrderTracking(orderId: string | undefined) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      // Fetch order with related data
      const { data: orderData, error: orderError } = await supabase
        .from("pedidos")
        .select(`
          id,
          status_pedido,
          created_at,
          updated_at,
          valor_total,
          taxa_servico_total,
          endereco_entrega,
          forma_pagamento,
          horario_agendado,
          observacoes,
          padaria_id,
          entregador_id
        `)
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch bakery info
      const { data: padariaData } = await supabase
        .from("padarias")
        .select("nome_padaria, endereco")
        .eq("id", orderData.padaria_id)
        .single();

      // Fetch delivery person info if assigned
      let entregadorData = null;
      if (orderData.entregador_id) {
        const { data } = await supabase
          .from("profiles")
          .select("nome_completo, telefone")
          .eq("id", orderData.entregador_id)
          .single();
        entregadorData = data;
      }

      // Fetch order items
      const { data: itensData } = await supabase
        .from("itens_pedido")
        .select(`
          id,
          quantidade,
          preco_unitario,
          subtotal,
          produto_id
        `)
        .eq("pedido_id", orderId);

      // Fetch product details for each item
      const itensWithProducts = await Promise.all(
        (itensData || []).map(async (item) => {
          const { data: produtoData } = await supabase
            .from("produtos")
            .select("nome_produto, imagem_url")
            .eq("id", item.produto_id)
            .single();
          return { ...item, produto: produtoData };
        })
      );

      setOrder({
        ...orderData,
        padaria: padariaData,
        entregador: entregadorData,
        itens: itensWithProducts,
      });

      // Build status history based on current status
      const currentStatusIndex = STATUS_ORDER.indexOf(orderData.status_pedido);
      const history: StatusHistoryEntry[] = [];
      
      for (let i = 0; i <= currentStatusIndex && i < STATUS_ORDER.length; i++) {
        const status = STATUS_ORDER[i];
        history.push({
          status,
          timestamp: i === currentStatusIndex ? orderData.updated_at : orderData.created_at,
          description: STATUS_DESCRIPTIONS[status],
        });
      }
      
      setStatusHistory(history);
      setError(null);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Erro ao carregar pedido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    if (!orderId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status_pedido as OrderStatus;
          const oldStatus = order?.status_pedido;

          // Update order
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status_pedido: newStatus,
              updated_at: payload.new.updated_at,
              entregador_id: payload.new.entregador_id,
            };
          });

          // Add to history
          if (newStatus !== oldStatus) {
            setStatusHistory((prev) => [
              ...prev,
              {
                status: newStatus,
                timestamp: new Date().toISOString(),
                description: STATUS_DESCRIPTIONS[newStatus],
              },
            ]);

            // Show toast notification
            toast({
              title: STATUS_LABELS[newStatus],
              description: STATUS_DESCRIPTIONS[newStatus],
            });
          }

          // Refetch to get updated entregador info
          if (payload.new.entregador_id && !order?.entregador) {
            fetchOrder();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const currentStatusIndex = order
    ? STATUS_ORDER.indexOf(order.status_pedido)
    : 0;

  const getEstimatedTime = (): string => {
    if (!order) return "";
    
    switch (order.status_pedido) {
      case "pendente":
        return "5-10 min para confirmação";
      case "em_preparacao":
        return "10-20 min para preparação";
      case "a_caminho":
        return "10-20 min para entrega";
      case "entregue":
        return "Concluído";
      case "cancelado":
        return "Cancelado";
      default:
        return "";
    }
  };

  return {
    order,
    statusHistory,
    loading,
    error,
    currentStatusIndex,
    totalSteps: STATUS_ORDER.length,
    statusOrder: STATUS_ORDER,
    statusLabels: STATUS_LABELS,
    statusDescriptions: STATUS_DESCRIPTIONS,
    getEstimatedTime,
    refetch: fetchOrder,
  };
}
