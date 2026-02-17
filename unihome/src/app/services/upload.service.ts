import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface UploadResponse {
  originalName: string;
  fileName: string;
  url: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly baseUrl = `${environment.apiUrl}/uploads`;

  constructor(private readonly http: HttpClient) {}

  uploadImages(category: string, files: File[]): Observable<string[]> {
    if (!files.length) {
      return of([]);
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));

    let params = new HttpParams();
    if (category?.length) {
      params = params.set('category', category);
    }

    return this.http.post<UploadResponse[]>(`${this.baseUrl}/images`, formData, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          return [];
        }
        return response
          .map(item => item?.url ?? '')
          .filter(url => typeof url === 'string' && url.length > 0);
      })
    );
  }
}
