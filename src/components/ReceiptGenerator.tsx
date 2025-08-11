import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrCode, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReceiptGeneratorProps {
  orderData: {
    id: string;
    produto: any;
    quantity: number;
    location: any;
    total: number;
    discountInfo: any;
    timestamp: Date;
  };
}

const ReceiptGenerator = ({ orderData }: ReceiptGeneratorProps) => {
  const { id, produto, quantity, location, total, discountInfo, timestamp } = orderData;

  const handleDownload = () => {
    // Create receipt content
    const receiptContent = `
RECIBO DE ENCOMENDA
====================

Código: ${id}
Data: ${timestamp.toLocaleString('pt-MZ')}

PRODUTO
${produto.nome_produto}
${produto.tipo_pao}
Padaria: ${produto.padarias.nome_padaria}

QUANTIDADE: ${quantity} ${quantity === 1 ? 'pão' : 'pães'}

PREÇOS
${discountInfo.discountAmount > 0 ? 
  `Preço original: ${produto.preco.toFixed(2)} MT cada
Desconto aplicado: -${discountInfo.discountAmount.toFixed(2)} MT cada
Preço final: ${discountInfo.discountedPrice.toFixed(2)} MT cada
Economia total: ${discountInfo.totalSavings.toFixed(2)} MT` :
  `Preço: ${produto.preco.toFixed(2)} MT cada`
}

ENTREGA
${location.address}

TOTAL: ${total.toFixed(2)} MT

====================
Pão Delivery Maputo
`;

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `Encomenda confirmada! 
🍞 ${quantity} ${produto.nome_produto}
💰 Total: ${total.toFixed(2)} MT
📍 ${location.address}
🔢 Código: ${id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Recibo de Encomenda',
          text: shareText,
        });
      } catch (error) {
        console.error('Erro ao partilhar:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <Card className="border-2 border-dashed border-bread-golden">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Recibo da Encomenda
        </CardTitle>
        <Badge variant="outline" className="mx-auto w-fit">
          {id}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          {timestamp.toLocaleString('pt-MZ')}
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-semibold">PRODUTO</h4>
          <div className="text-sm space-y-1">
            <p className="font-medium">{produto.nome_produto}</p>
            <p className="text-muted-foreground">{produto.tipo_pao}</p>
            <p className="text-muted-foreground">Padaria: {produto.padarias.nome_padaria}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex justify-between">
          <span>Quantidade:</span>
          <span className="font-medium">{quantity} {quantity === 1 ? 'pão' : 'pães'}</span>
        </div>
        
        {discountInfo.discountAmount > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Preço original (cada):</span>
              <span className="line-through">{produto.preco.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Desconto (cada):</span>
              <span className="text-green-600">-{discountInfo.discountAmount.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Preço final (cada):</span>
              <span>{discountInfo.discountedPrice.toFixed(2)} MT</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Economia total:</span>
              <span className="text-green-600">-{discountInfo.totalSavings.toFixed(2)} MT</span>
            </div>
          </>
        )}
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-semibold">ENTREGA</h4>
          <p className="text-sm text-muted-foreground">{location.address}</p>
        </div>
        
        <Separator />
        
        <div className="flex justify-between text-lg font-bold">
          <span>TOTAL:</span>
          <span className="text-bread-crust">{total.toFixed(2)} MT</span>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button onClick={handleDownload} variant="outline" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm" className="flex-1">
            <Share className="h-4 w-4 mr-2" />
            Partilhar
          </Button>
        </div>
        
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>Este recibo foi enviado para:</p>
          <p>• Cliente (você)</p>
          <p>• Padaria ({produto.padarias.nome_padaria})</p>
          <p>• Entregador (após aceite)</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptGenerator;