import { describe, expect, it, vi } from "vitest";

import {
  createResultShareMessage,
  selectShareStrategy,
  shareResultWithFallback,
} from "@/lib/share";

describe("share", () => {
  it("sends native share text without duplicated url", async () => {
    const shareMock = vi.fn<[ShareData], Promise<void>>(async () => undefined);
    const shareUrl = "https://example.com/resultado/abc";

    await shareResultWithFallback(
      {
        sessionId: "abc",
        studentName: "Maria",
        score: 980,
        shareUrl,
      },
      {
        navigatorRef: {
          share: shareMock,
        },
      },
    );

    expect(shareMock).toHaveBeenCalledTimes(1);

    const payload = shareMock.mock.calls[0][0];
    expect(payload.url).toBe(shareUrl);
    expect(payload.text).toBe(
      "Fiz 980 pts no MusiQuiz Piano Day 🎹 Será que você bate?",
    );
    expect(payload.text).not.toContain(shareUrl);
  });

  it("writes clipboard text with url exactly once", async () => {
    const writeTextMock = vi.fn<[string], Promise<void>>(async () => undefined);
    const shareUrl = "https://example.com/resultado/xyz";

    await shareResultWithFallback(
      {
        sessionId: "xyz",
        studentName: "Joao",
        score: 1200,
        shareUrl,
      },
      {
        navigatorRef: {
          clipboard: {
            writeText: writeTextMock,
          },
        },
      },
    );

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    const text = writeTextMock.mock.calls[0][0];
    const occurrences = text.split(shareUrl).length - 1;

    expect(occurrences).toBe(1);
  });

  it("selects share strategy by available capabilities", () => {
    expect(
      selectShareStrategy({
        canShareFiles: true,
        canNativeShare: true,
        canClipboard: true,
      }),
    ).toBe("file");

    expect(
      selectShareStrategy({
        canShareFiles: false,
        canNativeShare: true,
        canClipboard: true,
      }),
    ).toBe("native");

    expect(
      selectShareStrategy({
        canShareFiles: false,
        canNativeShare: false,
        canClipboard: true,
      }),
    ).toBe("clipboard");

    expect(
      selectShareStrategy({
        canShareFiles: false,
        canNativeShare: false,
        canClipboard: false,
      }),
    ).toBe("whatsapp");
  });

  it("builds clipboard text with one url and native text without it", () => {
    const message = createResultShareMessage({
      studentName: "Ana",
      score: 700,
      shareUrl: "https://example.com/resultado/123",
    });

    expect(message.nativeText).not.toContain("https://example.com/resultado/123");
    expect(
      message.clipboardText.split("https://example.com/resultado/123").length - 1,
    ).toBe(1);
  });
});
