"use client";

import { createContext, useContext } from "react";

import {
  AnswerBreakdown,
  GameSessionState,
  PlayerRecord,
} from "@/features/game/types";

export interface GameSessionContextValue {
  isHydrated: boolean;
  state: GameSessionState;
  actions: {
    setPlayer: (player: PlayerRecord) => void;
    beginGame: () => void;
    submitAnswer: (payload: {
      selectedComposer: string;
      selectedMusic: string;
      correctComposer: string;
      correctMusic: string;
      breakdown: AnswerBreakdown;
    }) => void;
    advanceFlow: () => void;
    setSubmitting: () => void;
    markSaved: (resultSessionId: string) => void;
    resetGame: () => void;
    clearPlayer: () => void;
  };
}

export const GameSessionContext = createContext<GameSessionContextValue | null>(
  null
);

export const useGameSession = () => {
  const context = useContext(GameSessionContext);

  if (!context) {
    throw new Error("useGameSession must be used within AppProviders");
  }

  return context;
};
