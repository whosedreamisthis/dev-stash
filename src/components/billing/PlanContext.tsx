"use client";

import { createContext, useContext } from "react";

// Defaults to true outside the shell; the server still rejects Pro-only items without access
const PlanContext = createContext(true);

interface PlanProviderProps {
  hasProAccess: boolean;
  children: React.ReactNode;
}

export function PlanProvider({ hasProAccess, children }: PlanProviderProps) {
  return <PlanContext.Provider value={hasProAccess}>{children}</PlanContext.Provider>;
}

// Whether the signed-in user can create Pro-only types (File, Image)
export function useHasProAccess(): boolean {
  return useContext(PlanContext);
}
