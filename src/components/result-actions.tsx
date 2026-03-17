"use client";

import {
  CheckIcon,
  HouseIcon,
  LoaderCircleIcon,
  Share2Icon,
  TrophyIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PlayerType } from "@/features/game/types";

export const ResultActions = ({
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
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<"idle" | "done">("idle");
  const shareText = useMemo(
    () =>
      `Fiz ${score} pts no MusiQuiz Piano Day 🎹 Será que você bate? ${shareUrl}`,
    [score, shareUrl],
  );

  const handleShare = async () => {
    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Resultado de ${studentName} no Piano Day`,
          text: shareText,
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareText)}`,
          "_blank",
        );
      }

      setShareFeedback("done");
      window.setTimeout(() => {
        setShareFeedback("idle");
      }, 1800);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button size="lg" onClick={handleShare} disabled={isSharing}>
        {isSharing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : shareFeedback === "done" ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <Share2Icon className="h-4 w-4" />
        )}
        {shareFeedback === "done" ? "Copiado!" : "Compartilhar"}
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
        onClick={() =>
          router.push(
            playerType === "student" ? `/?registration=${registration}` : "/",
          )
        }
      >
        <HouseIcon className="h-4 w-4" />
        Jogar novamente
      </Button>
    </div>
  );
};
