import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { AuthService, LoginPayload } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  identifier = '';
  password = '';
  userType: 'student' | 'owner' = 'student';
  loading = false;
  errorMessage = '';
  successMessage = '';
  readonly identifierFieldId = 'loginIdentifier';
  private redirectTo: string | null = null;

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const role = params.get('role');
      const redirect = params.get('redirectTo');
      if (role === 'student' || role === 'owner') {
        this.userType = role;
      }
      this.redirectTo = redirect;
    });
  }

  get identifierLabel(): string {
    return 'Email';
  }

  get identifierPlaceholder(): string {
    return 'you@example.com';
  }

  get identifierInputType(): string {
    return 'email';
  }

  onSubmit() {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const email = this.identifier.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Συμπλήρωσε έγκυρο email.';
      return;
    }

    const payload: LoginPayload = {
      identifier: email,
      method: 'email',
      password: this.password,
      role: this.userType
    };

    this.loading = true;
    this.authService.login(payload).subscribe({
      next: result => {
        this.loading = false;
        if (!result.success) {
          this.errorMessage = result.message ?? 'Η σύνδεση απέτυχε. Δοκίμασε ξανά.';
          return;
        }

        this.successMessage = 'Η σύνδεση ολοκληρώθηκε με επιτυχία!';
        const target = this.redirectTo ?? (this.userType === 'owner' ? '/properties' : '/');
        this.router.navigateByUrl(target);
      },
      error: error => {
        this.loading = false;
        const message = (error instanceof Error ? error.message : undefined) ?? 'Η σύνδεση απέτυχε. Δοκίμασε ξανά.';
        this.errorMessage = message;
      }
    });
  }

  private isValidEmail(value: string): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value);
  }
}
