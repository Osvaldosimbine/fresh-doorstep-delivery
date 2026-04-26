import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, MapPin, Clock, Download, CreditCard, Truck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WhatsAppShare } from "@/components/WhatsAppShare";
import jsPDF from "jspdf";
import breadIcon from "@/assets/bread-icon.jpg";

const PAYMENT_LABELS: Record<string, string> = {
  mpesa: "M-Pesa",
  emola: "E-Mola",
  mkesh: "Mkesh",
  dinheiro: "Dinheiro",
};

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state as {
    orderId: string;
    items: Array<{ id: string; nome_produto: string; preco: number; preco_original: number; quantidade: number; padaria: string; desconto_aplicado: number; economia_total: number; taxa_servico_unitaria?: number; taxa_servico_total?: number; distancia_km?: number }>;
    total: number;
    totalSavings: number;
    totalServiceFee: number;
    paymentMethod: string;
    location: string;
    complement: string;
    horarioAgendado: string | null;
    timestamp: string;
  } | null;

  if (!data) {
    navigate("/");
    return null;
  }

  const { orderId, items, total, totalSavings, totalServiceFee, paymentMethod, location: loc, complement, horarioAgendado, timestamp } = data;
  const fullAddress = `${loc}${complement ? `, ${complement}` : ""}`;
  const ts = new Date(timestamp);

  const handleDownloadReceipt = () => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = breadIcon;
    try { doc.addImage(img, "JPEG", 85, 10, 40, 40); } catch {}

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("BREAD EASY", 105, 60, { align: "center" });
    doc.setFontSize(14);
    doc.text("RECIBO DE ENCOMENDA", 105, 70, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    let y = 85;
    doc.text(`Código: ${orderId}`, 20, y); y += 8;
    doc.text(`Data: ${ts.toLocaleString("pt-MZ")}`, 20, y); y += 8;
    doc.text(`Pagamento: ${PAYMENT_LABELS[paymentMethod] || paymentMethod}`, 20, y); y += 12;

    doc.setFont("helvetica", "bold");
    doc.text("ITENS", 20, y); y += 8;
    doc.setFont("helvetica", "normal");
    items.forEach((item) => {
      doc.text(`${item.quantidade}x ${item.nome_produto} (${item.padaria}) — ${(item.preco * item.quantidade).toFixed(2)} MT`, 20, y);
      y += 7;
    });

    y += 5;
    if (totalSavings > 0) {
      doc.text(`Economia total: -${totalSavings.toFixed(2)} MT`, 20, y); y += 7;
    }
    if (totalServiceFee > 0) {
      doc.text(`Taxa de mobilidade: +${totalServiceFee.toFixed(2)} MT`, 20, y); y += 7;
    }

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`TOTAL: ${total.toFixed(2)} MT`, 20, y); y += 12;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Entrega: ${fullAddress}`, 20, y); y += 7;
    if (horarioAgendado) {
      doc.text(`Agendado: ${new Date(horarioAgendado).toLocaleString("pt-MZ")}`, 20, y); y += 7;
    }

    y += 10;
    doc.text("Bread Easy — Pão fresco na sua porta", 105, y, { align: "center" });
    doc.save(`recibo-${orderId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-bread-crust mb-2">Pedido Confirmado!</h1>
            <Badge variant="outline" className="text-sm">{orderId}</Badge>
            <p className="text-muted-foreground mt-2">Entregadores próximos serão notificados</p>
          </div>

          {/* Items */}
          <Card>
            <CardHeader><CardTitle>Itens do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.quantidade}x {item.nome_produto}</p>
                    <p className="text-sm text-muted-foreground">{item.padaria}</p>
                  </div>
                  <span className="font-semibold">{(item.preco * item.quantidade).toFixed(2)} MT</span>
                </div>
              ))}
              <Separator />
              {totalSavings > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Economia total:</span>
                  <span>-{totalSavings.toFixed(2)} MT</span>
                </div>
              )}
              {totalServiceFee > 0 && (
                <div className="flex justify-between text-sm text-blue-600">
                  <span>Taxa de mobilidade:</span>
                  <span>+{totalServiceFee.toFixed(2)} MT</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total pago:</span>
                <span className="text-bread-crust">{total.toFixed(2)} MT</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment + Delivery */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm">Pagamento</span>
                </div>
                <p className="font-semibold">{PAYMENT_LABELS[paymentMethod] || paymentMethod}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Entrega</span>
                </div>
                <p className="font-semibold">{fullAddress}</p>
              </CardContent>
            </Card>
          </div>

          {horarioAgendado && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Agendamento</span>
                </div>
                <p className="font-semibold">{new Date(horarioAgendado).toLocaleString("pt-MZ")}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleDownloadReceipt} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Baixar Recibo (PDF)
            </Button>
            <Button
              onClick={() => navigate(`/order-tracking/${orderId}`)}
              className="w-full bg-bread-golden hover:bg-bread-crust"
            >
              <Truck className="h-4 w-4 mr-2" />
              Acompanhar Entrega
            </Button>
            <WhatsAppShare
              orderId={orderId}
              status="confirmado"
              padariaNome={data?.items?.[0]?.padaria}
              total={data?.total}
              variant="confirmation"
            />
            <Button onClick={() => navigate("/")} variant="ghost" className="w-full">
              Fazer Novo Pedido
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {ts.toLocaleString("pt-MZ")}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
