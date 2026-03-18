"use client";

import { useEffect, useRef, useState } from "react";
import { Howl, Howler } from "howler";

import { CurrentQuestionPayload } from "@/features/game/types";

const getAudioStreamUrl = (audioToken: string) =>
  `/api/game/audio/${encodeURIComponent(audioToken)}`;

const shouldPreferHtml5Audio = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent ?? "";
  const platform = navigator.platform ?? "";

  return (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const createHowl = (src: string, useHtml5Audio: boolean) =>
  new Howl({
    src: [src],
    format: ["mp3"],
    html5: useHtml5Audio,
    preload: true,
  });

export const useHowlerPlayer = (
  question: CurrentQuestionPayload | null,
) => {
  const currentAudioToken = question?.audioToken ?? null;
  const soundRef = useRef<Howl | null>(null);
  const soundCacheRef = useRef(new Map<string, Howl>());
  const animationFrameRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);
  const unlockRequestedRef = useRef(false);
  const useHtml5AudioRef = useRef(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [lastStartedAudioToken, setLastStartedAudioToken] = useState<
    string | null
  >(null);
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

    const sound = createHowl(src, useHtml5AudioRef.current);
    soundCacheRef.current.set(src, sound);

    return sound;
  };

  useEffect(() => {
    useHtml5AudioRef.current = shouldPreferHtml5Audio();
  }, []);

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
      setLastStartedAudioToken(currentAudioToken);
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
    const handlePlayError = () => {
      setIsPlaying(false);
      setHasLoadError(true);
    };

    soundRef.current = howl;
    setCurrentTimeMs(0);
    setDurationMs(0);
    setIsReady(false);
    setHasLoadError(false);
    setHasStarted(false);
    setLastStartedAudioToken(null);
    setPlayCount(0);

    howl.on("load", syncLoadedState);
    howl.on("play", handlePlay);
    howl.on("pause", handlePause);
    howl.on("stop", handleStop);
    howl.on("end", handleEnd);
    howl.on("loaderror", handleLoadError);
    howl.on("playerror", handlePlayError);

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
      howl.off("playerror", handlePlayError);
      cancelProgressAnimation();
      howl.stop();
      soundRef.current = null;
    };
  }, [currentAudioToken, question, reloadKey]);

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

  const primeAudio = () => {
    if (unlockedRef.current) {
      return;
    }

    if (!Howler.ctx || Howler.ctx.state !== "suspended") {
      unlockedRef.current = true;
      return;
    }

    if (unlockRequestedRef.current) {
      return;
    }

    unlockRequestedRef.current = true;

    void Howler.ctx
      .resume()
      .then(() => {
        unlockedRef.current = true;
      })
      .catch(() => {
        unlockRequestedRef.current = false;
      });
  };

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

    setHasLoadError(false);
    primeAudio();
    sound.play();
  };

  const stop = () => {
    soundRef.current?.stop();
    setCurrentTimeMs(0);
    setIsPlaying(false);
  };

  const reload = () => {
    if (!question) {
      return;
    }

    const src = getAudioStreamUrl(question.audioToken);
    const cachedSound = soundCacheRef.current.get(src);

    if (cachedSound) {
      cachedSound.stop();
      cachedSound.unload();
      soundCacheRef.current.delete(src);
    }

    setHasLoadError(false);
    setIsReady(false);
    setHasStarted(false);
    setLastStartedAudioToken(null);
    setPlayCount(0);
    setCurrentTimeMs(0);
    setReloadKey((current) => current + 1);
  };

  return {
    isPlaying,
    isReady,
    hasLoadError,
    hasStarted,
    lastStartedAudioToken,
    playCount,
    currentTimeMs,
    durationMs,
    primeAudio,
    toggle,
    stop,
    reload,
  };
};
