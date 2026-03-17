import { describe, expect, it } from "vitest";

import {
  computeSessionPosition,
  shouldUpdateBestScore,
  sortLeaderboard,
} from "@/features/game/leaderboard";
import { BestScoreEntry } from "@/features/game/types";

const leaderboard: BestScoreEntry[] = [
  {
    registration: "2024001",
    studentName: "Ana Clara Souza",
    playerType: "student",
    score: 4200,
    finishedAt: 10,
    sessionId: "s-1",
  },
  {
    registration: "2024002",
    studentName: "Bernardo Lima",
    playerType: "student",
    score: 3800,
    finishedAt: 12,
    sessionId: "s-2",
  },
];

describe("leaderboard rules", () => {
  it("sorts scores descending and finishedAt ascending", () => {
    expect(sortLeaderboard(leaderboard)[0]?.registration).toBe("2024001");
  });

  it("updates best score only when the new score is higher", () => {
    expect(shouldUpdateBestScore(leaderboard[0], 4300)).toBe(true);
    expect(shouldUpdateBestScore(leaderboard[0], 4100)).toBe(false);
    expect(shouldUpdateBestScore(null, 1200)).toBe(true);
  });

  it("computes position considering one entry per registration", () => {
    const newEntry: BestScoreEntry = {
      registration: "2024003",
      studentName: "Camila Fernandes",
      playerType: "student",
      score: 3900,
      finishedAt: 15,
      sessionId: "s-3",
    };

    expect(computeSessionPosition(leaderboard, newEntry)).toBe(2);
  });
});
