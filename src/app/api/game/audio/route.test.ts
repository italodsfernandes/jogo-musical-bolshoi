import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/game/audio/[token]/route";
import { QUESTIONS } from "@/features/game/questions";
import { encryptAudioToken } from "@/features/game/rounds";

describe("game audio route", () => {
  const originalSecret = process.env.GAME_ORDER_SECRET;

  beforeEach(() => {
    process.env.GAME_ORDER_SECRET = "test-secret-for-audio-route";
  });

  afterEach(() => {
    if (originalSecret) {
      process.env.GAME_ORDER_SECRET = originalSecret;
      return;
    }

    delete process.env.GAME_ORDER_SECRET;
  });

  it("streams the current round audio for a valid token", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");

    const audioBytes = await response.arrayBuffer();

    expect(audioBytes.byteLength).toBeGreaterThan(0);
  });

  it("rejects an adulterated audio token", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const tamperedToken = `${token.slice(0, -1)}x`;
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ token: tamperedToken }),
    });

    expect(response.status).toBe(400);
  });
});
