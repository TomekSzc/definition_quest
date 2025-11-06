import { logout } from '../slices/authSlice';
import { showToast } from '../slices/toastSlice';
import type { Dispatch } from '@reduxjs/toolkit';

export function handleClientLogout(dispatch: Dispatch) {
  dispatch(logout());
  dispatch(
    showToast({
      type: 'error',
      title: 'Wylogowano',
      message: 'Sesja wygasła. Zaloguj się ponownie.',
    }),
  );
  if (typeof window !== 'undefined') window.location.href = '/';
}
