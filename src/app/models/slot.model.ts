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

export interface Availability {
  id: string;
  doctorId: string;
  date: string;
  slots: TimeSlot[];
  isRecurring: boolean;
  recurringDay: number | null;
  startDate?: string;
  endDate?: string;
  weekDays?: number[];
  timeRanges?: {
    startTime: string;
    endTime: string;
  }[];
}
