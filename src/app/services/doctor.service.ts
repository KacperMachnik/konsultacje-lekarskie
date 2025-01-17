import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getDoctors(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users?role=doctor`);
  }
}
