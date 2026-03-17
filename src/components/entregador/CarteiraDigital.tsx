import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Wallet, ArrowUpRight, Clock, CheckCircle2, XCircle, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

const SAQUE_MINIMO = 100;

export const CarteiraDigital = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metodo, setMetodo] = useState<'mpesa' | 'emola'>('mpesa');
  const [numeroConta, setNumeroConta] = useState('');
  const [valorSaque, setValorSaque] = useState('');

  const { data: carteira } = useQuery({
    queryKey: ['carteira', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return null;
      const { data, error } = await supabase
        .from('carteira_entregador')
        .select('*')
        .eq('entregador_id', userProfile.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Create wallet if doesn't exist
        const { data: newData, error: insertError } = await supabase
          .from('carteira_entregador')
          .insert({ entregador_id: userProfile.id })
          .select()
          .single();
        if (insertError) throw insertError;
        return newData;
      }
      return data;
    },
    enabled: !!userProfile?.id,
  });

  const { data: historico } = useQuery({
    queryKey: ['pedidos-saque', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      const { data, error } = await supabase
        .from('pedidos_saque')
        .select('*')
        .eq('entregador_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id,
  });

  const saqueMutation = useMutation({
    mutationFn: async () => {
      if (!userProfile?.id) throw new Error('No user');
      const valor = parseFloat(valorSaque);
      if (isNaN(valor) || valor < SAQUE_MINIMO) throw new Error(`Valor mínimo: ${SAQUE_MINIMO} MT`);
      if (valor > (carteira?.saldo_disponivel || 0)) throw new Error('Saldo insuficiente');

      const { error } = await supabase.from('pedidos_saque').insert({
        entregador_id: userProfile.id,
        valor,
        metodo_pagamento: metodo,
        numero_conta: numeroConta,
      });
      if (error) throw error;

      // Deduct from available balance via secure RPC
      const { error: rpcError } = await supabase.rpc('process_wallet_withdrawal', {
        p_entregador_id: userProfile.id,
        p_amount: valor,
      });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carteira'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos-saque'] });
      setDialogOpen(false);
      setValorSaque('');
      setNumeroConta('');
      toast({ title: 'Pedido de saque enviado!', description: 'Será processado em breve.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    },
  });

  const statusIcon = (status: string) => {
    if (status === 'processado') return <CheckCircle2 size={16} className="text-green-600" />;
    if (status === 'rejeitado') return <XCircle size={16} className="text-red-600" />;
    return <Clock size={16} className="text-yellow-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Saldo Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="text-primary" size={24} />
            <span className="text-sm text-muted-foreground">Saldo Disponível</span>
          </div>
          <p className="text-4xl font-bold">{(carteira?.saldo_disponivel || 0).toFixed(2)} MT</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-muted-foreground" size={24} />
            <span className="text-sm text-muted-foreground">Saldo Pendente</span>
          </div>
          <p className="text-4xl font-bold text-muted-foreground">
            {(carteira?.saldo_pendente || 0).toFixed(2)} MT
          </p>
          <p className="text-xs text-muted-foreground mt-1">Entregas ainda não confirmadas</p>
        </Card>
      </div>

      {/* Solicitar Pagamento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full"
            size="lg"
            disabled={(carteira?.saldo_disponivel || 0) < SAQUE_MINIMO}
          >
            <ArrowUpRight className="mr-2" size={18} />
            Solicitar Pagamento
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <p className="text-sm font-medium mb-2">Método de Pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={metodo === 'mpesa' ? 'default' : 'outline'}
                  onClick={() => setMetodo('mpesa')}
                  className="flex gap-2"
                >
                  <Smartphone size={16} />
                  M-Pesa
                </Button>
                <Button
                  variant={metodo === 'emola' ? 'default' : 'outline'}
                  onClick={() => setMetodo('emola')}
                  className="flex gap-2"
                >
                  <Smartphone size={16} />
                  e-Mola
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Número da Conta</p>
              <Input
                placeholder="Ex: 84 123 4567"
                value={numeroConta}
                onChange={(e) => setNumeroConta(e.target.value)}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Valor (MT)</p>
              <Input
                type="number"
                placeholder={`Mínimo: ${SAQUE_MINIMO} MT`}
                value={valorSaque}
                onChange={(e) => setValorSaque(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Disponível: {(carteira?.saldo_disponivel || 0).toFixed(2)} MT
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => saqueMutation.mutate()}
              disabled={saqueMutation.isPending}
            >
              {saqueMutation.isPending ? 'Processando...' : 'Confirmar Saque'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {(carteira?.saldo_disponivel || 0) < SAQUE_MINIMO && (
        <p className="text-sm text-muted-foreground text-center">
          Saldo mínimo para saque: {SAQUE_MINIMO} MT
        </p>
      )}

      {/* Histórico */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Histórico de Saques</h3>
        {(!historico || historico.length === 0) ? (
          <p className="text-muted-foreground text-center py-4">Nenhum saque realizado</p>
        ) : (
          <div className="space-y-3">
            {historico.map((saque: any) => (
              <div key={saque.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {statusIcon(saque.status)}
                  <div>
                    <p className="font-medium">{saque.valor.toFixed(2)} MT</p>
                    <p className="text-xs text-muted-foreground">
                      {saque.metodo_pagamento.toUpperCase()} • {saque.numero_conta}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={saque.status === 'processado' ? 'default' : saque.status === 'rejeitado' ? 'destructive' : 'secondary'}>
                    {saque.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(saque.created_at), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
