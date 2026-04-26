import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RepeatIcon, Plus, Trash2, Clock, Calendar } from "lucide-react";

interface PedidoRecorrente {
  id: string;
  padaria_nome: string;
  descricao: string;
  frequencia: "diaria" | "semanal";
  hora: string;
  dias_semana: number[];
  ativo: boolean;
  proximo_pedido: string | null;
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function PedidosRecorrentes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoRecorrente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [padarias, setPadarias] = useState<{ id: string; nome_padaria: string }[]>([]);

  // Form state
  const [padariaId, setPadariaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [frequencia, setFrequencia] = useState<"diaria" | "semanal">("diaria");
  const [hora, setHora] = useState("07:00");
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/register"); return; }
    fetchData();
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [pedRes, padRes] = await Promise.all([
        supabase.from("pedidos_recorrentes" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
        supabase.from("padarias").select("id, nome_padaria").eq("ativo", true).limit(50),
      ]);
      setPedidos((pedRes.data as PedidoRecorrente[]) ?? []);
      setPadarias((padRes.data as any) ?? []);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!padariaId || !descricao.trim() || !hora) {
      toast({ title: "Preencha todos os campos", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("pedidos_recorrentes" as any).insert({
        user_id: user!.id,
        padaria_id: padariaId,
        padaria_nome: padarias.find((p) => p.id === padariaId)?.nome_padaria ?? "",
        descricao: descricao.trim(),
        frequencia,
        hora,
        dias_semana: frequencia === "semanal" ? diasSemana : [0, 1, 2, 3, 4, 5, 6],
        ativo: true,
      });
      if (error) throw error;
      toast({ title: "Pedido recorrente criado!" });
      setShowForm(false);
      setDescricao(""); setPadariaId("");
      fetchData();
    } catch (e: any) {
      toast({ title: "Erro ao criar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    await supabase.from("pedidos_recorrentes" as any).update({ ativo }).eq("id", id);
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo } : p)));
  }

  async function handleDelete(id: string) {
    await supabase.from("pedidos_recorrentes" as any).delete().eq("id", id);
    setPedidos((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Pedido recorrente removido" });
  }

  function toggleDia(d: number) {
    setDiasSemana((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort());
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RepeatIcon className="h-6 w-6 text-orange-500" />
              <h1 className="text-2xl font-bold">Pedidos Recorrentes</h1>
            </div>
            <Button onClick={() => setShowForm((s) => !s)}>
              <Plus className="h-4 w-4 mr-1" /> Novo
            </Button>
          </div>

          <p className="text-muted-foreground text-sm">
            Configure entregas automáticas de pão. A padaria recebe o pedido automaticamente na hora definida.
          </p>

          {/* Create form */}
          {showForm && (
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-base">Novo pedido recorrente</CardTitle>
                <CardDescription>Defina qual padaria, o que pedir e a frequência.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Padaria</Label>
                  <Select value={padariaId} onValueChange={setPadariaId}>
                    <SelectTrigger><SelectValue placeholder="Escolha uma padaria" /></SelectTrigger>
                    <SelectContent>
                      {padarias.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome_padaria}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>O que pedir</Label>
                  <Input
                    placeholder="Ex: 2 pães baguete + 1 pão de forma"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequência</Label>
                    <Select value={frequencia} onValueChange={(v) => setFrequencia(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diaria">Diária</SelectItem>
                        <SelectItem value="semanal">Semanal (dias específicos)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hora de entrega</Label>
                    <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
                  </div>
                </div>

                {frequencia === "semanal" && (
                  <div>
                    <Label className="mb-2 block">Dias da semana</Label>
                    <div className="flex gap-2 flex-wrap">
                      {DIAS.map((d, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDia(i)}
                          className={`w-9 h-9 rounded-full text-xs font-medium border transition-colors ${
                            diasSemana.includes(i) ? "bg-orange-500 text-white border-orange-500" : "border-border"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreate} disabled={saving} className="flex-1">
                    {saving ? "A criar..." : "Criar pedido recorrente"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          {loading ? (
            <p className="text-muted-foreground text-sm">A carregar...</p>
          ) : pedidos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <RepeatIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum pedido recorrente ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Configure uma entrega diária de pão fresco!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pedidos.map((p) => (
                <Card key={p.id} className={p.ativo ? "" : "opacity-60"}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.padaria_nome}</p>
                          <Badge variant={p.ativo ? "default" : "secondary"} className="text-xs">
                            {p.ativo ? "Ativo" : "Pausado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.descricao}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />{p.hora}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {p.frequencia === "diaria" ? "Todos os dias" : (p.dias_semana ?? []).map((d) => DIAS[d]).join(", ")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch checked={p.ativo} onCheckedChange={(v) => toggleAtivo(p.id, v)} />
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
