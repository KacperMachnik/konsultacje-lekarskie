import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Availability, TimeSlot } from '../models/slot.model';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private apiUrl = 'http://localhost:3000/availability';

  constructor(private http: HttpClient) {}

  getAvailabilityForDoctor(
    doctorId: string,
    startDate: string,
    endDate: string
  ): Observable<Availability[]> {
    // Dodajemy date do URL, aby filtrować po stronie API
    const url = `${this.apiUrl}?doctorId=${doctorId}&date=${startDate}`;
    console.log('Requesting:', url);

    return this.http.get<Availability[]>(url).pipe(
      map((data) => {
        console.log('Raw API response:', data);
        // Filtrujemy tylko te rekordy, które pasują do wybranej daty
        const filtered = data.filter((item) => item.date === startDate);
        console.log('Filtered data:', filtered);
        return filtered;
      })
    );
  }

  setAvailability(availability: Availability): Observable<Availability> {
    console.log('Saving availability:', availability);
    return this.http.post<Availability>(this.apiUrl, availability);
  }

  updateAvailability(availability: Availability): Observable<Availability> {
    return this.http.put<Availability>(
      `${this.apiUrl}/${availability.id}`,
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
        ? { ...s, isBooked: true, patientId }
        : s
    );
    const updatedAvailability = { ...availability, slots: updatedSlots };

    return this.http.put<Availability>(
      `${this.apiUrl}/${availability.id}`,
      updatedAvailability
    );
  }
}
