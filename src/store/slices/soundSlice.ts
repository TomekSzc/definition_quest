import { createSlice } from "@reduxjs/toolkit";

interface SoundState {
  soundOn: boolean;
}

const initialState: SoundState = {
  soundOn: true,
};

const soundSlice = createSlice({
  name: "sound",
  initialState,
  reducers: {
    toggleSound: (state) => {
      state.soundOn = !state.soundOn;
    },
    setSound: (state, { payload }: { payload: boolean }) => {
      state.soundOn = payload;
    },
  },
});

export const { toggleSound, setSound } = soundSlice.actions;
export default soundSlice.reducer;
