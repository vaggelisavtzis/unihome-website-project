import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const studentGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUserSnapshot();

  if (user && user.role === 'student') {
    return true;
  }

  router.navigate(['/auth/login'], {
    queryParams: {
      redirectTo: state.url,
      role: 'student'
    }
  });
  return false;
};
