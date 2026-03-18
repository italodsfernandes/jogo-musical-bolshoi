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
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");

    const audioBytes = await response.arrayBuffer();

    expect(audioBytes.byteLength).toBeGreaterThan(0);
  });

  it("returns partial content when the client requests a byte range", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const response = await GET(
      new Request("http://localhost", {
        headers: {
          Range: "bytes=0-1023",
        },
      }),
      {
        params: Promise.resolve({ token }),
      },
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Range")).toMatch(/^bytes 0-\d+\/\d+$/);

    const audioBytes = await response.arrayBuffer();

    expect(audioBytes.byteLength).toBeGreaterThan(0);
    expect(audioBytes.byteLength).toBeLessThanOrEqual(1024);
  });

  it("returns partial content for an open-ended byte range", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const response = await GET(
      new Request("http://localhost", {
        headers: {
          Range: "bytes=1024-",
        },
      }),
      {
        params: Promise.resolve({ token }),
      },
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toMatch(/^bytes 1024-\d+\/\d+$/);

    const audioBytes = await response.arrayBuffer();

    expect(audioBytes.byteLength).toBeGreaterThan(0);
  });

  it("returns partial content for a suffix byte range", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const response = await GET(
      new Request("http://localhost", {
        headers: {
          Range: "bytes=-500",
        },
      }),
      {
        params: Promise.resolve({ token }),
      },
    );

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toMatch(/^bytes \d+-\d+\/\d+$/);
    expect(response.headers.get("Content-Length")).toBe("500");

    const audioBytes = await response.arrayBuffer();

    expect(audioBytes.byteLength).toBe(500);
  });

  it("rejects an invalid byte range", async () => {
    const token = encryptAudioToken(QUESTIONS[0].audioSrc);
    const response = await GET(
      new Request("http://localhost", {
        headers: {
          Range: "bytes=999999999-1000000000",
        },
      }),
      {
        params: Promise.resolve({ token }),
      },
    );

    expect(response.status).toBe(416);
    expect(response.headers.get("Content-Range")).toMatch(/^bytes \*\/\d+$/);
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
