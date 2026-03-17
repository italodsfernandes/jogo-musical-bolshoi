import { describe, expect, it } from "vitest";

import {
  calculateRoundBreakdown,
  createAnswerOptions,
  normalizeRegistration,
} from "@/features/game/scoring";
import { QUESTIONS } from "@/features/game/questions";

describe("game scoring", () => {
  it("normalizes registration to digits only", () => {
    expect(normalizeRegistration(" 2024-001 ")).toBe("2024001");
  });

  it("rewards faster correct answers with a bigger speed bonus", () => {
    const instantBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 0,
      hasReplayed: false,
      currentStreak: 0,
    });
    const slowBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 12_000,
      hasReplayed: false,
      currentStreak: 0,
    });

    expect(instantBreakdown.speedBonus).toBe(300);
    expect(instantBreakdown.speedBonus).toBeGreaterThan(
      slowBreakdown.speedBonus
    );
  });

  it("reduces the speed bonus in 10 point steps per second", () => {
    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 1_000,
        hasReplayed: false,
        currentStreak: 0,
      }).speedBonus
    ).toBe(290);

    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 5_000,
        hasReplayed: false,
        currentStreak: 0,
      }).speedBonus
    ).toBe(250);
  });

  it("does not let the speed bonus go below zero", () => {
    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 35_000,
        hasReplayed: false,
        currentStreak: 0,
      }).speedBonus
    ).toBe(0);
  });

  it("removes the speed bonus after the second play", () => {
    const replayedBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      hasReplayed: true,
      currentStreak: 0,
    });

    expect(replayedBreakdown.speedBonus).toBe(0);
  });

  it("gives the same speed bonus for equal elapsed time regardless of track duration", () => {
    const firstBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 4_000,
      hasReplayed: false,
      currentStreak: 0,
    });
    const secondBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 4_000,
      hasReplayed: false,
      currentStreak: 0,
    });

    expect(firstBreakdown.speedBonus).toBe(260);
    expect(secondBreakdown.speedBonus).toBe(firstBreakdown.speedBonus);
  });

  it("caps streak bonus at 300 for streaks above 3", () => {
    const secondStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      hasReplayed: false,
      currentStreak: 1,
    });
    const thirdStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      hasReplayed: false,
      currentStreak: 2,
    });
    const longStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      hasReplayed: false,
      currentStreak: 6,
    });

    expect(secondStreak.streakBonus).toBe(200);
    expect(thirdStreak.streakBonus).toBe(300);
    expect(longStreak.streakBonus).toBe(300);
  });

  it("builds a correct-answer breakdown", () => {
    const breakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 2_000,
      hasReplayed: false,
      currentStreak: 1,
    });

    expect(breakdown.baseCorrect).toBe(500);
    expect(breakdown.speedBonus).toBe(280);
    expect(breakdown.streakBonus).toBe(200);
    expect(breakdown.total).toBe(
      breakdown.baseCorrect + breakdown.speedBonus + breakdown.streakBonus
    );
  });

  it("returns zero breakdown for wrong answers", () => {
    expect(
      calculateRoundBreakdown({
        isCorrect: false,
        elapsedMs: 4_000,
        hasReplayed: false,
        currentStreak: 2,
      })
    ).toEqual({
      baseCorrect: 0,
      speedBonus: 0,
      streakBonus: 0,
      total: 0,
    });
  });

  it("always includes the correct question by id", () => {
    const currentQuestion = QUESTIONS[0];
    const options = createAnswerOptions(currentQuestion.id, QUESTIONS);

    expect(options.some((option) => option.id === currentQuestion.id)).toBe(
      true
    );
  });

  it("keeps the exact current question when composer is repeated (Tchaikovsky)", () => {
    const currentQuestion = QUESTIONS.find(
      (question) => question.id === "tchaikovsky-piano-concerto-1"
    );

    expect(currentQuestion).toBeDefined();

    const options = createAnswerOptions(currentQuestion!.id, QUESTIONS);

    expect(
      options.some(
        (option) =>
          option.id === currentQuestion!.id &&
          option.music === currentQuestion!.music &&
          option.composer === currentQuestion!.composer
      )
    ).toBe(true);
  });

  it("does not duplicate ids in the options list", () => {
    const currentQuestion = QUESTIONS[0];
    const duplicatedPool = [
      ...QUESTIONS,
      QUESTIONS[1],
      QUESTIONS[2],
      QUESTIONS[3],
    ];

    const options = createAnswerOptions(currentQuestion.id, duplicatedPool);
    const optionIds = options.map((option) => option.id);

    expect(new Set(optionIds).size).toBe(optionIds.length);
  });

  it("limits options to the total available unique questions", () => {
    const uniqueSmallPool = [QUESTIONS[0], QUESTIONS[1], QUESTIONS[2]];
    const options = createAnswerOptions(QUESTIONS[0].id, uniqueSmallPool);

    expect(options).toHaveLength(3);
  });
});
