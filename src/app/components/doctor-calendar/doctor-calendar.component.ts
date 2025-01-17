import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { TimeSlot, Availability } from '../../models/slot.model';
import { DatePipe } from '@angular/common';

interface TimeRange {
  startTime: string;
  endTime: string;
}

interface Absence {
  id: string;
  doctorId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

@Component({
  selector: 'app-doctor-calendar',
  template: `
    <div class="calendar-container">
      <h2>Kalendarz dostępności</h2>

      <!-- Tabs -->
      <div class="tabs-container">
        <button
          [class.active]="activeTab === 'availability'"
          (click)="setActiveTab('availability')"
          class="tab-button"
        >
          Dostępność
        </button>
        <button
          [class.active]="activeTab === 'absence'"
          (click)="setActiveTab('absence')"
          class="tab-button"
        >
          Nieobecności
        </button>
      </div>

      <!-- Availability Tab Content -->
      <div *ngIf="activeTab === 'availability'" class="tab-content">
        <div class="availability-type">
          <label class="radio-label">
            <input
              type="radio"
              [value]="false"
              [(ngModel)]="isRecurring"
              name="availabilityType"
            />
            Jednorazowa dostępność
          </label>
          <label class="radio-label">
            <input
              type="radio"
              [value]="true"
              [(ngModel)]="isRecurring"
              name="availabilityType"
            />
            Cykliczna dostępność
          </label>
        </div>

        <!-- One-time Availability -->
        <div *ngIf="!isRecurring" class="single-availability">
          <div class="date-selector">
            <label>Data:</label>
            <input
              type="date"
              [(ngModel)]="selectedDate"
              (change)="loadAvailability()"
              class="form-control"
            />
          </div>

          <div class="slots-container">
            <div *ngFor="let slot of availableSlots" class="slot-item">
              <label>
                <input
                  type="checkbox"
                  [checked]="isSlotSelected(slot)"
                  (change)="toggleSlot(slot)"
                  [disabled]="isSlotInAbsence(slot)"
                />
                {{ slot.startTime }} - {{ slot.endTime }}
              </label>
            </div>
          </div>
        </div>

        <!-- Recurring Availability -->
        <div *ngIf="isRecurring" class="recurring-availability">
          <div class="date-range">
            <div class="form-group">
              <label>Od:</label>
              <input
                type="date"
                [(ngModel)]="recurringStartDate"
                class="form-control"
              />
            </div>
            <div class="form-group">
              <label>Do:</label>
              <input
                type="date"
                [(ngModel)]="recurringEndDate"
                class="form-control"
              />
            </div>
          </div>

          <div class="weekdays-selector">
            <h4>Dni tygodnia:</h4>
            <div class="weekdays-grid">
              <label
                *ngFor="let day of weekDays; let i = index"
                class="day-checkbox"
              >
                <input
                  type="checkbox"
                  [(ngModel)]="selectedWeekDays[i]"
                  [value]="i + 1"
                />
                {{ day }}
              </label>
            </div>
          </div>

          <div class="time-ranges">
            <h4>Przedziały czasowe:</h4>
            <div
              *ngFor="let range of timeRanges; let i = index"
              class="time-range"
            >
              <input
                type="time"
                [(ngModel)]="range.startTime"
                class="form-control"
              />
              <span>-</span>
              <input
                type="time"
                [(ngModel)]="range.endTime"
                class="form-control"
              />
              <button
                (click)="removeTimeRange(i)"
                class="btn btn-danger"
                *ngIf="timeRanges.length > 1"
              >
                Usuń
              </button>
            </div>
            <button (click)="addTimeRange()" class="btn btn-secondary">
              Dodaj przedział czasowy
            </button>
          </div>
        </div>
      </div>

      <!-- Absence Tab Content -->
      <div *ngIf="activeTab === 'absence'" class="tab-content">
        <div class="absence-form">
          <div class="form-group">
            <label>Od:</label>
            <input
              type="date"
              [(ngModel)]="absenceStart"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>Do:</label>
            <input type="date" [(ngModel)]="absenceEnd" class="form-control" />
          </div>
          <div class="form-group">
            <label>Powód:</label>
            <input
              type="text"
              [(ngModel)]="absenceReason"
              class="form-control"
              placeholder="Podaj powód nieobecności"
            />
          </div>
          <button (click)="addAbsence()" class="btn btn-primary">
            Dodaj nieobecność
          </button>
        </div>

        <div class="absences-list">
          <h4>Lista nieobecności:</h4>
          <div *ngFor="let absence of absences" class="absence-item">
            <div class="absence-details">
              <span class="dates">
                {{ absence.startDate | date }} - {{ absence.endDate | date }}
              </span>
              <span class="reason">{{ absence.reason }}</span>
            </div>
            <button
              (click)="deleteAbsence(absence.id)"
              class="btn btn-danger btn-sm"
            >
              Usuń
            </button>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <button
        (click)="saveAvailability()"
        class="btn btn-primary save-button"
        *ngIf="activeTab === 'availability'"
      >
        Zapisz dostępność
      </button>
    </div>
  `,
  styles: [
    `
      .calendar-container {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .tabs-container {
        margin-bottom: 2rem;
        border-bottom: 1px solid #dee2e6;
      }

      .tab-button {
        padding: 0.75rem 1.5rem;
        border: 1px solid transparent;
        background: none;
        cursor: pointer;
        margin-right: 0.5rem;
        border-radius: 4px 4px 0 0;
      }

      .tab-button.active {
        border-color: #dee2e6 #dee2e6 #fff;
        background-color: #fff;
      }

      .tab-content {
        background: #fff;
        padding: 1.5rem;
        border-radius: 0 0 4px 4px;
      }

      .availability-type {
        margin-bottom: 1.5rem;
      }

      .radio-label {
        margin-right: 1.5rem;
      }

      .form-control {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ced4da;
        border-radius: 4px;
        margin-bottom: 1rem;
      }

      .slots-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }

      .slot-item {
        padding: 0.5rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
      }

      .weekdays-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
        margin: 1rem 0;
      }

      .day-checkbox {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .time-range {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .time-range input[type='time'] {
        width: 150px;
      }

      .btn {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .btn-primary {
        background-color: #007bff;
        color: white;
      }

      .btn-secondary {
        background-color: #6c757d;
        color: white;
      }

      .btn-danger {
        background-color: #dc3545;
        color: white;
      }

      .save-button {
        margin-top: 2rem;
      }

      .absence-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin-bottom: 1rem;
      }

      .absence-details {
        display: flex;
        flex-direction: column;
      }

      .dates {
        font-weight: bold;
      }

      .reason {
        color: #6c757d;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class DoctorCalendarComponent implements OnInit {
  // Basic availability properties
  selectedDate: string = '';
  availableSlots: TimeSlot[] = [];
  selectedSlots: TimeSlot[] = [];
  isRecurring: boolean = false;
  selectedDay: number | null = null;

  // UI state
  activeTab: 'availability' | 'absence' = 'availability';

  // Recurring availability properties
  recurringStartDate: string = '';
  recurringEndDate: string = '';
  weekDays = [
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
    'Niedziela',
  ];
  selectedWeekDays: boolean[] = new Array(7).fill(false);
  timeRanges: TimeRange[] = [{ startTime: '', endTime: '' }];

  // Absence properties
  absences: Absence[] = [];
  absenceStart: string = '';
  absenceEnd: string = '';
  absenceReason: string = '';

  constructor(
    private availabilityService: AvailabilityService,
    private authService: AuthService,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.availableSlots = this.availabilityService.generateTimeSlots();
    this.loadAvailability();
    this.loadAbsences();
  }

  setActiveTab(tab: 'availability' | 'absence') {
    this.activeTab = tab;
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
        .subscribe((availability) => {
          if (availability.length > 0) {
            this.selectedSlots = [...availability[0].slots];
            this.isRecurring = availability[0].isRecurring;
            this.selectedDay = availability[0].recurringDay;
          } else {
            this.selectedSlots = [];
          }
        });
    }
  }

  loadAbsences() {
    const doctorId = this.authService.currentUserValue?.id;
    if (doctorId) {
      // Implement loading absences from service
    }
  }

  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlots.some(
      (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
    );
  }

  isSlotInAbsence(slot: TimeSlot): boolean {
    // Implement checking if slot falls within any absence period
    return false;
  }

  toggleSlot(slot: TimeSlot) {
    if (this.isSlotInAbsence(slot)) return;

    const index = this.selectedSlots.findIndex(
      (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
    );

    if (index === -1) {
      this.selectedSlots.push({
        ...slot,
        isBooked: false,
        patientId: null,
      });
    } else {
      if (!this.selectedSlots[index].isBooked) {
        this.selectedSlots.splice(index, 1);
      }
    }
  }

  addTimeRange() {
    this.timeRanges.push({ startTime: '', endTime: '' });
  }

  removeTimeRange(index: number) {
    if (this.timeRanges.length > 1) {
      this.timeRanges.splice(index, 1);
    }
  }

  addAbsence() {
    const doctorId = this.authService.currentUserValue?.id;
    if (doctorId && this.absenceStart && this.absenceEnd) {
      const newAbsence: Absence = {
        id: Date.now().toString(),
        doctorId,
        startDate: this.absenceStart,
        endDate: this.absenceEnd,
        reason: this.absenceReason,
      };

      // Here you would:
      // 1. Check for conflicts with existing appointments
      // 2. Handle cancelling conflicting appointments if necessary
      // 3. Save the absence
      this.absences.push(newAbsence);
      this.clearAbsenceForm();
    }
  }

  deleteAbsence(id: string) {
    this.absences = this.absences.filter((absence) => absence.id !== id);
  }

  clearAbsenceForm() {
    this.absenceStart = '';
    this.absenceEnd = '';
    this.absenceReason = '';
  }

  generateAvailabilityFromTimeRanges(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    this.timeRanges.forEach((range) => {
      let currentTime = range.startTime;
      while (currentTime < range.endTime) {
        const [hours, minutes] = currentTime.split(':').map(Number);
        let endHour = hours;
        let endMinutes = minutes + 30;

        if (endMinutes >= 60) {
          endHour += 1;
          endMinutes = 0;
        }

        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinutes
          .toString()
          .padStart(2, '0')}`;

        slots.push({
          startTime: currentTime,
          endTime,
          isBooked: false,
          patientId: null,
        });

        currentTime = endTime;
      }
    });
    return slots;
  }

  saveAvailability() {
    const doctorId = this.authService.currentUserValue?.id;
    if (!doctorId) return;

    if (this.isRecurring) {
      // Handle recurring availability
      const selectedDays = this.selectedWeekDays
        .map((isSelected, index) => (isSelected ? index + 1 : null))
        .filter((day) => day !== null);

      if (selectedDays.length === 0) {
        alert('Proszę wybrać przynajmniej jeden dzień tygodnia');
        return;
      }

      if (!this.recurringStartDate || !this.recurringEndDate) {
        alert('Proszę wybrać zakres dat');
        return;
      }

      const slots = this.generateAvailabilityFromTimeRanges();
      if (slots.length === 0) {
        alert('Proszę zdefiniować przynajmniej jeden przedział czasowy');
        return;
      }

      // Create availabilities for each selected day within date range
      const start = new Date(this.recurringStartDate);
      const end = new Date(this.recurringEndDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay() || 7; // Convert Sunday from 0 to 7
        if (selectedDays.includes(dayOfWeek)) {
          const availability: Availability = {
            id: `${Date.now()}_${currentDate.toISOString()}`,
            doctorId,
            date: currentDate.toISOString().split('T')[0],
            slots,
            isRecurring: true,
            recurringDay: dayOfWeek,
            startDate: this.recurringStartDate,
            endDate: this.recurringEndDate,
            weekDays: selectedDays,
            timeRanges: this.timeRanges,
          };

          this.availabilityService.setAvailability(availability).subscribe(
            () => console.log('Saved availability for', currentDate),
            (error) => console.error('Error saving availability:', error)
          );
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Handle one-time availability
      const availability: Availability = {
        id: Date.now().toString(),
        doctorId,
        date: this.selectedDate,
        slots: this.selectedSlots,
        isRecurring: false,
        recurringDay: null,
      };

      this.availabilityService.setAvailability(availability).subscribe(
        (response) => {
          console.log('Availability saved successfully');
          this.loadAvailability();
        },
        (error) => {
          console.error('Error saving availability:', error);
        }
      );
    }
  }

  validateTimeRanges(): boolean {
    return this.timeRanges.every((range) => {
      if (!range.startTime || !range.endTime) return false;
      return range.startTime < range.endTime;
    });
  }

  checkAvailabilityConflicts(date: string): boolean {
    // Implement checking for conflicts with existing availabilities
    return false;
  }

  handleAbsenceConflicts(conflicts: Availability[]): void {
    conflicts.forEach((availability) => {
      const updatedSlots = availability.slots.map((slot) => ({
        ...slot,
        isBooked: false,
        patientId: null,
      }));

      this.availabilityService
        .updateAvailability({
          ...availability,
          slots: updatedSlots,
        })
        .subscribe();
    });
  }
}
