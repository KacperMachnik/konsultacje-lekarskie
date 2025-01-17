export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  patientId: string | null;
}
export interface Availability {
  id: number;
  doctorId: string;
  date: string;
  slots: TimeSlot[];
  isRecurring: boolean;
  recurringDay: number | null;
}
