import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Home, Briefcase, Navigation } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  onLocationSelected: (location: { address: string; coordinates: { lat: number; lng: number }}) => void;
  onClose: () => void;
}

const LocationSelector = ({ onLocationSelected, onClose }: LocationSelectorProps) => {
  const [customAddress, setCustomAddress] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();

  // Maputo common locations for quick selection
  const commonLocations = [
    { 
      name: "Centro da Cidade", 
      address: "Avenida Julius Nyerere, Maputo Centro",
      coordinates: { lat: -25.9553, lng: 32.5892 }
    },
    { 
      name: "Costa do Sol", 
      address: "Costa do Sol, Maputo",
      coordinates: { lat: -25.9342, lng: 32.6656 }
    },
    { 
      name: "Polana", 
      address: "Bairro da Polana, Maputo",
      coordinates: { lat: -25.9425, lng: 32.5731 }
    },
    { 
      name: "Sommerschield", 
      address: "Sommerschield, Maputo",
      coordinates: { lat: -25.9489, lng: 32.5978 }
    }
  ];

  const handleCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Erro",
        description: "Geolocalização não é suportada pelo seu navegador",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            onLocationSelected({
              address: `Localização atual (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              coordinates: { lat: latitude, lng: longitude }
            });
            setIsGettingLocation(false);
          },
          (error) => {
            console.error("Erro ao obter localização:", error);
            let errorMessage = "Não foi possível obter sua localização atual";
            
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = "Permissão de localização negada. Por favor, permita o acesso à localização.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Localização não disponível. Tente novamente.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage = "Tempo limite excedido. Tente novamente.";
            }
            
            toast({
              title: "Erro",
              description: errorMessage,
              variant: "destructive",
            });
            setIsGettingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
  };

  const handleCustomAddress = () => {
    if (!customAddress.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um endereço",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, we'll use approximate coordinates for Maputo
    // In a real app, you'd use a geocoding service
    const demoCoordinates = { lat: -25.9553, lng: 32.5892 };
    
    onLocationSelected({
      address: customAddress,
      coordinates: demoCoordinates
    });
  };

  const handleCommonLocation = (location: typeof commonLocations[0]) => {
    onLocationSelected({
      address: location.address,
      coordinates: location.coordinates
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Selecionar Local de Entrega
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Location */}
          <div>
            <Button
              onClick={handleCurrentLocation}
              disabled={isGettingLocation}
              variant="outline"
              className="w-full justify-start"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? "Obtendo localização..." : "Usar localização atual"}
            </Button>
          </div>

          {/* Common Locations */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Localizações populares:</Label>
            <div className="grid grid-cols-1 gap-2">
              {commonLocations.map((location, index) => (
                <Button
                  key={index}
                  onClick={() => handleCommonLocation(location)}
                  variant="outline"
                  className="justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{location.name}</div>
                    <div className="text-sm text-muted-foreground">{location.address}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Address */}
          <div className="space-y-3">
            <Label htmlFor="custom-address">Ou insira seu endereço:</Label>
            <div className="space-y-2">
              <Input
                id="custom-address"
                placeholder="Ex: Rua da Paz, 123, Polana"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
              <Button
                onClick={handleCustomAddress}
                className="w-full"
                disabled={!customAddress.trim()}
              >
                <Home className="h-4 w-4 mr-2" />
                Confirmar endereço
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSelector;