import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Calendar } from "lucide-react";
import { isOrderTimeAllowed, getNextAvailableTime, ORDER_TIME_SLOTS } from "@/lib/timeUtils";

interface OrderSchedulerProps {
  onScheduleConfirm: (timeSlot: string) => void;
  onCancel: () => void;
}

const OrderScheduler = ({ onScheduleConfirm, onCancel }: OrderSchedulerProps) => {
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  
  const isCurrentlyAllowed = isOrderTimeAllowed();
  const nextAvailable = getNextAvailableTime();

  const getAvailableSlots = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // If it's currently allowed, include current slots
    if (isCurrentlyAllowed) {
      return ORDER_TIME_SLOTS.filter(slot => currentTime <= slot.end);
    }
    
    // Find next available slots (today or tomorrow)
    const todaySlots = ORDER_TIME_SLOTS.filter(slot => currentTime < slot.start);
    if (todaySlots.length > 0) {
      return todaySlots;
    }
    
    // Return tomorrow's slots
    return ORDER_TIME_SLOTS.map(slot => ({
      ...slot,
      label: `Amanhã - ${slot.label}`
    }));
  };

  const availableSlots = getAvailableSlots();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Agendar Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <Calendar className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            Pedidos fora do horário de funcionamento serão agendados para: {nextAvailable}
          </span>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione o horário desejado:</label>
          <Select value={selectedSlot} onValueChange={setSelectedSlot}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um horário" />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.map((slot, index) => (
                <SelectItem key={index} value={slot.label}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Taxa de Serviço:</strong> Calculada conforme a distância
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Seu pedido ficará em espera até o horário selecionado
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => selectedSlot && onScheduleConfirm(selectedSlot)}
            disabled={!selectedSlot}
            className="flex-1 bg-bread-golden hover:bg-bread-crust"
          >
            Confirmar Agendamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderScheduler;