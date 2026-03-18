import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { QUESTIONS } from "@/features/game/questions";
import {
  createAnswerOptions,
  createRoundState,
  decryptAudioToken,
  encryptAudioToken,
  toPublicRoundData,
} from "@/features/game/rounds";
import {
  createGameSession,
  createNextRoundForSession,
  markRoundStartedForSession,
  submitAnswerForSession,
} from "@/features/game/session";

describe("game rounds", () => {
  const originalSecret = process.env.GAME_ORDER_SECRET;

  beforeEach(() => {
    process.env.GAME_ORDER_SECRET = "test-secret-for-round-cursor";
  });

  afterEach(() => {
    if (originalSecret) {
      process.env.GAME_ORDER_SECRET = originalSecret;
      return;
    }

    delete process.env.GAME_ORDER_SECRET;
  });

  it("always includes the correct question and returns an opaque answer key", () => {
    const currentQuestion = QUESTIONS[0];
    const roundOptions = createAnswerOptions(currentQuestion.id, QUESTIONS);

    expect(roundOptions).not.toBeNull();
    expect(
      roundOptions?.options.some(
        (option) =>
          option.composer === currentQuestion.composer &&
          option.music === currentQuestion.music,
      ),
    ).toBe(true);
    expect(roundOptions?.answerKey).toEqual(expect.any(String));
    expect(roundOptions?.answerKey).not.toContain(currentQuestion.id);
  });

  it("keeps the exact current question when composer is repeated (Tchaikovsky)", () => {
    const currentQuestion = QUESTIONS.find(
      (question) => question.id === "tchaikovsky-piano-concerto-1",
    );

    expect(currentQuestion).toBeDefined();

    const roundOptions = createAnswerOptions(currentQuestion!.id, QUESTIONS);

    expect(
      roundOptions?.options.some(
        (option) =>
          option.music === currentQuestion!.music &&
          option.composer === currentQuestion!.composer,
      ),
    ).toBe(true);
  });

  it("does not duplicate opaque option ids in the options list", () => {
    const currentQuestion = QUESTIONS[0];
    const duplicatedPool = [
      ...QUESTIONS,
      QUESTIONS[1],
      QUESTIONS[2],
      QUESTIONS[3],
    ];

    const roundOptions = createAnswerOptions(currentQuestion.id, duplicatedPool);
    const optionIds = roundOptions?.options.map((option) => option.optionId) ?? [];

    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  it("limits options to the total available unique questions", () => {
    const uniqueSmallPool = [QUESTIONS[0], QUESTIONS[1], QUESTIONS[2]];
    const roundOptions = createAnswerOptions(QUESTIONS[0].id, uniqueSmallPool);

    expect(roundOptions?.options).toHaveLength(3);
  });

  it("creates a server-side round state and a public payload without exposing the answer", () => {
    const questionOrder = QUESTIONS.slice(0, 3).map((question) => question.id);
    const roundState = createRoundState(questionOrder, 1);

    expect(roundState).toEqual({
      answerKey: expect.any(String),
      audioToken: expect.any(String),
      options: expect.arrayContaining([
        expect.objectContaining({
          optionId: expect.any(String),
          composer: QUESTIONS[0].composer,
          music: QUESTIONS[0].music,
        }),
      ]),
      roundStartedAt: null,
      answeredAt: null,
      selectedOptionId: null,
    });

    const roundData = toPublicRoundData(roundState!);

    expect(roundData).toEqual({
      currentQuestion: {
        audioToken: expect.any(String),
      },
      options: roundState!.options,
      roundStartedAt: null,
    });
  });

  it("round-trips an encrypted audio token", () => {
    const audioToken = encryptAudioToken(QUESTIONS[0].audioSrc);

    expect(audioToken).not.toContain(QUESTIONS[0].audioSrc);
    expect(decryptAudioToken(audioToken)).toEqual({
      v: 1,
      audioSrc: QUESTIONS[0].audioSrc,
    });
  });

  it("creates a session and advances only after the round is answered", () => {
    const { session, payload } = createGameSession({
      player: {
        registration: "2024001",
        name: "Aluno Teste",
        playerType: "student",
      },
      now: 1_000,
    });

    expect(payload.player.name).toBe("Aluno Teste");
    expect(payload.roundData.currentQuestion.audioToken).toEqual(expect.any(String));

    expect(() =>
      createNextRoundForSession({
        session,
        currentRound: 1,
      }),
    ).toThrow("ainda nao foi respondida");

    const started = markRoundStartedForSession({
      session,
      currentRound: 1,
      now: 1_500,
    });

    const correctOption = started.session.currentRoundState?.options.find(
      (option) => option.optionId === started.session.currentRoundState?.answerKey,
    );

    const answered = submitAnswerForSession({
      session: started.session,
      currentRound: 1,
      selectedOptionId: correctOption?.optionId ?? null,
      now: 2_000,
    });

    expect(answered.payload.answerResult.status).toBe("correct");
    expect(answered.payload.score).toBeGreaterThan(0);

    const nextRound = createNextRoundForSession({
      session: answered.session,
      currentRound: 1,
    });

    expect(nextRound.payload.finished).toBe(false);
    expect(nextRound.payload.currentRound).toBe(2);
    expect(nextRound.payload.roundData?.currentQuestion.audioToken).toEqual(
      expect.any(String),
    );
  });

  it("scores skipped rounds with zero points and resets streak", () => {
    const { session } = createGameSession({
      player: {
        registration: "visitor-123",
        name: "Visitante",
        playerType: "visitor",
      },
      now: 500,
    });

    const skipped = submitAnswerForSession({
      session: {
        ...session,
        streak: 3,
      },
      currentRound: 1,
      selectedOptionId: null,
      now: 4_000,
    });

    expect(skipped.payload.answerResult.status).toBe("skipped");
    expect(skipped.payload.answerResult.breakdown.total).toBe(0);
    expect(skipped.session.streak).toBe(0);
  });

  it("starts counting time only after the first play", () => {
    const { session } = createGameSession({
      player: {
        registration: "2024001",
        name: "Aluno Teste",
        playerType: "student",
      },
      now: 1_000,
    });

    expect(session.currentRoundState?.roundStartedAt).toBeNull();

    const started = markRoundStartedForSession({
      session,
      currentRound: 1,
      now: 1_200,
    });

    expect(started.roundStartedAt).toBe(1_200);
    expect(started.session.currentRoundState?.roundStartedAt).toBe(1_200);
  });

  it("rejects answers before the first play starts the round", () => {
    const { session } = createGameSession({
      player: {
        registration: "2024001",
        name: "Aluno Teste",
        playerType: "student",
      },
    });

    const correctOption = session.currentRoundState?.options.find(
      (option) => option.optionId === session.currentRoundState?.answerKey,
    );

    expect(() =>
      submitAnswerForSession({
        session,
        currentRound: 1,
        selectedOptionId: correctOption?.optionId ?? null,
      }),
    ).toThrow("Escute o trecho antes de responder.");
  });

  it("recovers gracefully from invalid legacy score and streak values", () => {
    const { session } = createGameSession({
      player: {
        registration: "2024001",
        name: "Aluno Teste",
        playerType: "student",
      },
    });

    const started = markRoundStartedForSession({
      session: {
        ...session,
        score: Number.NaN as never,
        streak: Number.NaN as never,
      },
      currentRound: 1,
      now: 1_000,
    });

    const correctOption = started.session.currentRoundState?.options.find(
      (option) => option.optionId === started.session.currentRoundState?.answerKey,
    );

    const answered = submitAnswerForSession({
      session: started.session,
      currentRound: 1,
      selectedOptionId: correctOption?.optionId ?? null,
      now: 2_000,
    });

    expect(answered.session.score).toBeGreaterThan(0);
    expect(Number.isFinite(answered.session.score)).toBe(true);
    expect(answered.session.streak).toBe(1);
  });
});
