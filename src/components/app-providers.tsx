"use client";

import { ReactNode, useMemo, useReducer } from "react";

import { normalizeStudentName } from "@/features/game/scoring";
import {
  GameRoundData,
  GameSessionState,
  PlayerRecord,
  StartGamePayload,
  SubmitAnswerPayload,
} from "@/features/game/types";
import {
  GameSessionContext,
  type GameSessionContextValue,
} from "@/features/game/use-game-session";

export type GameAction =
  | { type: "HYDRATE"; payload: GameSessionState }
  | { type: "SET_PLAYER"; payload: PlayerRecord }
  | { type: "BEGIN_GAME"; payload: StartGamePayload }
  | {
      type: "SUBMIT_ANSWER";
      payload: SubmitAnswerPayload;
    }
  | {
      type: "ADVANCE_FLOW";
      payload: {
        currentRound: number;
        roundData: GameRoundData | null;
        finished: boolean;
      };
    }
  | {
      type: "MARK_ROUND_STARTED";
      payload: {
        currentRound: number;
        roundStartedAt: number;
      };
    }
  | { type: "SET_SUBMITTING" }
  | { type: "MARK_SAVED"; payload: { resultSessionId: string } }
  | { type: "RESET_GAME" }
  | { type: "CLEAR_PLAYER" };

const createInitialState = (): GameSessionState => ({
  registration: "",
  studentName: "",
  playerType: null,
  score: 0,
  streak: 0,
  phase: "idle",
  currentRound: 0,
  totalRounds: 0,
  currentRoundData: null,
  answerResult: null,
  sessionId: null,
  hasSavedScore: false,
  resultSessionId: null,
  pendingResult: null,
});

export const gameSessionReducer = (
  state: GameSessionState,
  action: GameAction,
): GameSessionState => {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...createInitialState(),
        ...action.payload,
      };
    case "SET_PLAYER":
      return {
        ...createInitialState(),
        registration: action.payload.registration,
        studentName: normalizeStudentName(action.payload.name),
        playerType: action.payload.playerType,
        phase: "player-ready",
      };
    case "BEGIN_GAME":
      return {
        ...state,
        registration: action.payload.player.registration,
        studentName: normalizeStudentName(action.payload.player.name),
        playerType: action.payload.player.playerType,
        score: 0,
        streak: 0,
        phase: "playing",
        currentRound: action.payload.currentRound,
        totalRounds: action.payload.totalRounds,
        currentRoundData: action.payload.roundData,
        answerResult: null,
        sessionId: action.payload.sessionId,
        hasSavedScore: false,
        resultSessionId: null,
        pendingResult: null,
      };
    case "SUBMIT_ANSWER": {
      return {
        ...state,
        score: action.payload.score,
        streak: action.payload.answerResult.streak,
        phase: "revealed",
        answerResult: action.payload.answerResult,
        pendingResult: action.payload.result,
      };
    }
    case "ADVANCE_FLOW": {
      if (state.phase !== "revealed") {
        return state;
      }

      if (action.payload.finished || !action.payload.roundData) {
        return {
          ...state,
          currentRound: state.totalRounds,
          phase: "finished",
          currentRoundData: null,
          answerResult: null,
        };
      }

      return {
        ...state,
        currentRound: action.payload.currentRound,
        currentRoundData: action.payload.roundData,
        phase: "playing",
        answerResult: null,
        pendingResult: null,
      };
    }
    case "MARK_ROUND_STARTED":
      if (
        state.phase !== "playing" ||
        state.currentRound !== action.payload.currentRound ||
        !state.currentRoundData
      ) {
        return state;
      }

      return {
        ...state,
        currentRoundData: {
          ...state.currentRoundData,
          roundStartedAt: action.payload.roundStartedAt,
        },
      };
    case "SET_SUBMITTING":
      return {
        ...state,
        phase: "submitting",
      };
    case "MARK_SAVED":
      return {
        ...state,
        hasSavedScore: true,
        resultSessionId: action.payload.resultSessionId,
        pendingResult: null,
      };
    case "RESET_GAME":
      return createInitialState();
    case "CLEAR_PLAYER":
      return createInitialState();
    default:
      return state;
  }
};

export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(
    gameSessionReducer,
    createInitialState(),
  );

  const contextValue = useMemo<GameSessionContextValue>(
    () => ({
      isHydrated: true,
      state,
      actions: {
        setPlayer: (player) =>
          dispatch({ type: "SET_PLAYER", payload: player }),
        beginGame: (payload) => dispatch({ type: "BEGIN_GAME", payload }),
        submitAnswer: (payload) => dispatch({ type: "SUBMIT_ANSWER", payload }),
        advanceFlow: (payload) => dispatch({ type: "ADVANCE_FLOW", payload }),
        markRoundStarted: (payload) =>
          dispatch({ type: "MARK_ROUND_STARTED", payload }),
        setSubmitting: () => dispatch({ type: "SET_SUBMITTING" }),
        markSaved: (resultSessionId) =>
          dispatch({ type: "MARK_SAVED", payload: { resultSessionId } }),
        resetGame: () => dispatch({ type: "RESET_GAME" }),
        clearPlayer: () => dispatch({ type: "CLEAR_PLAYER" }),
      },
    }),
    [state],
  );

  return (
    <GameSessionContext.Provider value={contextValue}>
      {children}
    </GameSessionContext.Provider>
  );
};
