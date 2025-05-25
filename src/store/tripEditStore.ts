'use client';
import { configureStore } from "@reduxjs/toolkit";
import tripEditReducer from "./tripSlice";

export const tripEditStore = configureStore({
  reducer: {
    tripEdit: tripEditReducer,
  },
});

export type TripEditRootState = ReturnType<typeof tripEditStore.getState>;
export type TripEditDispatch = typeof tripEditStore.dispatch;