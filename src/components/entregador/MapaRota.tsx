import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin } from 'lucide-react';

interface MapaRotaProps {
  rota: any;
}

export const MapaRota = ({ rota }: MapaRotaProps) => {
  const abrirNavegacao = (endereco: string) => {
    const encoded = encodeURIComponent(endereco);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  };

  const proximaParagem = rota.ordem_paragens?.find((p: any) => p.tipo === 'entrega' && !p.concluida) || rota.ordem_paragens?.[0];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Navegação da Rota</h3>
          <p className="text-sm text-muted-foreground">
            {rota.distancia_total_km?.toFixed(1)} km • {rota.tempo_estimado_minutos} min estimado
          </p>
        </div>
        <Button onClick={() => abrirNavegacao(proximaParagem?.endereco || '')} className="gap-2">
          <Navigation size={16} />
          Abrir Navegação
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
        <MapPin size={48} className="text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center mb-2">
          Mapa de navegação em breve
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Por enquanto, use o botão "Abrir Navegação" para abrir o Google Maps
        </p>
      </div>

      {proximaParagem && (
        <Card className="p-4 bg-primary/5">
          <p className="text-sm text-muted-foreground mb-1">Próxima Paragem:</p>
          <p className="font-semibold">{proximaParagem.local || proximaParagem.endereco}</p>
          <p className="text-sm text-muted-foreground mt-1">{proximaParagem.endereco}</p>
        </Card>
      )}
    </Card>
  );
};
