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

const { howlInstances, resumeMock, howlerCtx } = vi.hoisted(() => ({
  howlInstances: [] as MockHowlInstance[],
  resumeMock: vi.fn(async () => undefined),
  howlerCtx: {
    state: "running" as "running" | "suspended",
  },
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
    Howler: {
      ctx: {
        get state() {
          return howlerCtx.state;
        },
        resume: resumeMock,
      },
    },
  };
});

const firstQuestion: CurrentQuestionPayload = {
  audioToken: "audio-token-1",
};

const secondQuestion: CurrentQuestionPayload = {
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
    howlerCtx.state = "running";
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.requestAnimationFrame = vi.fn(
      () => 1,
    ) as typeof window.requestAnimationFrame;
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

  it("creates and plays a single Howl instance for the active round", async () => {
    act(() => {
      root.render(<HookHarness question={secondQuestion} />);
    });

    expect(howlInstances).toHaveLength(1);
    expect(howlInstances[0].src).toEqual(["/api/game/audio/audio-token-2"]);
    expect(latestPlayer?.isReady).toBe(true);

    await act(async () => {
      await latestPlayer?.toggle(true);
    });

    expect(howlInstances[0].play).toHaveBeenCalledTimes(1);
    expect(latestPlayer?.hasStarted).toBe(true);
    expect(latestPlayer?.lastStartedAudioToken).toBe("audio-token-2");
    expect(latestPlayer?.playCount).toBe(1);
  });

  it("primes audio before the first toggle when the context starts suspended", async () => {
    howlerCtx.state = "suspended";

    resumeMock.mockImplementation(async () => {
      howlerCtx.state = "running";
    });

    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    act(() => {
      latestPlayer?.primeAudio();
    });

    expect(resumeMock).toHaveBeenCalledTimes(1);

    act(() => {
      latestPlayer?.toggle(true);
    });

    expect(howlInstances[0].play).toHaveBeenCalledTimes(1);
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

  it("reloads the current audio after a load failure", () => {
    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    expect(howlInstances).toHaveLength(1);

    act(() => {
      latestPlayer?.reload();
    });

    expect(howlInstances[0].unload).toHaveBeenCalledTimes(1);
    expect(howlInstances).toHaveLength(2);
    expect(howlInstances[1].src).toEqual(["/api/game/audio/audio-token-1"]);
  });

  it("resets the started token when the round audio changes", async () => {
    act(() => {
      root.render(<HookHarness question={firstQuestion} />);
    });

    await act(async () => {
      await latestPlayer?.toggle(true);
    });

    expect(latestPlayer?.lastStartedAudioToken).toBe("audio-token-1");

    act(() => {
      root.render(<HookHarness question={secondQuestion} />);
    });

    expect(latestPlayer?.hasStarted).toBe(false);
    expect(latestPlayer?.lastStartedAudioToken).toBeNull();
  });
});
