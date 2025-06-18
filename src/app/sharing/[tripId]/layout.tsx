'use client';
import { ReactNode } from "react";
import { Provider } from "react-redux";
import { sharingStore } from "@/store/sharingStore";


export default function SharingLayout({ children }: { children: ReactNode }) {
  return (
    <Provider store={sharingStore}>
      {children}
    </Provider>
  );
}