/* @vitest-environment jsdom */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PianoFooter } from "@/components/piano-footer";

class MockOscillatorNode {
  type = "triangle";
  frequency = {
    setValueAtTime: vi.fn(),
  };
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGainNode {
  gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
  connect = vi.fn();
}

describe("PianoFooter", () => {
  let container: HTMLDivElement;
  let root: Root;
  let createOscillatorMock: ReturnType<typeof vi.fn>;
  let createGainMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;

    createOscillatorMock = vi.fn(() => new MockOscillatorNode());
    createGainMock = vi.fn(() => new MockGainNode());

    class MockAudioContext {
      state: AudioContextState = "running";
      currentTime = 0;
      destination = {};
      createOscillator = createOscillatorMock;
      createGain = createGainMock;
      resume = vi.fn(async () => undefined);
    }

    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      writable: true,
      value: MockAudioContext,
    });

    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
    vi.restoreAllMocks();
  });

  it("plays a note only once for a pointer interaction followed by click", () => {
    act(() => {
      root.render(<PianoFooter />);
    });

    const button = container.querySelector('button[aria-label="C4"]');

    expect(button).not.toBeNull();

    act(() => {
      button!.dispatchEvent(
        new MouseEvent("pointerdown", {
          bubbles: true,
        }),
      );
      button!.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
        }),
      );
    });

    expect(createOscillatorMock).toHaveBeenCalledTimes(1);
    expect(createGainMock).toHaveBeenCalledTimes(1);
  });
});
