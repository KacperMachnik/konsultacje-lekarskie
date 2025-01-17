import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Availability, TimeSlot, Absence } from '../models/slot.model';
@Injectable({
  providedIn: 'root',
})
export class AbsenceService {
  private apiUrl = 'http://localhost:3000/absences';

  constructor(private http: HttpClient) {}

  getAbsences(doctorId: string): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.apiUrl}?doctorId=${doctorId}`);
  }

  addAbsence(absence: Absence): Observable<Absence> {
    return this.http.post<Absence>(this.apiUrl, absence);
  }

  deleteAbsence(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
