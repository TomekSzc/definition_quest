import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export interface UIState {
  layout: {
    sidebarCollapsed: boolean;
  };
}

const initialState: UIState = {
  layout: {
    sidebarCollapsed: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.layout.sidebarCollapsed = !state.layout.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.layout.sidebarCollapsed = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed } = uiSlice.actions;

export const selectSidebarCollapsed = (state: RootState) => state.ui.layout.sidebarCollapsed;

export default uiSlice.reducer;
