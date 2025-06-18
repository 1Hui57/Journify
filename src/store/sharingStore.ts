'use client';
import { configureStore } from "@reduxjs/toolkit";
import sharingReducer from "./sharingSlice";

export const sharingStore = configureStore({
  reducer: {
    sharing: sharingReducer,
  },
});

export type SharingRootState = ReturnType<typeof sharingStore.getState>;
export type SharingDispatch = typeof sharingStore.dispatch;