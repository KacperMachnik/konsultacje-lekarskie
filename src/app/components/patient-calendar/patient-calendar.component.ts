import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import { Availability, TimeSlot } from '../../models/slot.model';
import { User } from '../../models/user.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-patient-calendar',
  template: `
    <div class="calendar-container">
      <h2>Kalendarz wizyt</h2>

      <div class="doctor-selector">
        <label>Wybierz lekarza:</label>
        <select
          [(ngModel)]="selectedDoctorId"
          (change)="onDoctorChange()"
          class="form-control"
        >
          <option [ngValue]="null">Wybierz...</option>
          <option *ngFor="let doctor of doctors" [value]="doctor.id">
            {{ doctor.name }}
          </option>
        </select>
      </div>

      <div class="navigation">
        <button (click)="previousWeek()">← Poprzedni tydzień</button>
        <span>
          {{ datePipe.transform(startDate, 'dd.MM.yyyy') }} -
          {{ datePipe.transform(endDate, 'dd.MM.yyyy') }}
        </span>
        <button (click)="nextWeek()">Następny tydzień →</button>
      </div>

      <div class="week-calendar" *ngIf="selectedDoctorId">
        <div class="headers">
          <div class="time-header">Godzina</div>
          <div *ngFor="let day of weekDays" class="day-header">
            {{ datePipe.transform(day, 'EEEE') }}<br />
            {{ datePipe.transform(day, 'dd.MM') }}
          </div>
        </div>

        <div class="time-slots">
          <ng-container *ngFor="let slot of availableSlots">
            <div class="time-row">
              <div class="time-label">
                {{ slot.startTime }} - {{ slot.endTime }}
              </div>
              <div
                *ngFor="let day of weekDays"
                class="slot-cell"
                [class.available]="isSlotAvailable(day, slot)"
                [class.booked]="
                  isSlotBooked(day, slot) && !isMyBooking(day, slot)
                "
                [class.my-booking]="isMyBooking(day, slot)"
                [title]="
                  isMyBooking(day, slot) ? 'Kliknij aby anulować wizytę' : ''
                "
                (click)="bookAppointment(day, slot)"
              ></div>
            </div>
          </ng-container>
        </div>
      </div>

      <div class="legend" *ngIf="selectedDoctorId">
        <h3>Legenda:</h3>
        <div class="legend-item">
          <div class="legend-color available"></div>
          <span>Dostępny termin</span>
        </div>
        <div class="legend-item">
          <div class="legend-color booked"></div>
          <span>Termin zajęty</span>
        </div>
        <div class="legend-item">
          <div class="legend-color my-booking"></div>
          <span>Twoja wizyta (kliknij aby anulować)</span>
        </div>
      </div>

      <div *ngIf="message" class="message" [class.error]="isError">
        {{ message }}
      </div>
    </div>
  `,
  styles: [
    `
      .calendar-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .doctor-selector {
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
      }
      .week-calendar {
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
      }
      .headers {
        display: grid;
        grid-template-columns: 120px repeat(7, 1fr);
        background: #f5f5f5;
      }
      .time-header,
      .day-header {
        padding: 1rem;
        text-align: center;
        border-bottom: 1px solid #ccc;
        border-right: 1px solid #ccc;
        font-weight: bold;
      }
      .time-slots {
        display: grid;
      }
      .time-row {
        display: grid;
        grid-template-columns: 120px repeat(7, 1fr);
        border-bottom: 1px solid #eee;
      }
      .time-label {
        padding: 0.5rem;
        background: #f8f9fa;
        border-right: 1px solid #ccc;
        font-size: 0.9rem;
      }
      .slot-cell {
        padding: 1rem;
        border-right: 1px solid #eee;
        cursor: pointer;
        min-height: 50px;
      }
      .available {
        background-color: #90ee90;
        transition: background-color 0.2s;
      }
      .available:hover {
        background-color: #70cc70;
      }
      .booked {
        background-color: #ffb6c1;
        cursor: not-allowed;
      }
      .my-booking {
        background-color: #007bff;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .my-booking:hover {
        background-color: #0056b3;
      }
      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        background: #007bff;
        color: white;
        cursor: pointer;
      }
      button:hover {
        background: #0056b3;
      }
      .message {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 4px;
        background-color: #d4edda;
        color: #155724;
      }
      .message.error {
        background-color: #f8d7da;
        color: #721c24;
      }
      .legend {
        margin-top: 1rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 4px;
      }
      .legend h3 {
        margin-top: 0;
        margin-bottom: 0.5rem;
      }
      .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .legend-color {
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
        border-radius: 4px;
      }
      .legend-item:last-child {
        margin-bottom: 0;
      }
    `,
  ],
  providers: [DatePipe],
})
export class PatientCalendarComponent implements OnInit {
  weekDays: Date[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  availableSlots: TimeSlot[] = [];
  availabilities: Availability[] = [];
  doctors: User[] = [];
  selectedDoctorId: number | null = null;
  message: string = '';
  isError: boolean = false;

  constructor(
    private availabilityService: AvailabilityService,
    private authService: AuthService,
    private doctorService: DoctorService,
    public datePipe: DatePipe
  ) {}

  ngOnInit() {
    console.log('Component initialized');
    this.loadDoctors();
    this.availableSlots = this.availabilityService.generateTimeSlots();
    console.log('Generated slots:', this.availableSlots);
    this.calculateWeekDays();
    console.log('Calculated week days:', this.weekDays);
  }

  loadDoctors() {
    this.doctorService.getDoctors().subscribe(
      (doctors) => {
        this.doctors = doctors;
      },
      (error) => {
        this.showMessage('Nie udało się załadować listy lekarzy', true);
      }
    );
  }

  onDoctorChange() {
    console.log('Doctor changed:', this.selectedDoctorId);
    if (this.selectedDoctorId) {
      this.selectedDoctorId = Number(this.selectedDoctorId);
      console.log('Converted doctor ID:', this.selectedDoctorId);
      this.loadAvailabilities();
    }
  }

  calculateWeekDays() {
    this.weekDays = [];
    const currentDate = new Date(this.startDate);
    const day = currentDate.getDay();
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
    currentDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      this.weekDays.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.startDate = new Date(this.weekDays[0]);
    this.endDate = new Date(this.weekDays[6]);
  }

  previousWeek() {
    this.startDate.setDate(this.startDate.getDate() - 7);
    this.calculateWeekDays();
    if (this.selectedDoctorId) {
      this.loadAvailabilities();
    }
  }

  nextWeek() {
    this.startDate.setDate(this.startDate.getDate() + 7);
    this.calculateWeekDays();
    if (this.selectedDoctorId) {
      this.loadAvailabilities();
    }
  }

  loadAvailabilities() {
    if (!this.selectedDoctorId) return;

    console.log('Loading availabilities for dates:', {
      start: this.formatDate(this.startDate),
      end: this.formatDate(this.endDate),
      doctorId: this.selectedDoctorId,
    });

    this.availabilityService
      .getAvailabilityForDoctor(
        this.selectedDoctorId,
        this.formatDate(this.startDate),
        this.formatDate(this.endDate)
      )
      .subscribe(
        (availabilities) => {
          console.log('Received availabilities:', availabilities);
          this.availabilities = availabilities;
        },
        (error) => {
          console.error('Error loading availabilities:', error);
          this.showMessage('Nie udało się załadować harmonogramu', true);
        }
      );
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isSlotAvailable(day: Date, slot: TimeSlot): boolean {
    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    console.log('Checking availability for:', {
      date: this.formatDate(day),
      slot,
      foundAvailability: availability,
      allAvailabilities: this.availabilities,
    });

    if (!availability) return false;

    return availability.slots.some(
      (s) =>
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime &&
        !s.isBooked
    );
  }

  isSlotBooked(day: Date, slot: TimeSlot): boolean {
    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    if (!availability) return false;

    return availability.slots.some(
      (s) =>
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime &&
        s.isBooked
    );
  }

  bookAppointment(day: Date, slot: TimeSlot) {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.showMessage('Musisz być zalogowany aby zarezerwować wizytę', true);
      return;
    }

    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    if (!availability) return;

    // Jeśli to moja rezerwacja, anuluj ją
    if (this.isMyBooking(day, slot)) {
      // Tworzymy kopię slotu i ustawiamy jako dostępny
      const updatedSlots = availability.slots.map((s) =>
        s.startTime === slot.startTime && s.endTime === slot.endTime
          ? { ...s, isBooked: false, patientId: null }
          : s
      );

      const updatedAvailability = {
        ...availability,
        slots: updatedSlots,
      };

      this.availabilityService
        .updateAvailability(updatedAvailability)
        .subscribe(
          (response) => {
            this.showMessage('Wizyta została anulowana');
            this.loadAvailabilities();
          },
          (error) => {
            this.showMessage('Nie udało się anulować wizyty', true);
          }
        );
      return;
    }

    // Jeśli slot jest zajęty przez kogoś innego, nie pozwalaj na rezerwację
    if (this.isSlotBooked(day, slot)) return;

    // Standardowa rezerwacja dla dostępnego slotu
    if (this.isSlotAvailable(day, slot)) {
      const updatedSlots = availability.slots.map((s) =>
        s.startTime === slot.startTime && s.endTime === slot.endTime
          ? { ...s, isBooked: true, patientId: currentUser.id }
          : s
      );

      const updatedAvailability = {
        ...availability,
        slots: updatedSlots,
      };

      this.availabilityService
        .updateAvailability(updatedAvailability)
        .subscribe(
          (response) => {
            this.showMessage('Wizyta została zarezerwowana pomyślnie');
            this.loadAvailabilities();
          },
          (error) => {
            this.showMessage('Nie udało się zarezerwować wizyty', true);
          }
        );
    }
  }

  showMessage(message: string, isError: boolean = false) {
    this.message = message;
    this.isError = isError;
    setTimeout(() => {
      this.message = '';
    }, 3000);
  }
  isMyBooking(day: Date, slot: TimeSlot): boolean {
    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    if (!availability) return false;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return false;

    return availability.slots.some(
      (s) =>
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime &&
        s.isBooked &&
        s.patientId === currentUser.id
    );
  }
}
