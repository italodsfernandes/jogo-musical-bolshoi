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
  roundCursor: "opaque-round-cursor",
  totalRounds: 2,
  currentRoundData: {
    currentQuestion: {
      answerKey: "answer-1",
      audioToken: "audio-token-1",
    },
    options: [
      {
        optionId: "answer-1",
        composer: "Correct composer",
        music: "Correct music",
      },
      {
        optionId: "answer-2",
        composer: "Wrong composer",
        music: "Wrong music",
      },
    ],
  },
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
        selectedOption: {
          optionId: "answer-2",
          composer: "Correct composer",
          music: "Wrong music",
        },
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
        selectedOption: {
          optionId: "answer-1",
          composer: "Correct composer",
          music: "Correct music",
        },
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

  it("loads the next round payload when advancing after reveal", () => {
    const state = {
      ...createBaseState(),
      phase: "revealed" as const,
    };

    const nextState = gameSessionReducer(state, {
      type: "ADVANCE_FLOW",
      payload: {
        currentRound: 2,
        roundCursor: "opaque-round-cursor-2",
        roundData: {
          currentQuestion: {
            answerKey: "answer-3",
            audioToken: "audio-token-2",
          },
          options: [
            {
              optionId: "answer-3",
              composer: "Next composer",
              music: "Next music",
            },
          ],
        },
        finished: false,
      },
    });

    expect(nextState.phase).toBe("playing");
    expect(nextState.currentRound).toBe(2);
    expect(nextState.roundCursor).toBe("opaque-round-cursor-2");
    expect(nextState.currentRoundData?.currentQuestion.answerKey).toBe(
      "answer-3",
    );
  });
});
