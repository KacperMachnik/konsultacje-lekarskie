import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  template: `
    <nav *ngIf="authService.currentUserValue">
      <div class="nav-content">
        <span>Witaj, {{ authService.currentUserValue.name }}</span>
        <button (click)="logout()">Wyloguj</button>
      </div>
    </nav>
    <router-outlet></router-outlet>
  `,
  styles: [
    `
      nav {
        background: #333;
        color: white;
        padding: 1rem;
      }
      .nav-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }
      button {
        padding: 0.5rem 1rem;
        background: #666;
        border: none;
        color: white;
        border-radius: 4px;
        cursor: pointer;
      }
    `,
  ],
})
export class AppComponent {
  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
