"use client";
// Origin: Fabrials, 0.12. What the inset and its parts have to agree on: the element a skip link goes to, and the slot the
// header's actions land in (a page deep in the app puts a key in the phone's bar without knowing where the bar is).

import { createContext } from "react";

export type SidebarInsetContextValue = {
  contentId: string;
  actions: HTMLElement | null;
  setActions: (element: HTMLElement | null) => void;
};

export const SidebarInsetContext = createContext<SidebarInsetContextValue | null>(null);
