import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { MapaRota } from './MapaRota';
import { ListaParagens } from './ListaParagens';
import { NotificacaoRota } from './NotificacaoRota';
import { ReportarProblema } from './ReportarProblema';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { EntregadorLocationShare } from '@/components/EntregadorLocationShare';
import { ChatPedido } from '@/components/ChatPedido';

export const RotasAtivas = () => {
  const { userProfile } = useAuth();
  const [notificacaoRota, setNotificacaoRota] = useState<any>(null);
  const [showNotificacao, setShowNotificacao] = useState(false);

  const { data: rotasAtivas, refetch } = useQuery({
    queryKey: ['rotas-ativas', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('rotas_otimizadas')
        .select('*, padarias(nome_padaria, endereco)')
        .eq('entregador_id', userProfile.id)
        .in('status', ['aceita', 'em_andamento'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  useEffect(() => {
    if (!userProfile?.id) return;
    const channel = supabase
      .channel('rotas-entregador')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rotas_otimizadas', filter: `entregador_id=eq.${userProfile.id}` },
        async (payload) => {
          const { data } = await supabase.from('rotas_otimizadas').select('*, padarias(nome_padaria, endereco)').eq('id', payload.new.id).single();
          if (data) { setNotificacaoRota(data); setShowNotificacao(true); }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rotas_otimizadas', filter: `entregador_id=eq.${userProfile.id}` },
        () => { refetch(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile?.id, refetch]);

  if (!rotasAtivas || rotasAtivas.length === 0) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle size={48} className="text-muted-foreground" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma rota ativa</h3>
            <p className="text-muted-foreground">Quando você aceitar uma rota, ela aparecerá aqui</p>
          </div>
        </div>
      </Card>
    );
  }

  const rotaAtual = rotasAtivas[0];

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <EntregadorLocationShare entregadorId={userProfile?.id ?? ''} pedidoId={rotaAtual.pedido_id} />
          <ReportarProblema rotaId={rotaAtual.id} />
        </div>
        <MapaRota rota={rotaAtual} />
        <ListaParagens rota={rotaAtual} onUpdate={refetch} />
        {rotaAtual.pedido_id && (
          <ChatPedido pedidoId={rotaAtual.pedido_id} otherPartyLabel="Cliente" />
        )}
      </div>
      <NotificacaoRota rota={notificacaoRota} open={showNotificacao} onOpenChange={setShowNotificacao} onAceitar={refetch} />
    </>
  );
};
