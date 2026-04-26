import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface RatingsOverviewProps {
  padariaId: string;
}

interface Rating {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  pedido_id: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

export function RatingsOverview({ padariaId }: RatingsOverviewProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notSupported, setNotSupported] = useState(false);

  useEffect(() => {
    fetchRatings();
  }, [padariaId]);

  const fetchRatings = async () => {
    try {
      // Join avaliacoes with pedidos to filter by padaria
      const { data, error } = await supabase
        .from("avaliacoes" as any)
        .select(`id, nota, comentario, created_at, pedido_id, pedidos!inner(padaria_id)`)
        .eq("pedidos.padaria_id", padariaId)
        .order("created_at", { ascending: false });

      if (error) {
        // Table may not exist yet
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setNotSupported(true);
        } else {
          throw error;
        }
        return;
      }

      setRatings((data as any[]) || []);
    } catch {
      setNotSupported(true);
    } finally {
      setLoading(false);
    }
  };

  const average = ratings.length
    ? ratings.reduce((sum, r) => sum + r.nota, 0) / ratings.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.nota === star).length,
    percent: ratings.length
      ? (ratings.filter((r) => r.nota === star).length / ratings.length) * 100
      : 0,
  }));

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">A carregar avaliações...</div>;
  }

  if (notSupported) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            O sistema de avaliações ainda não está configurado na base de dados.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            As avaliações serão registadas à medida que os clientes avaliarem as suas entregas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Avaliações dos Clientes</h2>
        <p className="text-muted-foreground">Veja o feedback dos seus clientes</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Média Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold">{average.toFixed(1)}</span>
              <div>
                <StarDisplay rating={Math.round(average)} />
                <p className="text-sm text-muted-foreground mt-1">{ratings.length} avaliações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {distribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-right">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-6 text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
          <CardDescription>Últimas {Math.min(ratings.length, 20)} avaliações</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma avaliação ainda.</p>
          ) : (
            ratings.slice(0, 20).map((rating) => (
              <div key={rating.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <StarDisplay rating={rating.nota} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(rating.created_at).toLocaleDateString("pt-MZ")}
                  </span>
                </div>
                {rating.comentario && (
                  <p className="text-sm text-muted-foreground italic">"{rating.comentario}"</p>
                )}
                {!rating.comentario && (
                  <p className="text-xs text-muted-foreground">Sem comentário</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
