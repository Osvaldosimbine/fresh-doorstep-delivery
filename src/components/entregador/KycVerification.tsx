import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface ProfileData {
  numero_documento: string | null;
  tipo_veiculo: string | null;
  matricula_veiculo: string | null;
}

export function KycVerification() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    numero_documento: "",
    tipo_veiculo: "",
    matricula_veiculo: "",
  });

  useEffect(() => {
    if (!userProfile?.id) return;
    supabase
      .from("profiles")
      .select("numero_documento, tipo_veiculo, matricula_veiculo")
      .eq("id", userProfile.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as ProfileData | null;
        setProfile(p);
        if (p) {
          setForm({
            numero_documento: p.numero_documento || "",
            tipo_veiculo: p.tipo_veiculo || "",
            matricula_veiculo: p.matricula_veiculo || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [userProfile?.id]);

  const isVerified =
    profile?.numero_documento && profile?.tipo_veiculo && profile?.matricula_veiculo;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numero_documento || !form.tipo_veiculo || !form.matricula_veiculo) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update(form as any)
        .eq("id", userProfile!.id);
      if (error) throw error;
      setProfile({ ...profile, ...form });
      setEditing(false);
      toast({ title: "Documentos submetidos!", description: "A sua conta será verificada em breve." });
    } catch {
      toast({ title: "Erro ao guardar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className={isVerified ? "border-green-500/50" : "border-yellow-500/50"}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5" />
          Verificação KYC
          {isVerified ? (
            <Badge className="bg-green-600 text-white ml-auto flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Verificado
            </Badge>
          ) : (
            <Badge variant="destructive" className="ml-auto flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Pendente
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {isVerified
            ? "Os seus documentos foram submetidos e a sua conta está verificada."
            : "Complete os seus dados para poder aceitar entregas. Todos os campos são obrigatórios."}
        </CardDescription>
      </CardHeader>

      {(!isVerified || editing) && (
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numero_documento">Número do documento de identidade *</Label>
              <Input
                id="numero_documento"
                value={form.numero_documento}
                onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
                placeholder="Nº do BI ou passaporte"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_veiculo">Tipo de veículo *</Label>
                <Select
                  value={form.tipo_veiculo}
                  onValueChange={(v) => setForm({ ...form, tipo_veiculo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moto">Moto</SelectItem>
                    <SelectItem value="carro">Carro</SelectItem>
                    <SelectItem value="bicicleta">Bicicleta</SelectItem>
                    <SelectItem value="pe">A Pé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="matricula_veiculo">Matrícula *</Label>
                <Input
                  id="matricula_veiculo"
                  value={form.matricula_veiculo}
                  onChange={(e) => setForm({ ...form, matricula_veiculo: e.target.value })}
                  placeholder="MR-00-00"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A guardar...</> : "Submeter documentos"}
              </Button>
              {editing && (
                <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      )}

      {isVerified && !editing && (
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Documento: <span className="font-medium text-foreground">{profile?.numero_documento}</span></p>
            <p>Veículo: <span className="font-medium text-foreground capitalize">{profile?.tipo_veiculo}</span></p>
            <p>Matrícula: <span className="font-medium text-foreground">{profile?.matricula_veiculo}</span></p>
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditing(true)}>
            Atualizar documentos
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
