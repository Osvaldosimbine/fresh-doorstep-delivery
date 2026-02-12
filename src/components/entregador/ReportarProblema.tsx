import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

const PROBLEMAS = [
  { value: 'pneu_furado', label: '🔧 Pneu furado', emoji: '🔧' },
  { value: 'endereco_nao_encontrado', label: '📍 Endereço não encontrado', emoji: '📍' },
  { value: 'padaria_sem_stock', label: '🍞 Padaria sem stock', emoji: '🍞' },
  { value: 'outro', label: '❓ Outro problema', emoji: '❓' },
] as const;

interface ReportarProblemaProps {
  rotaId: string;
}

export const ReportarProblema = ({ rotaId }: ReportarProblemaProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (!tipoSelecionado || !userProfile?.id) return;
    setEnviando(true);

    try {
      const { error } = await supabase.from('problemas_rota').insert({
        rota_id: rotaId,
        entregador_id: userProfile.id,
        tipo_problema: tipoSelecionado,
        descricao: descricao || null,
      });

      if (error) throw error;

      toast({ title: '⚠️ Problema reportado', description: 'A equipa foi alertada.' });
      setOpen(false);
      setTipoSelecionado('');
      setDescricao('');
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível reportar.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle size={16} className="mr-2" />
          Problemas na Rota
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar Problema</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            {PROBLEMAS.map((p) => (
              <Button
                key={p.value}
                variant={tipoSelecionado === p.value ? 'default' : 'outline'}
                className="h-auto py-3 text-sm"
                onClick={() => setTipoSelecionado(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          <Textarea
            placeholder="Descreva o problema (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!tipoSelecionado || enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
