import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Star, Bike, Car, Edit2, Save, X, Award, Route, Package } from 'lucide-react';

export const PerfilEntregador = () => {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [tipoVeiculo, setTipoVeiculo] = useState('');
  const [matricula, setMatricula] = useState('');

  const { data: perfil, isLoading } = useQuery({
    queryKey: ['perfil-entregador', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userProfile.id)
        .single();
      if (error) throw error;
      if (data) {
        setTipoVeiculo(data.tipo_veiculo || '');
        setMatricula(data.matricula_veiculo || '');
      }
      return data;
    },
    enabled: !!userProfile?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile?.id) throw new Error('No user');
      const { error } = await supabase
        .from('profiles')
        .update({ tipo_veiculo: tipoVeiculo, matricula_veiculo: matricula })
        .eq('id', userProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil-entregador'] });
      setEditando(false);
      toast({ title: 'Perfil actualizado!' });
    },
  });

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !userProfile?.id) return;

    const path = `${user.id}/perfil-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('entregador-fotos')
      .upload(path, file);

    if (uploadError) {
      toast({ title: 'Erro ao fazer upload', variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('entregador-fotos')
      .getPublicUrl(path);

    await supabase
      .from('profiles')
      .update({ foto_url: urlData.publicUrl })
      .eq('id', userProfile.id);

    queryClient.invalidateQueries({ queryKey: ['perfil-entregador'] });
    toast({ title: 'Foto actualizada!' });
  };

  const getNivel = (total: number) => {
    if (total >= 100) return { label: 'Veterano', color: 'bg-yellow-500', icon: '🏆' };
    if (total >= 30) return { label: 'Experiente', color: 'bg-blue-500', icon: '⭐' };
    return { label: 'Iniciante', color: 'bg-green-500', icon: '🌱' };
  };

  if (isLoading) return <Card className="p-6 animate-pulse h-48" />;

  const nivel = getNivel(perfil?.total_entregas || 0);
  const rating = perfil?.rating_medio || 5.0;

  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar & Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage src={perfil?.foto_url || ''} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {perfil?.nome_completo?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Edit2 className="text-white" size={20} />
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
            </label>
          </div>
          <Badge className={`${nivel.color} text-white`}>
            {nivel.icon} {nivel.label}
          </Badge>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold">{perfil?.nome_completo}</h3>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  className={star <= Math.round(rating) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Veículo */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Veículo</p>
            {editando ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={tipoVeiculo}
                  onChange={(e) => setTipoVeiculo(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Bicicleta">🚲 Bicicleta</option>
                  <option value="Motorizada">🏍️ Motorizada</option>
                  <option value="Carro">🚗 Carro</option>
                </select>
                <Input
                  placeholder="Matrícula"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => updateMutation.mutate()}>
                    <Save size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {tipoVeiculo === 'Bicicleta' ? <Bike size={18} /> : <Car size={18} />}
                <span>{tipoVeiculo || 'Não definido'}</span>
                {matricula && <Badge variant="outline">{matricula}</Badge>}
                <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
                  <Edit2 size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Package size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{perfil?.total_entregas || 0}</p>
              <p className="text-xs text-muted-foreground">Entregas</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Route size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{(perfil?.km_acumulados || 0).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Km</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Award size={18} className="mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{rating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
