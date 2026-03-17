"use client";

import { ReactNode, useMemo, useReducer } from "react";

import { QUESTION_IDS } from "@/features/game/questions";
import {
  buildQuestionOrder,
  createSessionId,
  normalizeStudentName,
} from "@/features/game/scoring";
import {
  AnswerBreakdown,
  GameSessionState,
  PlayerRecord,
} from "@/features/game/types";
import {
  GameSessionContext,
  type GameSessionContextValue,
} from "@/features/game/use-game-session";

type GameAction =
  | { type: "HYDRATE"; payload: GameSessionState }
  | { type: "SET_PLAYER"; payload: PlayerRecord }
  | {
      type: "SUBMIT_ANSWER";
      payload: {
        selectedComposer: string;
        correctComposer: string;
        music: string;
        breakdown: AnswerBreakdown;
      };
    }
  | { type: "ADVANCE_FLOW" }
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
  questionOrder: [],
  currentQuestionId: null,
  answerResult: null,
  sessionId: null,
  hasSavedScore: false,
  resultSessionId: null,
});

const createPlayingState = (player: PlayerRecord): GameSessionState => {
  const questionOrder = buildQuestionOrder(QUESTION_IDS);

  return {
    registration: player.registration,
    studentName: normalizeStudentName(player.name),
    playerType: player.playerType,
    score: 0,
    streak: 0,
    phase: "playing",
    currentRound: 1,
    questionOrder,
    currentQuestionId: questionOrder[0] ?? null,
    answerResult: null,
    sessionId: createSessionId(),
    hasSavedScore: false,
    resultSessionId: null,
  };
};

const gameSessionReducer = (
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
    case "SUBMIT_ANSWER": {
      if (!state.currentQuestionId) {
        return state;
      }

      const isCorrect =
        action.payload.selectedComposer === action.payload.correctComposer;
      const nextStreak = isCorrect ? state.streak + 1 : 0;

      return {
        ...state,
        score: state.score + action.payload.breakdown.total,
        streak: nextStreak,
        phase: "revealed",
        answerResult: {
          status: isCorrect ? "correct" : "wrong",
          correctComposer: action.payload.correctComposer,
          selectedComposer: action.payload.selectedComposer,
          music: action.payload.music,
          breakdown: action.payload.breakdown,
          streak: nextStreak,
        },
      };
    }
    case "ADVANCE_FLOW": {
      if (state.phase === "player-ready") {
        return createPlayingState({
          registration: state.registration,
          name: state.studentName,
          playerType: state.playerType ?? "student",
        });
      }

      if (state.phase !== "revealed") {
        return state;
      }

      const nextRound = state.currentRound + 1;
      const nextQuestionId = state.questionOrder[nextRound - 1] ?? null;

      if (!nextQuestionId) {
        return {
          ...state,
          phase: "finished",
          currentQuestionId: null,
          answerResult: null,
        };
      }

      return {
        ...state,
        currentRound: nextRound,
        currentQuestionId: nextQuestionId,
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
        beginGame: () => dispatch({ type: "ADVANCE_FLOW" }),
        submitAnswer: (payload) => dispatch({ type: "SUBMIT_ANSWER", payload }),
        advanceFlow: () => dispatch({ type: "ADVANCE_FLOW" }),
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
