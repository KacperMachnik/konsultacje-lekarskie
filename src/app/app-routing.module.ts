import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DoctorCalendarComponent } from './components/doctor-calendar/doctor-calendar.component';
import { PatientCalendarComponent } from './components/patient-calendar/patient-calendar.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'doctor-calendar',
    component: DoctorCalendarComponent,
    canActivate: [AuthGuard],
    data: { roles: ['doctor'] },
  },
  {
    path: 'patient-calendar',
    component: PatientCalendarComponent,
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
