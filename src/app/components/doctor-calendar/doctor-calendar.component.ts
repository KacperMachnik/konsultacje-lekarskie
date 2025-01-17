import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { TimeSlot, Availability } from '../../models/slot.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-doctor-calendar',
  template: `
    <div class="calendar-container">
      <h2>Kalendarz dostępności</h2>

      <div class="date-selector">
        <input
          type="date"
          [(ngModel)]="selectedDate"
          (change)="loadAvailability()"
        />
      </div>

      <div class="slots-container">
        <div *ngFor="let slot of availableSlots" class="slot-item">
          <label>
            <input
              type="checkbox"
              [checked]="isSlotSelected(slot)"
              (change)="toggleSlot(slot)"
            />
            {{ slot.startTime }} - {{ slot.endTime }}
          </label>
        </div>
      </div>

      <div class="recurring-options">
        <label>
          <input type="checkbox" [(ngModel)]="isRecurring" />
          Powtarzaj co tydzień
        </label>
        <select
          *ngIf="isRecurring"
          [(ngModel)]="selectedDay"
          class="form-control"
        >
          <option value="1">Poniedziałek</option>
          <option value="2">Wtorek</option>
          <option value="3">Środa</option>
          <option value="4">Czwartek</option>
          <option value="5">Piątek</option>
        </select>
      </div>

      <button (click)="saveAvailability()" class="btn btn-primary">
        Zapisz dostępność
      </button>
    </div>
  `,
  styles: [
    `
      .calendar-container {
        padding: 2rem;
      }
      .slots-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }
      .slot-item {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 1rem;
      }
      .btn-primary {
        background-color: #007bff;
        color: white;
      }
    `,
  ],
})
export class DoctorCalendarComponent implements OnInit {
  selectedDate: string = '';
  availableSlots: TimeSlot[] = [];
  selectedSlots: TimeSlot[] = [];
  isRecurring: boolean = false;
  selectedDay: number | null = null;

  constructor(
    private availabilityService: AvailabilityService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Ustawiamy dzisiejszą datę jako domyślną
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    // Generujemy dostępne sloty
    this.availableSlots = this.availabilityService.generateTimeSlots();
    // Ładujemy dostępności dla wybranego dnia
    this.loadAvailability();
  }

  loadAvailability() {
    const doctorId = this.authService.currentUserValue?.id;
    if (doctorId) {
      this.availabilityService
        .getAvailabilityForDoctor(
          doctorId,
          this.selectedDate,
          this.selectedDate
        )
        .subscribe((availabilities) => {
          // Znajdź dostępność dla konkretnej daty
          const availabilityForDate = availabilities.find(
            (a) => a.date === this.selectedDate
          );

          if (availabilityForDate) {
            // Jeśli znaleziono dostępność dla wybranej daty
            this.selectedSlots = [...availabilityForDate.slots]; // Używamy spread operator dla stworzenia nowej tablicy
            this.isRecurring = availabilityForDate.isRecurring;
            this.selectedDay = availabilityForDate.recurringDay;
          } else {
            // Jeśli nie ma dostępności na ten dzień, resetujemy wszystkie wartości
            this.selectedSlots = [];
            this.isRecurring = false;
            this.selectedDay = null;
          }
        });
    }
  }

  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlots.some(
      (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
    );
  }

  toggleSlot(slot: TimeSlot) {
    const index = this.selectedSlots.findIndex(
      (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
    );

    if (index === -1) {
      // Dodaj nowy slot z wszystkimi właściwościami
      this.selectedSlots.push({
        ...slot,
        isBooked: false,
        patientId: null,
      });
    } else {
      // Usuń slot, jeśli nie jest zarezerwowany
      if (!this.selectedSlots[index].isBooked) {
        this.selectedSlots.splice(index, 1);
      }
    }
  }

  saveAvailability() {
    const doctorId = this.authService.currentUserValue?.id;
    if (doctorId) {
      const availability: Availability = {
        id: String(Date.now()),
        doctorId,
        date: this.selectedDate,
        slots: this.selectedSlots.map((slot) => ({
          ...slot,
          isBooked: slot.isBooked || false,
          patientId: slot.patientId || null,
        })),
        isRecurring: this.isRecurring,
        recurringDay: this.isRecurring ? this.selectedDay : null,
      };

      this.availabilityService.setAvailability(availability).subscribe(
        (response) => {
          console.log('Availability saved successfully');
          // Odświeżamy widok po zapisie
          this.loadAvailability();
        },
        (error) => {
          console.error('Error saving availability:', error);
        }
      );
    }
  }
}
