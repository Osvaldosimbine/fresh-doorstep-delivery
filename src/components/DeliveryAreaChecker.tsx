import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeliveryAreaCheckerProps {
  userLocation: { lat: number; lng: number };
  bakeryLocation: { lat: number; lng: number };
  onDeliveryStatusChange: (allowed: boolean) => void;
}

const DeliveryAreaChecker = ({ 
  userLocation, 
  bakeryLocation, 
  onDeliveryStatusChange 
}: DeliveryAreaCheckerProps) => {
  const [distance, setDistance] = useState<number>(0);
  const [deliveryAllowed, setDeliveryAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Maximum delivery distance in kilometers
  const MAX_DELIVERY_DISTANCE = 15;

  const calculateDistance = (
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    const checkDeliveryArea = () => {
      setLoading(true);
      
      try {
        const calculatedDistance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          bakeryLocation.lat,
          bakeryLocation.lng
        );
        
        setDistance(calculatedDistance);
        const allowed = calculatedDistance <= MAX_DELIVERY_DISTANCE;
        setDeliveryAllowed(allowed);
        onDeliveryStatusChange(allowed);
      } catch (error) {
        console.error("Erro ao calcular distância:", error);
        setDeliveryAllowed(false);
        onDeliveryStatusChange(false);
      } finally {
        setLoading(false);
      }
    };

    checkDeliveryArea();
  }, [userLocation, bakeryLocation, onDeliveryStatusChange]);

  if (loading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Verificando área de cobertura...
        </AlertDescription>
      </Alert>
    );
  }

  if (deliveryAllowed) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Entrega disponível!</strong> Distância: {distance.toFixed(1)} km
          <br />
          <span className="text-sm">Tempo estimado: {Math.round(distance * 3 + 15)} minutos</span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <XCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>Área não coberta</strong> - Distância: {distance.toFixed(1)} km
        <br />
        <span className="text-sm">
          Atualmente entregamos até {MAX_DELIVERY_DISTANCE} km da padaria.
          Tente selecionar um endereço mais próximo.
        </span>
      </AlertDescription>
    </Alert>
  );
};

export default DeliveryAreaChecker;