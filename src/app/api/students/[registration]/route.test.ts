import { beforeEach, describe, expect, it, vi } from "vitest";

const { getStudentAttemptSummaryMock, findStudentByRegistrationMock } =
  vi.hoisted(() => ({
    getStudentAttemptSummaryMock: vi.fn(),
    findStudentByRegistrationMock: vi.fn(),
  }));

vi.mock("@/lib/firebase", () => ({
  getStudentAttemptSummary: getStudentAttemptSummaryMock,
}));

vi.mock("@/lib/students", () => ({
  findStudentByRegistration: findStudentByRegistrationMock,
}));

import { GET } from "@/app/api/students/[registration]/route";

describe("students route", () => {
  beforeEach(() => {
    getStudentAttemptSummaryMock.mockReset();
    findStudentByRegistrationMock.mockReset();
  });

  it("returns not found when the registration is missing", async () => {
    findStudentByRegistrationMock.mockReturnValue(null);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ registration: "999999" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ found: false });
    expect(getStudentAttemptSummaryMock).not.toHaveBeenCalled();
  });

  it("returns the student plus attempt summary when found", async () => {
    findStudentByRegistrationMock.mockReturnValue({
      registration: "001",
      name: "Aluno Teste 001",
      active: true,
    });
    getStudentAttemptSummaryMock.mockResolvedValue({
      attemptsUsed: 3,
      attemptsRemaining: 0,
      maxAttempts: 3,
      isBlocked: true,
      bestScore: 8700,
      rankingPosition: 2,
      attemptHistory: [
        {
          sessionId: "session-1",
          attemptNumber: 1,
          startedAt: 1_000,
          finishedAt: 1_500,
          score: 6000,
        },
      ],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ registration: "001" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      found: true,
      registration: "001",
      name: "Aluno Teste 001",
      attemptsUsed: 3,
      attemptsRemaining: 0,
      maxAttempts: 3,
      isBlocked: true,
      bestScore: 8700,
      rankingPosition: 2,
      attemptHistory: [
        {
          sessionId: "session-1",
          attemptNumber: 1,
          startedAt: 1_000,
          finishedAt: 1_500,
          score: 6000,
        },
      ],
    });
    expect(getStudentAttemptSummaryMock).toHaveBeenCalledWith("001");
  });
});
