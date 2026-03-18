import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { QUESTIONS } from "@/features/game/questions";
import {
  createAnswerOptions,
  createNextRoundPayload,
  createRoundData,
  createStartGamePayload,
  decryptAudioToken,
  decryptRoundCursor,
  encryptAudioToken,
  encryptRoundCursor,
} from "@/features/game/rounds";

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

  it("creates round data without exposing semantic ids or public audio paths", () => {
    const questionOrder = QUESTIONS.slice(0, 3).map((question) => question.id);
    const roundData = createRoundData(questionOrder, 1);

    expect(roundData).toEqual({
      currentQuestion: {
        answerKey: expect.any(String),
        audioToken: expect.any(String),
      },
      options: expect.arrayContaining([
        expect.objectContaining({
          optionId: expect.any(String),
          composer: QUESTIONS[0].composer,
          music: QUESTIONS[0].music,
        }),
      ]),
    });

    expect(roundData?.currentQuestion.answerKey).not.toContain(QUESTIONS[0].id);
    expect(roundData?.currentQuestion.audioToken).not.toContain(QUESTIONS[0].audioSrc);
  });

  it("round-trips an encrypted round cursor", () => {
    const cursor = encryptRoundCursor({
      v: 1,
      currentRound: 1,
      questionOrder: QUESTIONS.map((question) => question.id),
    });

    expect(typeof cursor).toBe("string");
    expect(cursor).not.toContain(QUESTIONS[0].id);

    expect(decryptRoundCursor(cursor)).toEqual({
      v: 1,
      currentRound: 1,
      questionOrder: QUESTIONS.map((question) => question.id),
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

  it("rejects an adulterated round cursor", () => {
    const cursor = encryptRoundCursor({
      v: 1,
      currentRound: 1,
      questionOrder: QUESTIONS.map((question) => question.id),
    });
    const tamperedCursor = `${cursor.slice(0, -1)}x`;

    expect(decryptRoundCursor(tamperedCursor)).toBeNull();
    expect(createNextRoundPayload(tamperedCursor)).toBeNull();
  });

  it("builds a start payload without exposing ids or audio paths directly", () => {
    const payload = createStartGamePayload();

    expect(payload.sessionId).toBeTruthy();
    expect(payload.currentRound).toBe(1);
    expect(payload.totalRounds).toBe(QUESTIONS.length);
    expect(payload.roundCursor).toEqual(expect.any(String));
    expect(payload.roundCursor).not.toContain(QUESTIONS[0].id);
    expect(payload.roundData.currentQuestion.answerKey).toEqual(expect.any(String));
    expect(payload.roundData.currentQuestion.audioToken).toEqual(expect.any(String));
  });

  it("advances the cursor and marks finished when there is no next round", () => {
    const questionOrder = QUESTIONS.map((question) => question.id);
    const finishingCursor = encryptRoundCursor({
      v: 1,
      currentRound: questionOrder.length,
      questionOrder,
    });

    const payload = createNextRoundPayload(finishingCursor);

    expect(payload).toEqual({
      currentRound: questionOrder.length + 1,
      roundCursor: null,
      roundData: null,
      finished: true,
    });
  });
});
