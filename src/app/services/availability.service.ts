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
    const url = `${this.availabilityUrl}?doctorId=${doctorId}`;
    return this.http.get<Availability[]>(url).pipe(
      map((data) => {
        console.log('Raw API response:', data);
        const filtered = data.filter(
          (item) => item.date >= startDate && item.date <= endDate
        );
        console.log('Filtered data:', filtered);
        return filtered;
      })
    );
  }

  getAbsences(doctorId: string): Observable<Absence[]> {
    const url = `${this.absencesUrl}?doctorId=${doctorId}`;
    return this.http.get<Absence[]>(url).pipe(
      map((absences) => {
        console.log('Loaded absences:', absences);
        return absences;
      })
    );
  }

  addAbsence(absence: Absence): Observable<Absence> {
    const newAbsence = {
      ...absence,
      id: Date.now().toString(),
    };
    return this.http.post<Absence>(this.absencesUrl, newAbsence);
  }

  setAvailability(availability: Availability): Observable<Availability> {
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
}
