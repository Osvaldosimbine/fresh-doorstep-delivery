import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: string;
  pedido_id: string;
  sender_id: string;
  role: string;
  mensagem: string;
  created_at: string;
}

interface Props {
  pedidoId: string;
  otherPartyLabel?: string;
}

export function ChatPedido({ pedidoId, otherPartyLabel = "Entregador" }: Props) {
  const { user, userProfile } = useAuth();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMensagens = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("chat_mensagens" as any)
        .select("*")
        .eq("pedido_id", pedidoId)
        .order("created_at", { ascending: true });
      setMensagens((data as Mensagem[]) ?? []);
    } catch {
      setMensagens([]);
    }
  }, [pedidoId]);

  useEffect(() => {
    fetchMensagens();

    const channel = supabase
      .channel(`chat-${pedidoId}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "chat_mensagens", filter: `pedido_id=eq.${pedidoId}` },
        (payload: any) => {
          setMensagens((prev) => [...prev, payload.new as Mensagem]);
          if (!open && payload.new.sender_id !== user?.id) {
            setUnread((u) => u + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pedidoId, user?.id, fetchMensagens, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [open, mensagens]);

  async function sendMensagem() {
    if (!texto.trim() || !user) return;
    setSending(true);
    try {
      await supabase.from("chat_mensagens" as any).insert({
        pedido_id: pedidoId,
        sender_id: user.id,
        role: userProfile?.role ?? "cliente",
        mensagem: texto.trim(),
      });
      setTexto("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  const myRole = userProfile?.role ?? "cliente";

  return (
    <Card className="border-blue-200 dark:border-blue-800">
      <CardHeader
        className="pb-2 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Chat com {otherPartyLabel}
            {unread > 0 && (
              <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0">{unread}</Badge>
            )}
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </CardTitle>
      </CardHeader>

      {open && (
        <CardContent className="pt-0 space-y-3">
          {/* Messages */}
          <div className="h-48 overflow-y-auto space-y-2 pr-1">
            {mensagens.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs pt-8">
                Nenhuma mensagem ainda. Inicie a conversa!
              </p>
            ) : (
              mensagens.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      }`}
                    >
                      {!isMe && (
                        <p className="text-xs font-semibold mb-0.5 opacity-70 capitalize">{m.role}</p>
                      )}
                      <p>{m.mensagem}</p>
                      <p className={`text-xs mt-0.5 ${isMe ? "text-blue-100" : "text-muted-foreground"}`}>
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Escreva uma mensagem..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMensagem()}
              disabled={sending}
              className="text-sm"
            />
            <Button size="icon" onClick={sendMensagem} disabled={sending || !texto.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
