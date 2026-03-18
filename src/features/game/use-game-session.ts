"use client";

import { createContext, useContext } from "react";

import {
  AnswerBreakdown,
  GameRoundData,
  GameSessionState,
  PlayerRecord,
  QuestionOption,
  StartGamePayload,
} from "@/features/game/types";

export interface GameSessionContextValue {
  isHydrated: boolean;
  state: GameSessionState;
  actions: {
    setPlayer: (player: PlayerRecord) => void;
    beginGame: (payload: StartGamePayload) => void;
    submitAnswer: (payload: {
      selectedOption: QuestionOption;
      breakdown: AnswerBreakdown;
    }) => void;
    advanceFlow: (payload: {
      currentRound: number;
      roundCursor: string | null;
      roundData: GameRoundData | null;
      finished: boolean;
    }) => void;
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
