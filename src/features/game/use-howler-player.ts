"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";

import { CurrentQuestionPayload } from "@/features/game/types";

const getAudioStreamUrl = (audioToken: string) =>
  `/api/game/audio/${encodeURIComponent(audioToken)}`;

const createHowl = (src: string) =>
  new Howl({
    src: [src],
    format: ["mp3"],
    html5: false,
    preload: true,
  });

export const useHowlerPlayer = (
  question: CurrentQuestionPayload | null,
) => {
  const soundRef = useRef<Howl | null>(null);
  const soundCacheRef = useRef(new Map<string, Howl>());
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const cancelProgressAnimation = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const getOrCreateSound = (src: string) => {
    const cachedSound = soundCacheRef.current.get(src);

    if (cachedSound) {
      return cachedSound;
    }

    const sound = createHowl(src);
    soundCacheRef.current.set(src, sound);

    return sound;
  };

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

    const howl = getOrCreateSound(getAudioStreamUrl(question.audioToken));
    const syncLoadedState = () => {
      setDurationMs(howl.duration() * 1000);
      setIsReady(true);
      setHasLoadError(false);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      setHasStarted(true);
      setPlayCount((currentPlayCount) => currentPlayCount + 1);
      animationFrameRef.current = window.requestAnimationFrame(syncProgress);
    };
    const handlePause = () => {
      setIsPlaying(false);
      cancelProgressAnimation();
    };
    const handleStop = () => {
      setIsPlaying(false);
      setCurrentTimeMs(0);
      cancelProgressAnimation();
    };
    const handleEnd = () => {
      setIsPlaying(false);
      setCurrentTimeMs(howl.duration() * 1000);
      cancelProgressAnimation();
    };
    const handleLoadError = () => {
      setIsPlaying(false);
      setIsReady(false);
      setHasLoadError(true);
    };

    soundRef.current = howl;
    setCurrentTimeMs(0);
    setDurationMs(0);
    setIsReady(false);
    setHasLoadError(false);
    setHasStarted(false);
    setPlayCount(0);

    howl.on("load", syncLoadedState);
    howl.on("play", handlePlay);
    howl.on("pause", handlePause);
    howl.on("stop", handleStop);
    howl.on("end", handleEnd);
    howl.on("loaderror", handleLoadError);

    if (howl.state() === "loaded") {
      syncLoadedState();
    }

    return () => {
      howl.off("load", syncLoadedState);
      howl.off("play", handlePlay);
      howl.off("pause", handlePause);
      howl.off("stop", handleStop);
      howl.off("end", handleEnd);
      howl.off("loaderror", handleLoadError);
      cancelProgressAnimation();
      howl.stop();
      soundRef.current = null;
    };
  }, [question]);

  useEffect(
    () => () => {
      cancelProgressAnimation();
      soundCacheRef.current.forEach((sound) => {
        sound.stop();
        sound.unload();
      });
      soundCacheRef.current.clear();
    },
    [],
  );

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
