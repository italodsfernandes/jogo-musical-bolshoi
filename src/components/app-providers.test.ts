import { describe, expect, it } from "vitest";

import { gameSessionReducer } from "@/components/app-providers";
import { type GameSessionState } from "@/features/game/types";

const createBaseState = (): GameSessionState => ({
  registration: "2024001",
  studentName: "Aluno Teste",
  playerType: "student",
  score: 1000,
  streak: 2,
  phase: "playing",
  currentRound: 1,
  questionOrder: ["q-1", "q-2"],
  currentQuestionId: "q-1",
  answerResult: null,
  sessionId: "session-1",
  hasSavedScore: false,
  resultSessionId: null,
});

describe("gameSessionReducer", () => {
  it("marks wrong and resets streak when only composer matches", () => {
    const state = createBaseState();

    const nextState = gameSessionReducer(state, {
      type: "SUBMIT_ANSWER",
      payload: {
        selectedComposer: "Tchaikovsky",
        selectedMusic: "Wrong music",
        correctComposer: "Tchaikovsky",
        correctMusic: "Correct music",
        breakdown: {
          baseCorrect: 0,
          speedBonus: 0,
          streakBonus: 0,
          total: 0,
        },
      },
    });

    expect(nextState.answerResult?.status).toBe("wrong");
    expect(nextState.streak).toBe(0);
  });

  it("marks correct and increments streak when composer and music match", () => {
    const state = createBaseState();

    const nextState = gameSessionReducer(state, {
      type: "SUBMIT_ANSWER",
      payload: {
        selectedComposer: "Tchaikovsky",
        selectedMusic: "Correct music",
        correctComposer: "Tchaikovsky",
        correctMusic: "Correct music",
        breakdown: {
          baseCorrect: 500,
          speedBonus: 200,
          streakBonus: 200,
          total: 900,
        },
      },
    });

    expect(nextState.answerResult?.status).toBe("correct");
    expect(nextState.streak).toBe(state.streak + 1);
  });
});
