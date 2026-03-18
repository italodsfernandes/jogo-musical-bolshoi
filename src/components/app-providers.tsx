"use client";

import { ReactNode, useMemo, useReducer } from "react";

import { normalizeStudentName } from "@/features/game/scoring";
import {
  AnswerBreakdown,
  GameRoundData,
  GameSessionState,
  PlayerRecord,
  QuestionOption,
  StartGamePayload,
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
      payload: {
        selectedOption: QuestionOption;
        breakdown: AnswerBreakdown;
      };
    }
  | {
      type: "ADVANCE_FLOW";
      payload: {
        currentRound: number;
        roundCursor: string | null;
        roundData: GameRoundData | null;
        finished: boolean;
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
  roundCursor: "",
  totalRounds: 0,
  currentRoundData: null,
  answerResult: null,
  sessionId: null,
  hasSavedScore: false,
  resultSessionId: null,
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
        score: 0,
        streak: 0,
        phase: "playing",
        currentRound: action.payload.currentRound,
        roundCursor: action.payload.roundCursor,
        totalRounds: action.payload.totalRounds,
        currentRoundData: action.payload.roundData,
        answerResult: null,
        sessionId: action.payload.sessionId,
        hasSavedScore: false,
        resultSessionId: null,
      };
    case "SUBMIT_ANSWER": {
      if (!state.currentRoundData) {
        return state;
      }

      const correctOption = state.currentRoundData.options.find(
        (option) =>
          option.optionId === state.currentRoundData?.currentQuestion.answerKey,
      );

      if (!correctOption) {
        return state;
      }

      const isCorrect =
        action.payload.selectedOption.optionId ===
        state.currentRoundData.currentQuestion.answerKey;
      const nextStreak = isCorrect ? state.streak + 1 : 0;

      return {
        ...state,
        score: state.score + action.payload.breakdown.total,
        streak: nextStreak,
        phase: "revealed",
        answerResult: {
          status: isCorrect ? "correct" : "wrong",
          correctComposer: correctOption.composer,
          correctMusic: correctOption.music,
          selectedComposer: action.payload.selectedOption.composer,
          selectedMusic: action.payload.selectedOption.music,
          breakdown: action.payload.breakdown,
          streak: nextStreak,
        },
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
          roundCursor: "",
          phase: "finished",
          currentRoundData: null,
          answerResult: null,
        };
      }

      return {
        ...state,
        currentRound: action.payload.currentRound,
        roundCursor: action.payload.roundCursor ?? "",
        currentRoundData: action.payload.roundData,
        phase: "playing",
        answerResult: null,
      };
    }
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
