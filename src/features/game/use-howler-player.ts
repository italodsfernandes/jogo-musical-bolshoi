"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";

import { Question } from "@/features/game/types";

export const useHowlerPlayer = (
  question: Question | null,
  preloadSources: string[] = [],
) => {
  const soundRef = useRef<Howl | null>(null);
  const preloadedSoundsRef = useRef<Howl[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  useEffect(() => {
    const uniqueSources = Array.from(new Set(preloadSources.filter(Boolean)));

    preloadedSoundsRef.current.forEach((sound) => {
      sound.unload();
    });
    preloadedSoundsRef.current = [];

    if (!uniqueSources.length) {
      return;
    }

    const preloads = uniqueSources.map(
      (src) =>
        new Howl({
          src: [src],
          format: ["mp3"],
          html5: false,
          preload: true,
          volume: 0,
        }),
    );

    preloadedSoundsRef.current = preloads;

    return () => {
      preloads.forEach((sound) => {
        sound.unload();
      });
      preloadedSoundsRef.current = [];
    };
  }, [preloadSources]);

  useEffect(() => {
    if (!question) {
      return;
    }

    const syncProgress = () => {
      if (!soundRef.current) {
        return;
      }

      const seekValue = Number(soundRef.current.seek()) || 0;
      const audioDurationMs = soundRef.current.duration() * 1000;
      const nextTimeMs = Math.min(seekValue * 1000, audioDurationMs);
      setCurrentTimeMs(nextTimeMs);

      if (nextTimeMs >= audioDurationMs) {
        soundRef.current.pause();
        setIsPlaying(false);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(syncProgress);
    };

    const howl = new Howl({
      src: [question.audioSrc],
      format: ["mp3"],
      html5: false,
      preload: true,
      onload: () => {
        setDurationMs(howl.duration() * 1000);
        setIsReady(true);
        setHasLoadError(false);
      },
      onplay: () => {
        setIsPlaying(true);
        setHasStarted(true);
        setPlayCount((currentPlayCount) => currentPlayCount + 1);
        animationFrameRef.current = window.requestAnimationFrame(syncProgress);
      },
      onpause: () => {
        setIsPlaying(false);
        if (animationFrameRef.current) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      },
      onstop: () => {
        setIsPlaying(false);
        setCurrentTimeMs(0);
        if (animationFrameRef.current) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      },
      onend: () => {
        setIsPlaying(false);
        setCurrentTimeMs(howl.duration() * 1000);
        if (animationFrameRef.current) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }
      },
      onloaderror: () => {
        setIsPlaying(false);
        setIsReady(false);
        setHasLoadError(true);
      },
    });

    soundRef.current = howl;
    setCurrentTimeMs(0);
    setDurationMs(0);
    setIsReady(false);
    setHasLoadError(false);
    setHasStarted(false);
    setPlayCount(0);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      howl.stop();
      howl.unload();
      soundRef.current = null;
    };
  }, [question]);

  const toggle = (isEnabled = true) => {
    if (!isEnabled) {
      return;
    }

    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    if (!isReady) {
      return;
    }

    if (isPlaying) {
      sound.pause();
      return;
    }

    sound.play();
  };

  const stop = () => {
    soundRef.current?.stop();
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  return {
    isPlaying,
    isReady,
    hasLoadError,
    hasStarted,
    playCount,
    currentTimeMs,
    durationMs,
    toggle,
    stop,
  };
};
