"use client";

import {
  CheckIcon,
  HouseIcon,
  LoaderCircleIcon,
  Share2Icon,
  TrophyIcon,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useGameSession } from "@/features/game/use-game-session";
import { PlayerType } from "@/features/game/types";
import {
  SHARE_FEEDBACK_TIMEOUT_MS,
  shareResultWithFallback,
} from "@/lib/share";

export const ResultActions = ({
  sessionId,
  registration,
  playerType,
  studentName,
  score,
  shareUrl,
}: {
  sessionId: string;
  registration: string;
  playerType: PlayerType;
  studentName: string;
  score: number;
  shareUrl: string;
}) => {
  const router = useRouter();
  const {
    actions: { resetGame },
  } = useGameSession();
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<
    "idle" | "shared" | "copied"
  >("idle");

  const handleShare = async () => {
    setIsSharing(true);

    try {
      const result = await shareResultWithFallback({
        sessionId,
        studentName,
        score,
        shareUrl,
      });

      if (result.status === "cancelled" || result.status === "failed") {
        return;
      }

      setShareFeedback(result.status === "copied" ? "copied" : "shared");
      window.setTimeout(() => {
        setShareFeedback("idle");
      }, SHARE_FEEDBACK_TIMEOUT_MS);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" onClick={handleShare} disabled={isSharing}>
        {isSharing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : shareFeedback !== "idle" ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <Share2Icon className="h-4 w-4" />
        )}
        {shareFeedback === "shared"
          ? "Compartilhado!"
          : shareFeedback === "copied"
            ? "Copiado!"
            : "Compartilhar card"}
      </Button>
      <Button
        size="lg"
        variant="outline"
        onClick={() => router.push(`/ranking`)}
      >
        <TrophyIcon className="h-4 w-4" />
        Ranking
      </Button>
      <Button
        size="lg"
        className="col-span-2"
        onClick={() => {
          resetGame();
          router.push(
            playerType === "student" ? `/?registration=${registration}` : "/",
          );
        }}
      >
        <HouseIcon className="h-4 w-4" />
        Jogar novamente
      </Button>
    </div>
  );
};
