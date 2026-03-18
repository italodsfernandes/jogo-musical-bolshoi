import { describe, expect, it } from "vitest";

import {
  calculateRoundBreakdown,
  normalizeRegistration,
} from "@/features/game/scoring";

describe("game scoring", () => {
  it("normalizes registration to digits only", () => {
    expect(normalizeRegistration(" 2024-001 ")).toBe("2024001");
  });

  it("rewards faster correct answers with a bigger speed bonus", () => {
    const instantBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 0,
      currentStreak: 0,
    });
    const slowBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 12_000,
      currentStreak: 0,
    });

    expect(instantBreakdown.speedBonus).toBe(300);
    expect(instantBreakdown.speedBonus).toBeGreaterThan(
      slowBreakdown.speedBonus
    );
  });

  it("reduces the speed bonus by 1 point every 100ms", () => {
    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 100,
        currentStreak: 0,
      }).speedBonus
    ).toBe(299);

    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 1_000,
        currentStreak: 0,
      }).speedBonus
    ).toBe(290);

    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 5_000,
        currentStreak: 0,
      }).speedBonus
    ).toBe(250);
  });

  it("does not let the speed bonus go below zero", () => {
    expect(
      calculateRoundBreakdown({
        isCorrect: true,
        elapsedMs: 35_000,
        currentStreak: 0,
      }).speedBonus
    ).toBe(0);
  });

  it("gives the same speed bonus for equal elapsed time regardless of track duration", () => {
    const firstBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 4_000,
      currentStreak: 0,
    });
    const secondBreakdown = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 4_000,
      currentStreak: 0,
    });

    expect(firstBreakdown.speedBonus).toBe(260);
    expect(secondBreakdown.speedBonus).toBe(firstBreakdown.speedBonus);
  });

  it("caps streak bonus at 300 for streaks above 3", () => {
    const secondStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      currentStreak: 1,
    });
    const thirdStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
      currentStreak: 2,
    });
    const longStreak = calculateRoundBreakdown({
      isCorrect: true,
      elapsedMs: 1_000,
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
        currentStreak: 2,
      })
    ).toEqual({
      baseCorrect: 0,
      speedBonus: 0,
      streakBonus: 0,
      total: 0,
    });
  });
});
