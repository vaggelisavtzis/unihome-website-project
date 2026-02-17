import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, StudentRegistrationPayload } from '../../../services/auth.service';
import { AEGEAN_SAMOS_DEPARTMENTS, AEGEAN_UNIVERSITY } from '../../../shared/education-options';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './student-register.html',
  styleUrls: ['./student-register.scss']
})
export class StudentRegisterComponent {
  readonly universityOptions = [AEGEAN_UNIVERSITY];
  readonly departmentOptions = AEGEAN_SAMOS_DEPARTMENTS;

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    university: AEGEAN_UNIVERSITY,
    department: AEGEAN_SAMOS_DEPARTMENTS[0] ?? '',
    isStudent: true,
    password: '',
    confirmPassword: ''
  };
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onUniversityChange(): void {
    if (!this.departmentOptions.includes(this.formData.department)) {
      this.formData.department = this.departmentOptions[0] ?? '';
    }
  }

  private parseAge(value: unknown): number | undefined {
    const raw = typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';
    if (!raw) {
      return undefined;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    const rounded = Math.round(parsed);
    if (rounded < 16 || rounded > 120) {
      return undefined;
    }
    return rounded;
  }

  onSubmit() {
    if (this.loading) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const firstName = this.formData.firstName.trim();
    if (!firstName.length) {
      this.errorMessage = 'Συμπλήρωσε όνομα.';
      return;
    }

    const lastName = this.formData.lastName.trim();
    if (!lastName.length) {
      this.errorMessage = 'Συμπλήρωσε επώνυμο.';
      return;
    }

    const password = this.formData.password ?? '';
    if (password.length < 8) {
      this.errorMessage = 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.';
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

    this.formData.email = email;
    this.formData.phone = normalizedPhone;

    const payload: StudentRegistrationPayload = {
      firstName,
      lastName,
      email,
      phone: normalizedPhone,
      age: this.parseAge(this.formData.age),
      isStudent: !!this.formData.isStudent,
      university: this.formData.isStudent ? AEGEAN_UNIVERSITY : '',
      department: this.formData.isStudent
        ? (this.departmentOptions.includes(this.formData.department)
          ? this.formData.department
          : this.departmentOptions[0] ?? '')
        : '',
      password,
      confirmPassword: this.formData.confirmPassword
    };

    this.loading = true;
    this.authService.registerStudent(payload).subscribe({
      next: result => {
        this.loading = false;
        if (!result.success) {
          this.errorMessage = result.message ?? 'Η εγγραφή απέτυχε. Δοκίμασε ξανά.';
          return;
        }

        this.successMessage = 'Η εγγραφή ολοκληρώθηκε! Καλωσήρθες στο Unihome.';
        this.router.navigate(['/']);
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
}
