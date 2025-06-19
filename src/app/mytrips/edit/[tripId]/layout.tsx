'use client';
import { ReactNode } from "react";
import { Provider } from "react-redux";
import { tripEditStore } from "@/store/tripEditStore";


export default function EditTripLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={tripEditStore}>
      {children}
    </Provider>
  );
}