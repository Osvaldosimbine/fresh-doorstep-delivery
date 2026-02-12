import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ComprovativoEntrega } from './ComprovativoEntrega';

interface ListaParagensProps {
  rota: any;
  onUpdate: () => void;
}

export const ListaParagens = ({ rota, onUpdate }: ListaParagensProps) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));
  const [comprovativoOpen, setComprovativoOpen] = useState(false);
  const [pedidoParaComprovar, setPedidoParaComprovar] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const marcarComoRecolhido = async () => {
    try {
      const { error } = await supabase
        .from('rotas_otimizadas')
        .update({
          status: 'em_andamento',
          iniciada_em: new Date().toISOString(),
        })
        .eq('id', rota.id);

      if (error) throw error;

      toast({
        title: 'Recolha confirmada!',
        description: 'Você pode começar as entregas',
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error marking as collected:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível marcar como recolhido',
        variant: 'destructive',
      });
    }
  };

  const iniciarComprovativo = (pedidoId: string) => {
    setPedidoParaComprovar(pedidoId);
    setComprovativoOpen(true);
  };

  const marcarComoEntregue = async () => {
    if (!pedidoParaComprovar) return;
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status_pedido: 'entregue' })
        .eq('id', pedidoParaComprovar);

      if (error) throw error;

      const todosEntregues = rota.pedidos_ids.every((id: string) => id === pedidoParaComprovar);
      
      if (todosEntregues) {
        await supabase
          .from('rotas_otimizadas')
          .update({ status: 'concluida', concluida_em: new Date().toISOString() })
          .eq('id', rota.id);
      }

      toast({ title: 'Entrega confirmada!', description: 'Pedido marcado como entregue' });
      onUpdate();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível marcar como entregue', variant: 'destructive' });
    }
  };

  const paragens = rota.ordem_paragens || [];

  return (
    <>
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Lista de Paragens</h3>
        
        <div className="space-y-3">
          {paragens.map((paragem: any, index: number) => {
            const isExpanded = expandedItems.has(index);
            const isRecolha = paragem.tipo === 'recolha';
            const isConcluida = rota.status === 'em_andamento' && isRecolha;

            return (
              <Card key={index} className={`p-4 ${isConcluida ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {isConcluida ? (
                        <CheckCircle2 className="text-green-600" size={24} />
                      ) : (
                        <Circle className="text-muted-foreground" size={24} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isRecolha ? (
                          <Package size={16} className="text-primary" />
                        ) : (
                          <MapPin size={16} className="text-primary" />
                        )}
                        <span className="font-semibold">
                          {isRecolha ? 'Recolha na Padaria' : `Entrega ${index}`}
                        </span>
                        {isRecolha && (
                          <Badge variant="secondary">Início da Rota</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium">{paragem.local || paragem.endereco}</p>
                      <p className="text-sm text-muted-foreground">{paragem.endereco}</p>
                      
                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {paragem.itens && (
                            <div className="text-sm">
                              <p className="font-medium mb-1">Itens:</p>
                              <p className="text-muted-foreground">{paragem.itens}</p>
                            </div>
                          )}
                          {paragem.observacoes && (
                            <div className="text-sm">
                              <p className="font-medium mb-1">Observações:</p>
                              <p className="text-muted-foreground">{paragem.observacoes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isRecolha && rota.status === 'aceita' && (
                      <Button size="sm" onClick={marcarComoRecolhido}>
                        Marcar como Recolhido
                      </Button>
                    )}
                    
                    {!isRecolha && rota.status === 'em_andamento' && (
                      <Button size="sm" onClick={() => iniciarComprovativo(paragem.pedido_id)}>
                        Marcar como Entregue
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(index)}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {pedidoParaComprovar && (
        <ComprovativoEntrega
          pedidoId={pedidoParaComprovar}
          open={comprovativoOpen}
          onOpenChange={setComprovativoOpen}
          onConfirmado={marcarComoEntregue}
        />
      )}
    </>
  );
};
