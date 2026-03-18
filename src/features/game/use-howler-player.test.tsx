/* @vitest-environment jsdom */

import { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CurrentQuestionPayload } from "@/features/game/types";
import { useHowlerPlayer } from "@/features/game/use-howler-player";

type Listener = () => void;
type MockHowlInstance = {
  src: string[];
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  state: ReturnType<typeof vi.fn>;
  duration: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
};

const { howlInstances } = vi.hoisted(() => ({
  howlInstances: [] as MockHowlInstance[],
}));

vi.mock("howler", () => {
  class MockHowl implements MockHowlInstance {
    src: string[];
    private listeners = new Map<string, Set<Listener>>();
    private currentState: "loaded" | "unloaded" = "loaded";

    constructor({ src }: { src: string[] }) {
      this.src = src;
      howlInstances.push(this);
    }

    on = vi.fn((event: string, handler: Listener) => {
      const handlers = this.listeners.get(event) ?? new Set<Listener>();
      handlers.add(handler);
      this.listeners.set(event, handlers);
    });

    off = vi.fn((event: string, handler: Listener) => {
      this.listeners.get(event)?.delete(handler);
    });

    state = vi.fn(() => this.currentState);
    duration = vi.fn(() => 12);
    seek = vi.fn(() => 0);
    play = vi.fn(() => {
      this.emit("play");
      return 1;
    });
    pause = vi.fn(() => {
      this.emit("pause");
    });
    stop = vi.fn(() => {
      this.emit("stop");
    });
    unload = vi.fn(() => {
      this.currentState = "unloaded";
    });

    private emit(event: string) {
      this.listeners.get(event)?.forEach((handler) => {
        handler();
      });
    }
  }

  return {
    Howl: MockHowl,
  };
});

const firstQuestion: CurrentQuestionPayload = {
  answerKey: "answer-1",
  audioToken: "audio-token-1",
};

const secondQuestion: CurrentQuestionPayload = {
  answerKey: "answer-2",
  audioToken: "audio-token-2",
};

let latestPlayer: ReturnType<typeof useHowlerPlayer> | null = null;

const HookHarness = ({
  question,
}: {
  question: CurrentQuestionPayload | null;
}) => {
  latestPlayer = useHowlerPlayer(question);

  return null;
};

describe("useHowlerPlayer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    latestPlayer = null;
    howlInstances.length = 0;
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.requestAnimationFrame = vi.fn(() => 1) as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = vi.fn() as typeof window.cancelAnimationFrame;
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    latestPlayer = null;
    howlInstances.length = 0;
    vi.clearAllMocks();
  });

  it("creates and plays a single Howl instance for the active round", () => {
    act(() => {
      root.render(<HookHarness question={secondQuestion} />);
    });

    expect(howlInstances).toHaveLength(1);
    expect(howlInstances[0].src).toEqual(["/api/game/audio/audio-token-2"]);
    expect(latestPlayer?.isReady).toBe(true);

    act(() => {
      latestPlayer?.toggle(true);
    });

    expect(howlInstances[0].play).toHaveBeenCalledTimes(1);
    expect(latestPlayer?.hasStarted).toBe(true);
    expect(latestPlayer?.playCount).toBe(1);
  });

  it("reuses the cached instance when the same audio returns later", () => {
    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    expect(howlInstances).toHaveLength(1);
    expect(howlInstances[0].src).toEqual(["/api/game/audio/audio-token-1"]);

    act(() => {
      root.render(<HookHarness question={secondQuestion} />);
    });

    expect(howlInstances).toHaveLength(2);

    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    expect(howlInstances).toHaveLength(2);
  });

  it("unloads all cached sounds only when the hook unmounts", () => {
    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    act(() => {
      root.render(<HookHarness question={secondQuestion} />);
    });

    const [firstSound, secondSound] = howlInstances;

    act(() => {
      root.unmount();
    });

    expect(firstSound.unload).toHaveBeenCalledTimes(1);
    expect(secondSound.unload).toHaveBeenCalledTimes(1);

    root = createRoot(container);
  });
});
