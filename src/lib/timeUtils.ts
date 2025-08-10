// Utility functions for order time restrictions

export interface OrderTimeSlot {
  start: string;
  end: string;
  label: string;
}

export const ORDER_TIME_SLOTS: OrderTimeSlot[] = [
  { start: "06:00", end: "09:00", label: "Manhã (06h00 - 09h00)" },
  { start: "12:00", end: "13:00", label: "Almoço (12h00 - 13h00)" },
  { start: "15:00", end: "17:00", label: "Tarde (15h00 - 17h00)" }
];

export const isOrderTimeAllowed = (): boolean => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  
  return ORDER_TIME_SLOTS.some(slot => {
    return currentTime >= slot.start && currentTime <= slot.end;
  });
};

export const getNextAvailableTime = (): string => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  // Find the next available time slot
  for (const slot of ORDER_TIME_SLOTS) {
    if (currentTime < slot.start) {
      return `${slot.label}`;
    }
  }
  
  // If past all slots today, show tomorrow's first slot
  return `Amanhã - ${ORDER_TIME_SLOTS[0].label}`;
};

export const getCurrentTimeSlot = (): OrderTimeSlot | null => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  return ORDER_TIME_SLOTS.find(slot => 
    currentTime >= slot.start && currentTime <= slot.end
  ) || null;
};