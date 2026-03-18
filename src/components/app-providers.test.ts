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
  totalRounds: 2,
  currentRoundData: {
    currentQuestion: {
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
    roundStartedAt: null,
  },
  answerResult: null,
  sessionId: "session-1",
  hasSavedScore: false,
  resultSessionId: null,
  pendingResult: null,
});

describe("gameSessionReducer", () => {
  it("stores the validated reveal payload returned by the server", () => {
    const state = createBaseState();

    const nextState = gameSessionReducer(state, {
      type: "SUBMIT_ANSWER",
      payload: {
        currentRound: 1,
        score: 1000,
        answerResult: {
          status: "wrong",
          correctComposer: "Correct composer",
          correctMusic: "Correct music",
          selectedComposer: "Correct composer",
          selectedMusic: "Wrong music",
          breakdown: {
            baseCorrect: 0,
            speedBonus: 0,
            streakBonus: 0,
            total: 0,
          },
          streak: 0,
        },
        finished: false,
        result: null,
      },
    });

    expect(nextState.answerResult?.status).toBe("wrong");
    expect(nextState.streak).toBe(0);
  });

  it("keeps the final result pending when the game finishes on the server", () => {
    const state = createBaseState();

    const nextState = gameSessionReducer(state, {
      type: "SUBMIT_ANSWER",
      payload: {
        currentRound: 2,
        score: 1900,
        answerResult: {
          status: "correct",
          correctComposer: "Correct composer",
          correctMusic: "Correct music",
          selectedComposer: "Correct composer",
          selectedMusic: "Correct music",
          breakdown: {
            baseCorrect: 500,
            speedBonus: 200,
            streakBonus: 200,
            total: 900,
          },
          streak: 3,
        },
        finished: true,
        result: {
          sessionId: "session-1",
          registration: "2024001",
          studentName: "Aluno Teste",
          playerType: "student",
          score: 1900,
          title: "Virtuose em Ascensão",
          position: 1,
          shareUrl: "http://localhost/resultado/session-1",
          finishedAt: 1_900,
          isPersonalBest: true,
          leaderboardSize: 1,
        },
      },
    });

    expect(nextState.answerResult?.status).toBe("correct");
    expect(nextState.pendingResult?.sessionId).toBe("session-1");
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
        roundData: {
          currentQuestion: {
            audioToken: "audio-token-2",
          },
          options: [
            {
              optionId: "answer-3",
              composer: "Next composer",
              music: "Next music",
            },
          ],
          roundStartedAt: null,
        },
        finished: false,
      },
    });

    expect(nextState.phase).toBe("playing");
    expect(nextState.currentRound).toBe(2);
    expect(nextState.currentRoundData?.currentQuestion.audioToken).toBe("audio-token-2");
  });

  it("marks the current round as started after the first play", () => {
    const state = createBaseState();

    const nextState = gameSessionReducer(state, {
      type: "MARK_ROUND_STARTED",
      payload: {
        currentRound: 1,
        roundStartedAt: 1_250,
      },
    });

    expect(nextState.currentRoundData?.roundStartedAt).toBe(1_250);
  });
});
