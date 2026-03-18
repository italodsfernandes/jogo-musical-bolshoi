"use client";

import { createContext, useContext } from "react";

import {
  GameRoundData,
  GameSessionState,
  PlayerRecord,
  StartGamePayload,
  SubmitAnswerPayload,
} from "@/features/game/types";

export interface GameSessionContextValue {
  isHydrated: boolean;
  state: GameSessionState;
  actions: {
    setPlayer: (player: PlayerRecord) => void;
    beginGame: (payload: StartGamePayload) => void;
    submitAnswer: (payload: SubmitAnswerPayload) => void;
    advanceFlow: (payload: {
      currentRound: number;
      roundData: GameRoundData | null;
      finished: boolean;
    }) => void;
    markRoundStarted: (payload: {
      currentRound: number;
      roundStartedAt: number;
    }) => void;
    setSubmitting: () => void;
    markSaved: (resultSessionId: string) => void;
    resetGame: () => void;
    clearPlayer: () => void;
  };
}

export const GameSessionContext = createContext<GameSessionContextValue | null>(
  null,
);

export const useGameSession = () => {
  const context = useContext(GameSessionContext);

  if (!context) {
    throw new Error("useGameSession must be used within AppProviders");
  }

  return context;
};
