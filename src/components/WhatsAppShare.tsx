import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pendente: "aguarda confirmação da padaria",
  confirmado: "foi confirmado pela padaria",
  em_preparacao: "está a ser preparado",
  pronto: "está pronto e aguarda entregador",
  em_transito: "está a caminho — o entregador já saiu!",
  entregue: "foi entregue com sucesso ✓",
  cancelado: "foi cancelado",
};

interface Props {
  orderId: string;
  status: string;
  padariaNome?: string;
  total?: number;
  variant?: "tracking" | "confirmation";
}

export function WhatsAppShare({ orderId, status, padariaNome, total, variant = "tracking" }: Props) {
  function buildMessage() {
    const shortId = orderId.slice(0, 8).toUpperCase();
    const label = STATUS_LABELS[status] ?? status;

    if (variant === "confirmation") {
      return (
        `🍞 *Bread Easy — Pedido Confirmado!*\n\n` +
        `Pedido *#${shortId}* na ${padariaNome ?? "padaria"} ${label}.\n` +
        (total ? `Total: *${total.toFixed(2)} MZN*\n` : "") +
        `\nAcompanhe em: https://osvaldosimbine.github.io/fresh-doorstep-delivery/#/order-tracking/${orderId}`
      );
    }

    return (
      `🍞 *Bread Easy — Atualização do Pedido*\n\n` +
      `O meu pedido *#${shortId}*${padariaNome ? ` na ${padariaNome}` : ""} ${label}.\n` +
      `\nAcompanhe em: https://osvaldosimbine.github.io/fresh-doorstep-delivery/#/order-tracking/${orderId}`
    );
  }

  function handleShare() {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 gap-2"
    >
      <MessageCircle className="h-4 w-4" />
      Partilhar no WhatsApp
    </Button>
  );
}
