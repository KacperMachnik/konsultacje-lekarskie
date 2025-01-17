import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Availability, TimeSlot, Absence } from '../models/slot.model';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private baseUrl = 'http://localhost:3000';
  private availabilityUrl = `${this.baseUrl}/availability`;
  private absencesUrl = `${this.baseUrl}/absences`;

  constructor(private http: HttpClient) {}

  getAvailabilityForDoctor(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Observable<Availability[]> {
    // JSON Server filtering
    const url = `${this.availabilityUrl}?doctorId=${doctorId}`;
    return this.http.get<Availability[]>(url).pipe(
      map((data) => {
        console.log('Raw API response:', data);
        // Filter by date range on client side since JSON Server doesn't support date range queries
        const filtered = data.filter(
          (item) => item.date >= startDate && item.date <= endDate
        );
        console.log('Filtered data:', filtered);
        return filtered;
      })
    );
  }

  getAbsences(doctorId: string): Observable<Absence[]> {
    // JSON Server filtering
    const url = `${this.absencesUrl}?doctorId=${doctorId}`;
    return this.http.get<Absence[]>(url).pipe(
      map((absences) => {
        console.log('Loaded absences:', absences);
        return absences;
      })
    );
  }

  addAbsence(absence: Absence): Observable<Absence> {
    // Ensure the absence has an ID for JSON Server
    const newAbsence = {
      ...absence,
      id: Date.now().toString(), // Generate ID if not provided
    };
    return this.http.post<Absence>(this.absencesUrl, newAbsence);
  }

  deleteAbsence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.absencesUrl}/${id}`);
  }

  setAvailability(availability: Availability): Observable<Availability> {
    // Ensure we have an ID for JSON Server
    const newAvailability = {
      ...availability,
      id: availability.id || Date.now().toString(),
    };
    console.log('Saving availability:', newAvailability);
    return this.http.post<Availability>(this.availabilityUrl, newAvailability);
  }

  updateAvailability(availability: Availability): Observable<Availability> {
    return this.http.put<Availability>(
      `${this.availabilityUrl}/${availability.id}`,
      availability
    );
  }

  generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    let hour = 6;
    let minute = 0;
    while (hour < 18 || (hour === 18 && minute === 0)) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
      minute += 30;
      if (minute === 60) {
        hour += 1;
        minute = 0;
      }
      const endTime = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;
      slots.push({
        startTime,
        endTime,
        isBooked: false,
        patientId: null,
        isCancelled: false,
      });
    }
    console.log('Generated slots:', slots);
    return slots;
  }

  bookAppointment(
    availability: Availability,
    slot: TimeSlot,
    patientId: string
  ): Observable<Availability> {
    const updatedSlots = availability.slots.map((s) =>
      s.startTime === slot.startTime && s.endTime === slot.endTime
        ? { ...s, isBooked: true, patientId, isCancelled: false }
        : s
    );
    const updatedAvailability = { ...availability, slots: updatedSlots };
    return this.updateAvailability(updatedAvailability);
  }

  // Since JSON Server doesn't support complex operations,
  // we'll handle cancellation by updating each affected availability record
  cancelAppointmentsForAbsence(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Observable<void> {
    // First get all availabilities in the date range
    return this.getAvailabilityForDoctor(doctorId, startDate, endDate).pipe(
      map((availabilities) => {
        // Update each availability
        availabilities.forEach((availability) => {
          const updatedSlots = availability.slots.map((slot) => ({
            ...slot,
            isCancelled: slot.isBooked ? true : false,
          }));

          const updatedAvailability = {
            ...availability,
            slots: updatedSlots,
          };

          this.updateAvailability(updatedAvailability).subscribe();
        });
      })
    );
  }
}
