import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Props { userId: string; compact?: boolean; }

interface HistoryItem {
  id: string;
  pontos: number;
  tipo: "ganho" | "resgatado";
  descricao: string;
  created_at: string;
}

export function LoyaltyPoints({ userId, compact = false }: Props) {
  const [pontos, setPontos] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bal } = await supabase
        .from("pontos_fidelidade" as any)
        .select("pontos")
        .eq("user_id", userId)
        .maybeSingle();
      setPontos((bal as any)?.pontos ?? 0);

      if (!compact) {
        const { data: hist } = await supabase
          .from("historico_pontos" as any)
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        setHistory((hist as HistoryItem[]) ?? []);
      }
    } catch {
      setPontos(0);
    } finally {
      setLoading(false);
    }
  }, [userId, compact]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
        <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
        <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">{pontos} pts</span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-orange-500 fill-orange-500" />
          Pontos de Fidelidade
        </CardTitle>
        <CardDescription>Ganhe 1 ponto por cada 10 MZN gastos. 100 pontos = 10 MZN de desconto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-xl border border-orange-100">
          <p className="text-4xl font-bold text-orange-600">{pontos}</p>
          <p className="text-sm text-muted-foreground mt-1">pontos disponíveis</p>
          <Badge variant="outline" className="mt-2 text-orange-600 border-orange-300">
            Vale {Math.floor(pontos / 100) * 10} MZN em desconto
          </Badge>
        </div>

        {history.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Histórico</p>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {h.tipo === "ganho" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-muted-foreground">{h.descricao}</span>
                  </div>
                  <span className={h.tipo === "ganho" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {h.tipo === "ganho" ? "+" : "-"}{Math.abs(h.pontos)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to use in checkout
export function useLoyaltyPoints(userId: string | null) {
  const [pontos, setPontos] = useState(0);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("pontos_fidelidade" as any)
      .select("pontos")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => setPontos((data as any)?.pontos ?? 0))
      .catch(() => {});
  }, [userId]);

  async function awardPoints(userId: string, pedidoId: string, total: number) {
    const earned = Math.floor(total / 10);
    if (earned <= 0) return;
    try {
      // Upsert balance
      await supabase.from("pontos_fidelidade" as any).upsert(
        { user_id: userId, pontos: earned },
        { onConflict: "user_id", ignoreDuplicates: false }
      );
      // Log
      await supabase.from("historico_pontos" as any).insert({
        user_id: userId,
        pedido_id: pedidoId,
        pontos: earned,
        tipo: "ganho",
        descricao: `Pedido entregue (${total} MZN)`,
      });
    } catch {}
  }

  async function redeemPoints(userId: string, pontosUsados: number): Promise<number> {
    const desconto = Math.floor(pontosUsados / 100) * 10;
    try {
      await supabase.from("pontos_fidelidade" as any).upsert(
        { user_id: userId, pontos: -pontosUsados },
        { onConflict: "user_id", ignoreDuplicates: false }
      );
      await supabase.from("historico_pontos" as any).insert({
        user_id: userId,
        pontos: pontosUsados,
        tipo: "resgatado",
        descricao: `Desconto de ${desconto} MZN aplicado`,
      });
    } catch {}
    return desconto;
  }

  return { pontos, awardPoints, redeemPoints };
}
