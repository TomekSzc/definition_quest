import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

function createNoopStorage() {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_k: string, v: string) {
      return Promise.resolve(v);
    },
    removeItem() {
      return Promise.resolve();
    },
  };
}

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage();

import authReducer from "./slices/authSlice";
import toastReducer from "./slices/toastSlice";
import uiReducer from "./slices/uiSlice";
import soundReducer from "./slices/soundSlice";
import { apiSlice } from "./api/apiSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  toast: toastReducer,
  ui: uiReducer,
  sound: soundReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui", "sound"],
  blacklist: ["toast"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(apiSlice.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

// Lazy initialization for Cloudflare Workers compatibility
// persistStore must be called inside a handler, not in global scope
let persistor: ReturnType<typeof persistStore> | null = null;

export function getPersistor() {
  if (!persistor) {
    persistor = persistStore(store);
  }
  return persistor;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
