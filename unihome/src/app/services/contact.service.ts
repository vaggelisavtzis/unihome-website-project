import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContactMessagePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  createdAt: string;
  emailSent?: boolean;
  recipientEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly baseUrl = `${environment.apiUrl}/contact/messages`;

  constructor(private http: HttpClient) {}

  submit(payload: ContactMessagePayload): Observable<ContactMessageResponse> {
    return this.http.post<ContactMessageResponse>(this.baseUrl, payload);
  }
}
