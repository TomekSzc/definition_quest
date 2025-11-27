import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../index";

export interface UIState {
  layout: {
    sidebarCollapsed: boolean;
  };
  loading: boolean;
}

const initialState: UIState = {
  layout: {
    sidebarCollapsed: true,
  },
  loading: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.layout.sidebarCollapsed = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, setLoading } = uiSlice.actions;

export const selectSidebarCollapsed = (state: RootState) => state.ui.layout.sidebarCollapsed;
export const selectLoading = (state: RootState) => state.ui.loading;

export default uiSlice.reducer;
