import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <h2>Logowanie</h2>
        <div class="form-group">
          <label>Email:</label>
          <input type="email" formControlName="email" class="form-control" />
        </div>
        <div class="form-group">
          <label>Hasło:</label>
          <input
            type="password"
            formControlName="password"
            class="form-control"
          />
        </div>
        <button
          type="submit"
          [disabled]="loginForm.invalid"
          class="btn btn-primary"
        >
          Zaloguj
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .login-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
      .form-group {
        margin-bottom: 1rem;
      }
      .form-control {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.25rem;
        border: 1px solid #ccc;
        border-radius: 4px;
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
      .btn-primary:disabled {
        background-color: #ccc;
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe(
        (user) => {
          if (user.role === 'doctor') {
            this.router.navigate(['/doctor-calendar']);
          } else {
            this.router.navigate(['/patient-calendar']);
          }
        },
        (error) => {
          console.error('Login failed:', error);
        }
      );
    }
  }
}
