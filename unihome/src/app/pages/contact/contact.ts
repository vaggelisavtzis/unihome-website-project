import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ContactMessageResponse, ContactService } from '../../services/contact.service';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.scss']
})
export class ContactComponent {
  formData: ContactFormData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  submitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(private contactService: ContactService) {}

  onSubmit(form: NgForm): void {
    if (this.submitting) {
      return;
    }

    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.contactService.submit(this.formData).subscribe({
      next: (response: ContactMessageResponse) => {
        const delivered = response.emailSent ? 'Το email εστάλη.' : 'Αποθηκεύτηκε το μήνυμα.';
        this.successMessage = `Λάβαμε το μήνυμά σου! ${delivered}`;
        this.submitting = false;
        form.resetForm();
      },
      error: () => {
        this.errorMessage = 'Κάτι πήγε στραβά. Δοκίμασε ξανά σε λίγο.';
        this.submitting = false;
      }
    });
  }

  onReset(form: NgForm): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.submitting = false;
    form.resetForm();
  }
}
