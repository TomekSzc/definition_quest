import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastState {
  type: ToastType | null;
  title: string | null;
  message: string | null;
  visible: boolean;
}

const initialState: ToastState = {
  type: null,
  title: null,
  message: null,
  visible: false,
};

interface ShowToastPayload {
  type: ToastType;
  message: string;
  title?: string;
}

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<ShowToastPayload>) => {
      state.type = action.payload.type;
      const fallback = {
        success: "Sukces",
        error: "Błąd",
        warning: "Uwaga",
        info: "Info",
      } as Record<ToastType, string>;
      state.title = action.payload.title ?? fallback[action.payload.type];
      state.message = action.payload.message;
      state.visible = true;
    },
    hideToast: (state) => {
      state.visible = false;
    },
    clearToast: (state) => {
      state.type = null;
      state.title = null;
      state.message = null;
      state.visible = false;
    },
  },
});

export const { showToast, hideToast, clearToast } = toastSlice.actions;

export default toastSlice.reducer;

export const selectToast = (state: RootState) => state.toast;
