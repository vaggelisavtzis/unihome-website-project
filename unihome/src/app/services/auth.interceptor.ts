import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
const API_BASE = environment.apiUrl;
const SESSION_STORAGE_KEY = 'unihome_current_user';
const ACCESS_TOKEN_STORAGE_KEY = 'unihome_access_token';

const readStoredToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const directToken = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (directToken) {
    return directToken;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return typeof parsed?.accessToken === 'string' ? parsed.accessToken : null;
  } catch {
    return null;
  }
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readStoredToken();

  if (!token) {
    return next(req);
  }

  const isApiRequest = req.url.startsWith(API_BASE);
  if (!isApiRequest) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorizedRequest);
};
