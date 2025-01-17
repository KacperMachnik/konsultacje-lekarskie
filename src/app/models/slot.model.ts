export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  patientId: string | null;
  isCancelled?: boolean;
}
export interface Absence {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Rozszerzmy też interfejs Availability o nowe pola
export interface Availability {
  id: string;
  doctorId: string;
  date: string;
  slots: TimeSlot[];
  isRecurring: boolean;
  recurringDay: number | null;
  // Nowe pola dla cyklicznych dostępności
  startDate?: string;
  endDate?: string;
  // Maska dni tygodnia (np. [1,2,4,6] dla pon, wt, czw, sob)
  weekDays?: number[];
  // Przedziały czasowe
  timeRanges?: {
    startTime: string;
    endTime: string;
  }[];
}
