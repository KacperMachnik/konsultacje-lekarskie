import { Component, OnInit } from '@angular/core';
import { AvailabilityService } from '../../services/availability.service';
import { AuthService } from '../../services/auth.service';
import { AbsenceService } from '../../services/absence.service';
import { TimeSlot, Availability, Absence } from '../../models/slot.model';
import { DatePipe } from '@angular/common';

interface TimeRange {
  startTime: string;
  endTime: string;
}

@Component({
  standalone: false,
  selector: 'app-doctor-calendar',
  templateUrl: 'doctor-calendar.component.html',
  styleUrl: 'doctor-calendar.component.scss',
})
export class DoctorCalendarComponent implements OnInit {
  selectedDate: string = '';
  availableSlots: TimeSlot[] = [];
  selectedSlots: TimeSlot[] = [];
  isRecurring: boolean = false;
  selectedDay: number | null = null;
  message: string = '';
  isError: boolean = false;

  activeTab: 'availability' | 'absence' = 'availability';

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

  absences: Absence[] = [];
  absenceStart: string = '';
  absenceEnd: string = '';
  absenceReason: string = '';

  constructor(
    private availabilityService: AvailabilityService,
    private absenceService: AbsenceService,
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
      this.absenceService.getAbsences(doctorId).subscribe(
        (absences) => {
          console.log('Loaded absences:', absences);
          this.absences = absences;
        },
        (error) => {
          console.error('Error loading absences:', error);
          this.showMessage('Nie udało się załadować listy nieobecności', true);
        }
      );
    }
  }

  isSlotSelected(slot: TimeSlot): boolean {
    return this.selectedSlots.some(
      (s) => s.startTime === slot.startTime && s.endTime === slot.endTime
    );
  }

  isSlotInAbsence(slot: TimeSlot): boolean {
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

      this.absenceService.addAbsence(newAbsence).subscribe(
        (savedAbsence) => {
          console.log('Absence saved:', savedAbsence);
          this.showMessage('Nieobecność została dodana');
          this.loadAbsences();
          this.clearAbsenceForm();
        },
        (error) => {
          console.error('Error adding absence:', error);
          this.showMessage('Nie udało się dodać nieobecności', true);
        }
      );
    } else {
      this.showMessage(
        'Proszę wypełnić datę początkową i końcową nieobecności',
        true
      );
    }
  }

  deleteAbsence(id: string) {
    this.absenceService.deleteAbsence(id).subscribe(
      () => {
        this.showMessage('Nieobecność została usunięta');
        this.loadAbsences();
      },
      (error) => {
        console.error('Error deleting absence:', error);
        this.showMessage('Nie udało się usunąć nieobecności', true);
      }
    );
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

      const start = new Date(this.recurringStartDate);
      const end = new Date(this.recurringEndDate);
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay() || 7;
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
  showMessage(message: string, isError: boolean = false) {
    this.message = message;
    this.isError = isError;
    setTimeout(() => {
      this.message = '';
      this.isError = false;
    }, 3000);
  }
}
