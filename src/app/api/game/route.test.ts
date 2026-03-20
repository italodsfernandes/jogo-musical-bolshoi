import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createGameSessionMock,
  createNextRoundForSessionMock,
  createSessionIdMock,
  finalizeStudentAttemptMock,
  findStudentByRegistrationMock,
  getGameSessionMock,
  markRoundStartedForSessionMock,
  persistResultSnapshotMock,
  releaseReservedStudentAttemptMock,
  reserveStudentAttemptMock,
  saveGameSessionMock,
  submitAnswerForSessionMock,
} = vi.hoisted(() => ({
  createGameSessionMock: vi.fn(),
  createNextRoundForSessionMock: vi.fn(),
  createSessionIdMock: vi.fn(),
  finalizeStudentAttemptMock: vi.fn(),
  findStudentByRegistrationMock: vi.fn(),
  getGameSessionMock: vi.fn(),
  markRoundStartedForSessionMock: vi.fn(),
  persistResultSnapshotMock: vi.fn(),
  releaseReservedStudentAttemptMock: vi.fn(),
  reserveStudentAttemptMock: vi.fn(),
  saveGameSessionMock: vi.fn(),
  submitAnswerForSessionMock: vi.fn(),
}));

vi.mock("@/features/game/session", () => ({
  createGameSession: createGameSessionMock,
  createNextRoundForSession: createNextRoundForSessionMock,
  markRoundStartedForSession: markRoundStartedForSessionMock,
  submitAnswerForSession: submitAnswerForSessionMock,
}));

vi.mock("@/features/game/scoring", async () => {
  const actual = await vi.importActual<typeof import("@/features/game/scoring")>(
    "@/features/game/scoring",
  );

  return {
    ...actual,
    createSessionId: createSessionIdMock,
  };
});

vi.mock("@/lib/firebase", () => ({
  finalizeStudentAttempt: finalizeStudentAttemptMock,
  getGameSession: getGameSessionMock,
  persistResultSnapshot: persistResultSnapshotMock,
  releaseReservedStudentAttempt: releaseReservedStudentAttemptMock,
  reserveStudentAttempt: reserveStudentAttemptMock,
  saveGameSession: saveGameSessionMock,
}));

vi.mock("@/lib/students", () => ({
  findStudentByRegistration: findStudentByRegistrationMock,
}));

import { POST } from "@/app/api/game/route";

describe("game route", () => {
  beforeEach(() => {
    createGameSessionMock.mockReset();
    createNextRoundForSessionMock.mockReset();
    createSessionIdMock.mockReset();
    finalizeStudentAttemptMock.mockReset();
    findStudentByRegistrationMock.mockReset();
    getGameSessionMock.mockReset();
    markRoundStartedForSessionMock.mockReset();
    persistResultSnapshotMock.mockReset();
    releaseReservedStudentAttemptMock.mockReset();
    reserveStudentAttemptMock.mockReset();
    saveGameSessionMock.mockReset();
    submitAnswerForSessionMock.mockReset();

    createSessionIdMock.mockReturnValue("session-1");
    saveGameSessionMock.mockResolvedValue(undefined);
    releaseReservedStudentAttemptMock.mockResolvedValue(undefined);
    finalizeStudentAttemptMock.mockResolvedValue(undefined);
  });

  it("creates a student session when one attempt is available", async () => {
    findStudentByRegistrationMock.mockReturnValue({
      registration: "001",
      name: "Aluno Teste 001",
      active: true,
    });
    reserveStudentAttemptMock.mockResolvedValue({
      reserved: true,
      attempt: {
        sessionId: "session-1",
        attemptNumber: 1,
        startedAt: 1_000,
        finishedAt: null,
        score: null,
      },
      summary: {
        attemptsUsed: 1,
        attemptsRemaining: 2,
        maxAttempts: 3,
        isBlocked: false,
        bestScore: null,
        rankingPosition: null,
        attemptHistory: [],
      },
    });
    createGameSessionMock.mockReturnValue({
      session: {
        sessionId: "session-1",
        registration: "001",
        studentName: "Aluno Teste 001",
        playerType: "student",
        questionOrder: [],
        totalRounds: 10,
        currentRound: 1,
        currentRoundState: null,
        score: 0,
        streak: 0,
        status: "active",
        finishedAt: null,
        resultSessionId: null,
      },
      payload: {
        sessionId: "session-1",
        totalRounds: 10,
        currentRound: 1,
        roundData: {
          currentQuestion: { audioToken: "audio-token" },
          options: [],
          roundStartedAt: null,
        },
        player: {
          registration: "001",
          name: "Aluno Teste 001",
          playerType: "student",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/game", {
        method: "POST",
        body: JSON.stringify({
          action: "start",
          registration: "001",
          playerType: "student",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      sessionId: "session-1",
      player: {
        registration: "001",
        name: "Aluno Teste 001",
        playerType: "student",
      },
    });
    expect(reserveStudentAttemptMock).toHaveBeenCalledWith({
      registration: "001",
      sessionId: "session-1",
    });
    expect(createGameSessionMock).toHaveBeenCalledWith({
      player: {
        registration: "001",
        name: "Aluno Teste 001",
        playerType: "student",
      },
      sessionId: "session-1",
    });
    expect(saveGameSessionMock).toHaveBeenCalledTimes(1);
  });

  it("blocks the fourth attempt without creating a session", async () => {
    findStudentByRegistrationMock.mockReturnValue({
      registration: "001",
      name: "Aluno Teste 001",
      active: true,
    });
    reserveStudentAttemptMock.mockResolvedValue({
      reserved: false,
      attempt: null,
      summary: {
        attemptsUsed: 3,
        attemptsRemaining: 0,
        maxAttempts: 3,
        isBlocked: true,
        bestScore: 9100,
        rankingPosition: 1,
        attemptHistory: [
          {
            sessionId: "session-1",
            attemptNumber: 1,
            startedAt: 1_000,
            finishedAt: 1_500,
            score: 9100,
          },
        ],
      },
    });

    const response = await POST(
      new Request("http://localhost/api/game", {
        method: "POST",
        body: JSON.stringify({
          action: "start",
          registration: "001",
          playerType: "student",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      message: "Limite de 3 jogadas atingido.",
      attemptsUsed: 3,
      attemptsRemaining: 0,
      isBlocked: true,
      bestScore: 9100,
      rankingPosition: 1,
    });
    expect(createGameSessionMock).not.toHaveBeenCalled();
    expect(saveGameSessionMock).not.toHaveBeenCalled();
  });

  it("finalizes the reserved attempt when the last answer finishes the game", async () => {
    getGameSessionMock.mockResolvedValue({
      sessionId: "session-1",
      registration: "001",
      studentName: "Aluno Teste 001",
      playerType: "student",
      questionOrder: [],
      totalRounds: 10,
      currentRound: 10,
      currentRoundState: {
        answerKey: "answer-1",
        audioToken: "audio-token",
        options: [],
        roundStartedAt: 1_000,
        answeredAt: null,
        selectedOptionId: null,
      },
      score: 7000,
      streak: 2,
      status: "active",
      finishedAt: null,
      resultSessionId: null,
    });
    submitAnswerForSessionMock.mockReturnValue({
      session: {
        sessionId: "session-1",
        registration: "001",
        studentName: "Aluno Teste 001",
        playerType: "student",
        questionOrder: [],
        totalRounds: 10,
        currentRound: 10,
        currentRoundState: {
          answerKey: "answer-1",
          audioToken: "audio-token",
          options: [],
          roundStartedAt: 1_000,
          answeredAt: 2_000,
          selectedOptionId: "answer-1",
        },
        score: 7900,
        streak: 3,
        status: "finished",
        finishedAt: 2_000,
        resultSessionId: null,
      },
      payload: {
        currentRound: 10,
        score: 7900,
        answerResult: {
          status: "correct",
          correctComposer: "Composer",
          correctMusic: "Music",
          selectedComposer: "Composer",
          selectedMusic: "Music",
          breakdown: {
            baseCorrect: 500,
            speedBonus: 200,
            streakBonus: 200,
            total: 900,
          },
          streak: 3,
        },
        finished: true,
        result: null,
      },
    });
    persistResultSnapshotMock.mockResolvedValue({
      sessionId: "session-1",
      registration: "001",
      studentName: "Aluno Teste 001",
      playerType: "student",
      score: 7900,
      title: "Virtuose em Ascensão",
      position: 2,
      shareUrl: "http://localhost/resultado/session-1",
      finishedAt: 2_000,
      isPersonalBest: true,
      leaderboardSize: 10,
    });

    const response = await POST(
      new Request("http://localhost/api/game", {
        method: "POST",
        body: JSON.stringify({
          action: "answer",
          sessionId: "session-1",
          currentRound: 10,
          selectedOptionId: "answer-1",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(persistResultSnapshotMock).toHaveBeenCalledWith({
      registration: "001",
      studentName: "Aluno Teste 001",
      playerType: "student",
      score: 7900,
      sessionId: "session-1",
      origin: "http://localhost",
    });
    expect(finalizeStudentAttemptMock).toHaveBeenCalledWith({
      registration: "001",
      sessionId: "session-1",
      score: 7900,
      finishedAt: 2_000,
    });
  });
});
