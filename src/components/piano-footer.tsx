"use client";

import { KeyboardEvent, useCallback, useRef, useState } from "react";

const KEYS = [
  { note: "C4", type: "white", freq: 261.63 },
  { note: "Cs4", type: "black", freq: 277.18 },
  { note: "D4", type: "white", freq: 293.66 },
  { note: "Ds4", type: "black", freq: 311.13 },
  { note: "E4", type: "white", freq: 329.63 },
  { note: "F4", type: "white", freq: 349.23 },
  { note: "Fs4", type: "black", freq: 369.99 },
  { note: "G4", type: "white", freq: 392.0 },
  { note: "Gs4", type: "black", freq: 415.3 },
  { note: "A4", type: "white", freq: 440.0 },
  { note: "As4", type: "black", freq: 466.16 },
  { note: "B4", type: "white", freq: 493.88 },
  { note: "C5", type: "white", freq: 523.25 },
] as const;

export function PianoFooter() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastPointerNoteRef = useRef<string | null>(null);
  const lastPointerTsRef = useRef(0);

  const getAudioContext = () => {
    if (audioCtxRef.current) {
      return audioCtxRef.current;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    audioCtxRef.current = new AudioContextCtor();
    return audioCtxRef.current;
  };

  const primeAudio = useCallback(() => {
    const ctx = getAudioContext();

    if (!ctx) {
      return null;
    }

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    return ctx;
  }, []);

  const playNote = useCallback((note: string, freq: number) => {
    const ctx = primeAudio();

    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.0);

    setActiveKey(note);
    setTimeout(() => {
      setActiveKey((cur) => (cur === note ? null : cur));
    }, 150);
  }, [primeAudio]);

  const playPointerNote = (note: string, freq: number) => {
    lastPointerNoteRef.current = note;
    lastPointerTsRef.current = performance.now();
    playNote(note, freq);
  };

  const handleClick = (note: string, freq: number) => {
    const justPlayedFromPointer =
      lastPointerNoteRef.current === note &&
      performance.now() - lastPointerTsRef.current < 400;

    if (justPlayedFromPointer) {
      lastPointerNoteRef.current = null;
      return;
    }

    playNote(note, freq);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    note: string,
    freq: number,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();
    }

    playNote(note, freq);
  };

  return (
    <div className="piano-footer" aria-label="Piano decorativo">
      {KEYS.map((key) => (
        <button
          key={key.note}
          type="button"
          className={`${key.type}${activeKey === key.note ? " pressed" : ""}`}
          onPointerDown={() => {
            playPointerNote(key.note, key.freq);
          }}
          onClick={() => {
            handleClick(key.note, key.freq);
          }}
          onKeyDown={(event) => {
            handleKeyDown(event, key.note, key.freq);
          }}
          aria-label={key.note}
        />
      ))}
    </div>
  );
}
