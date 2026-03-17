"use client";

import { useCallback, useRef, useState } from "react";

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

  const playNote = useCallback((note: string, freq: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
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
  }, []);

  return (
    <div className="piano-footer" aria-label="Piano decorativo">
      {KEYS.map((key) => (
        <button
          key={key.note}
          type="button"
          className={`${key.type}${activeKey === key.note ? " pressed" : ""}`}
          onPointerDown={() => playNote(key.note, key.freq)}
        />
      ))}
    </div>
  );
}
