import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { DoctorService } from '../../services/doctor.service';
import { Availability, TimeSlot, Absence } from '../../models/slot.model';
import { User } from '../../models/user.model';
import { DatePipe } from '@angular/common';

@Component({
  standalone: false,
  selector: 'app-patient-calendar',
  templateUrl: './patient-calendar.component.html',
  styleUrl: './patient-calendar.component.scss',
  providers: [DatePipe],
})
export class PatientCalendarComponent implements OnInit {
  weekDays: Date[] = [];
  startDate: Date = new Date();
  endDate: Date = new Date();
  availableSlots: TimeSlot[] = [];
  availabilities: Availability[] = [];
  doctors: User[] = [];
  absences: Absence[] = [];
  selectedDoctorId: string | null = null;

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
    this.doctorService.getDoctors().subscribe((doctors) => {
      this.doctors = doctors;
    });
  }

  onDoctorChange() {
    console.log('Doctor changed:', this.selectedDoctorId);
    if (this.selectedDoctorId) {
      this.loadAbsences();
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
        }
      );
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  isSlotAvailable(day: Date, slot: TimeSlot): boolean {
    if (this.isDoctorAbsent(day)) return false;

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
        !s.isBooked &&
        !s.isCancelled
    );
  }
  isSlotCancelled(day: Date, slot: TimeSlot): boolean {
    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    if (!availability) return false;

    return availability.slots.some(
      (s) =>
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime &&
        s.isBooked &&
        s.isCancelled
    );
  }
  isDoctorAbsent(day: Date): boolean {
    const dayStr = this.formatDate(day);
    return this.absences.some(
      (absence) => dayStr >= absence.startDate && dayStr <= absence.endDate
    );
  }

  loadAbsences() {
    if (!this.selectedDoctorId) return;

    this.availabilityService.getAbsences(this.selectedDoctorId).subscribe(
      (absences) => {
        console.log('Loaded absences:', absences);
        this.absences = absences;
        this.loadAvailabilities();
      },
      (error) => {
        console.error('Error loading absences:', error);
      }
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
      return;
    }

    if (this.isDoctorAbsent(day)) {
      return;
    }

    const availability = this.availabilities.find(
      (a) => a.date === this.formatDate(day)
    );

    if (!availability) return;

    if (this.isMyBooking(day, slot)) {
      const updatedSlots = availability.slots.map((s) =>
        s.startTime === slot.startTime && s.endTime === slot.endTime
          ? { ...s, isBooked: false, patientId: null, isCancelled: false }
          : s
      );

      const updatedAvailability = {
        ...availability,
        slots: updatedSlots,
      };

      this.availabilityService
        .updateAvailability(updatedAvailability)
        .subscribe(
          () => {
            this.loadAvailabilities();
          },
          (error) => {
            console.error('Error cancelling appointment:', error);
          }
        );
      return;
    }

    if (this.isSlotBooked(day, slot) || this.isSlotCancelled(day, slot)) {
      return;
    }

    if (this.isSlotAvailable(day, slot)) {
      const updatedSlots = availability.slots.map((s) =>
        s.startTime === slot.startTime && s.endTime === slot.endTime
          ? {
              ...s,
              isBooked: true,
              patientId: currentUser.id,
              isCancelled: false,
            }
          : s
      );

      const updatedAvailability = {
        ...availability,
        slots: updatedSlots,
      };

      this.availabilityService
        .updateAvailability(updatedAvailability)
        .subscribe(
          () => {
            this.loadAvailabilities();
          },
          (error) => {
            console.error('Error booking appointment:', error);
          }
        );
    }
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
  getSlotTitle(day: Date, slot: TimeSlot): string {
    if (this.isDoctorAbsent(day)) {
      return 'Lekarz nieobecny w tym dniu';
    }
    if (this.isMyBooking(day, slot) && this.isSlotCancelled(day, slot)) {
      return 'Twoja wizyta została anulowana';
    }
    if (this.isSlotCancelled(day, slot)) {
      return 'Wizyta odwołana z powodu nieobecności lekarza';
    }
    if (this.isMyBooking(day, slot)) {
      return 'Kliknij aby anulować wizytę';
    }
    if (this.isSlotBooked(day, slot)) {
      return 'Termin zajęty';
    }
    if (this.isSlotAvailable(day, slot)) {
      return 'Kliknij aby zarezerwować wizytę';
    }
    return '';
  }
}
