export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  patientId: number | null;
}
export interface Availability {
  id: number;
  doctorId: number;
  date: string;
  slots: TimeSlot[];
  isRecurring: boolean;
  recurringDay: number | null;
}
