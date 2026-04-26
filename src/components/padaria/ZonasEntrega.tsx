import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2 } from "lucide-react";

interface Zona { id: string; bairro: string; ativo: boolean; }
interface Props { padariaId: string; }

const BAIRROS_MAPUTO = [
  "Polana", "Sommerschield", "Malhangalene", "Maxaquene", "Xipamanine",
  "Mafalala", "Chamanculo", "Alto Maé", "Catembe", "Matola",
  "Machava", "Boane", "Costa do Sol", "Triunfo", "Hulene",
  "Urbanização", "Julius Nyerere", "Jardim", "Museu", "Central",
];

export function ZonasEntrega({ padariaId }: Props) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [novaBairro, setNovaBairro] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchZonas(); }, [padariaId]);

  async function fetchZonas() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("zonas_entrega" as any)
        .select("*")
        .eq("padaria_id", padariaId)
        .order("bairro");
      if (error && error.code !== "42P01") throw error;
      setZonas((data as Zona[]) ?? []);
    } catch {
      setZonas([]);
    } finally {
      setLoading(false);
    }
  }

  async function addZona(bairro: string) {
    if (!bairro.trim()) return;
    if (zonas.some((z) => z.bairro.toLowerCase() === bairro.trim().toLowerCase())) {
      toast({ title: "Bairro já adicionado", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("zonas_entrega" as any)
        .insert({ padaria_id: padariaId, bairro: bairro.trim(), ativo: true })
        .select()
        .single();
      if (error) throw error;
      setZonas((prev) => [...prev, data as Zona].sort((a, b) => a.bairro.localeCompare(b.bairro)));
      setNovaBairro("");
      toast({ title: "Zona adicionada" });
    } catch (e: any) {
      toast({ title: "Erro ao adicionar zona", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleZona(id: string, ativo: boolean) {
    await supabase.from("zonas_entrega" as any).update({ ativo }).eq("id", id);
    setZonas((prev) => prev.map((z) => (z.id === id ? { ...z, ativo } : z)));
  }

  async function removeZona(id: string) {
    await supabase.from("zonas_entrega" as any).delete().eq("id", id);
    setZonas((prev) => prev.filter((z) => z.id !== id));
    toast({ title: "Zona removida" });
  }

  const suggestions = BAIRROS_MAPUTO.filter(
    (b) => !zonas.some((z) => z.bairro.toLowerCase() === b.toLowerCase())
      && b.toLowerCase().includes(novaBairro.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-500" />Zonas de Entrega</CardTitle>
          <CardDescription>Defina os bairros onde a sua padaria faz entregas. Os clientes verão apenas padarias que entregam na sua zona.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add zone */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do bairro (ex: Polana, Matola...)"
              value={novaBairro}
              onChange={(e) => setNovaBairro(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addZona(novaBairro)}
            />
            <Button onClick={() => addZona(novaBairro)} disabled={saving || !novaBairro.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>

          {/* Quick suggestions */}
          {novaBairro && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.slice(0, 6).map((b) => (
                <Badge
                  key={b}
                  variant="outline"
                  className="cursor-pointer hover:bg-orange-50"
                  onClick={() => addZona(b)}
                >
                  + {b}
                </Badge>
              ))}
            </div>
          )}

          {/* Common bairros shortcuts */}
          {!novaBairro && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Bairros comuns:</p>
              <div className="flex flex-wrap gap-2">
                {BAIRROS_MAPUTO.filter((b) => !zonas.some((z) => z.bairro === b)).slice(0, 10).map((b) => (
                  <Badge key={b} variant="outline" className="cursor-pointer hover:bg-orange-50" onClick={() => addZona(b)}>
                    + {b}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Zone list */}
          {loading ? (
            <p className="text-muted-foreground text-sm">A carregar...</p>
          ) : zonas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Nenhuma zona definida ainda. Adicione os bairros onde entrega.</p>
          ) : (
            <div className="divide-y">
              {zonas.map((z) => (
                <div key={z.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={z.ativo} onCheckedChange={(v) => toggleZona(z.id, v)} />
                    <span className={z.ativo ? "font-medium" : "text-muted-foreground line-through"}>{z.bairro}</span>
                    {z.ativo ? (
                      <Badge variant="default" className="bg-green-500 text-xs">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Inativo</Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeZona(z.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
