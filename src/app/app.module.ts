import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // Dodaj DatePipe

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { DoctorCalendarComponent } from './components/doctor-calendar/doctor-calendar.component';
import { PatientCalendarComponent } from './components/patient-calendar/patient-calendar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DoctorCalendarComponent,
    PatientCalendarComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
