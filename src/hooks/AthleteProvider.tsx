// AthleteProvider.tsx — JSX wrapper that provides AthleteContext
import React from "react";
import { AthleteContext, useAthleteProviderValue } from "./useAthletes";

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const value = useAthleteProviderValue();
  return (
    <AthleteContext.Provider value={value}>
      {children}
    </AthleteContext.Provider>
  );
}
