import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Toast helper
import { useCallback } from 'react';
import { showToast, hideToast } from './slices/toastSlice';
import type { ToastType } from './slices/toastSlice';

interface ToastPayload {
  type: ToastType;
  title: string;
  message: string;
}

export function useToast() {
  const dispatch = useAppDispatch();

  const show = useCallback((payload: ToastPayload) => {
    dispatch(showToast(payload));
  }, [dispatch]);

  const hide = useCallback(() => {
    dispatch(hideToast());
  }, [dispatch]);

  return { showToast: show, hideToast: hide };
}