// Utility functions for order time restrictions
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";

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
  const currentTime = now.toTimeString().slice(0, 5);
  
  return ORDER_TIME_SLOTS.some(slot => {
    return currentTime >= slot.start && currentTime <= slot.end;
  });
};

export const getNextAvailableTime = (): string => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  for (const slot of ORDER_TIME_SLOTS) {
    if (currentTime < slot.start) {
      return `Hoje - ${slot.label}`;
    }
  }
  
  return `Amanhã - ${ORDER_TIME_SLOTS[0].label}`;
};

export const getCurrentTimeSlot = (): OrderTimeSlot | null => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  
  return ORDER_TIME_SLOTS.find(slot => 
    currentTime >= slot.start && currentTime <= slot.end
  ) || null;
};

// Available delivery dates (today + next 6 days)
export interface DeliveryDate {
  date: Date;
  label: string;
  value: string;
}

export const getAvailableDeliveryDates = (): DeliveryDate[] => {
  const today = new Date();
  const dates: DeliveryDate[] = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    let label: string;
    if (i === 0) {
      label = "Hoje";
    } else if (i === 1) {
      label = "Amanhã";
    } else {
      label = format(date, "EEEE, d MMM", { locale: pt });
    }
    dates.push({
      date,
      label,
      value: format(date, "yyyy-MM-dd"),
    });
  }

  return dates;
};

// Get available time slots for a given date
export const getTimeSlotsForDate = (dateValue: string): OrderTimeSlot[] => {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const currentTime = now.toTimeString().slice(0, 5);

  // If the selected date is today, only show future slots
  if (dateValue === todayStr) {
    return ORDER_TIME_SLOTS.filter(slot => slot.end > currentTime);
  }

  // For future dates, show all slots
  return ORDER_TIME_SLOTS;
};

// Combine date + time slot into ISO string for horario_agendado
export const buildScheduledTime = (dateValue: string, slotStart: string): string => {
  return `${dateValue}T${slotStart}:00`;
};
