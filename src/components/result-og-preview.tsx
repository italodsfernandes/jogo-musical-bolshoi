"use client";

import { DownloadIcon, LoaderCircleIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export const ResultOgPreview = ({
  sessionId,
  studentName,
}: {
  sessionId: string;
  studentName: string;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/resultado/${sessionId}/opengraph-image`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `musiquiz-${sessionId}.png`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(255,248,230,0.56)]">
        Seu card
      </p>

      <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border-2 border-[rgba(255,248,230,0.15)] bg-[rgba(255,248,230,0.06)] shadow-lg">
        {!isLoaded ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden bg-[rgba(255,248,230,0.06)]"
          >
            <div className="absolute inset-0 -translate-x-full animate-[og-shimmer_1.6s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,248,230,0.1),transparent)]" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
              <div className="h-4 w-1/3 rounded-lg bg-[rgba(255,248,230,0.1)]" />
              <div className="h-4 w-2/5 rounded-lg bg-[rgba(255,248,230,0.07)]" />
            </div>
          </div>
        ) : null}

        <Image
          alt={`Card de ${studentName}`}
          src={`/resultado/${sessionId}/opengraph-image`}
          fill
          sizes="(max-width: 768px) 100vw, 448px"
          onLoad={() => setIsLoaded(true)}
          className={`h-full w-full object-cover transition-opacity duration-400 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(4,34,35,0.35)] to-transparent" />

        {isLoaded ? (
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-label="Baixar card"
            className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(4,34,35,0.55)] text-white/80 backdrop-blur-sm transition-all hover:bg-[rgba(4,34,35,0.75)] hover:text-white active:scale-95"
          >
            {isDownloading ? (
              <LoaderCircleIcon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};
