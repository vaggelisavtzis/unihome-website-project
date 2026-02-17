import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, OwnerRegistrationPayload } from '../../../services/auth.service';

@Component({
  selector: 'app-owner-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './owner-register.html',
  styleUrls: ['./owner-register.scss']
})
export class OwnerRegisterComponent {
  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    address: '',
    password: '',
    confirmPassword: ''
  };
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const firstName = this.formData.firstName.trim();
    const lastName = this.formData.lastName.trim();
    const address = this.formData.address.trim();
    const password = this.formData.password;
    const confirmPassword = this.formData.confirmPassword;

    if (!firstName || !lastName) {
      this.errorMessage = 'Συμπλήρωσε όνομα και επώνυμο.';
      return;
    }

    if (!address) {
      this.errorMessage = 'Συμπλήρωσε έδρα/διεύθυνση.';
      return;
    }

    if (!password || !confirmPassword) {
      this.errorMessage = 'Συμπλήρωσε και επιβεβαίωσε τον κωδικό σου.';
      return;
    }

    const email = this.formData.email.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      this.errorMessage = 'Συμπλήρωσε έγκυρο email.';
      return;
    }

    const normalizedPhone = this.normalizePhone(this.formData.phone);
    if (!normalizedPhone) {
      this.errorMessage = 'Χρησιμοποίησε έγκυρο αριθμό κινητού (με ή χωρίς +country code).';
      return;
    }

    const age = this.normalizeAge(this.formData.age);
    if (age === undefined) {
      this.errorMessage = 'Συμπλήρωσε ηλικία μεταξύ 18 και 100 ετών.';
      return;
    }

    this.formData.email = email;
    this.formData.phone = normalizedPhone;

    const payload: OwnerRegistrationPayload = {
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      age,
      address,
      password,
      confirmPassword
    };

    this.loading = true;
    this.authService.registerOwner(payload).subscribe({
      next: result => {
        this.loading = false;
        if (!result.success) {
          this.errorMessage = result.message ?? 'Η εγγραφή απέτυχε. Δοκίμασε ξανά.';
          return;
        }

        this.successMessage = 'Η εγγραφή ολοκληρώθηκε! Μπορείς να καταχωρήσεις αγγελίες.';
        this.router.navigate(['/properties']);
      },
      error: error => {
        this.loading = false;
        const message = (error instanceof Error ? error.message : undefined) ?? 'Η εγγραφή απέτυχε. Δοκίμασε ξανά.';
        this.errorMessage = message;
      }
    });
  }

  private normalizePhone(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return undefined;
    }
    const normalized = trimmed.replace(/[\s\-]/g, '');
    if (!/^\+?\d{6,15}$/.test(normalized)) {
      return undefined;
    }
    return normalized;
  }

  private isValidEmail(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(trimmed);
  }

  private normalizeAge(value: unknown): number | undefined {
    const raw = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    const trimmed = raw.trim();
    if (!trimmed.length) {
      return undefined;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    const rounded = Math.round(parsed);
    if (rounded < 18 || rounded > 100) {
      return undefined;
    }
    return rounded;
  }
}
