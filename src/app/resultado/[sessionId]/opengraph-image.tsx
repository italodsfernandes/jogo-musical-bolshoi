import { ImageResponse } from "next/og";

import { getResultSnapshot } from "@/lib/firebase";

export const runtime = "nodejs";
export const alt = "Card de resultado do Piano Day Bolshoi";
export const size = {
  width: 1080,
  height: 1080,
};
export const contentType = "image/png";

interface OgImageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function OgImage({ params }: OgImageProps) {
  const { sessionId } = await params;
  const result = await getResultSnapshot(sessionId).catch(() => null);

  const displayName = result?.studentName
    ? result.studentName.length > 22
      ? `${result.studentName.slice(0, 22)}...`
      : result.studentName
    : "Jogador";

  const displayTitle = result?.title
    ? result.title.length > 26
      ? `${result.title.slice(0, 26)}...`
      : result.title
    : "Resultado especial";

  const whiteKeyCount = 26;
  const whiteKeys = Array.from({ length: whiteKeyCount });
  const blackKeyPattern = [1, 2, 4, 5, 6];
  const blackKeys = Array.from({ length: 4 }).flatMap((_, octave) =>
    blackKeyPattern
      .map((offset) => octave * 7 + offset)
      .filter((index) => index < whiteKeyCount),
  );

  const headerLabelStyle = {
    fontFamily: "sans-serif",
    letterSpacing: "0.24em",
    textTransform: "uppercase" as const,
    fontWeight: 700,
    color: "rgba(176,148,90,0.86)",
    background: "rgba(176,148,90,0.08)",
    border: "1px solid rgba(176,148,90,0.22)",
    borderRadius: 999,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
  };

  const brandLabelStyle = {
    ...headerLabelStyle,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    fontWeight: 600,
    color: "rgba(176,148,90,0.78)",
    padding: "8px 14px",
  };

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        background:
          "radial-gradient(circle at top, rgba(176,148,90,0.12), transparent 34%), linear-gradient(160deg, #0C3E3F 0%, #062E2F 48%, #031E1F 100%)",
        color: "#FCFBF7",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
        padding: 62,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 24,
          borderRadius: 34,
          border: "1px solid rgba(176,148,90,0.14)",
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -126,
          left: "50%",
          transform: "translateX(-50%)",
          width: 420,
          height: 420,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(176,148,90,0.14) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -120,
          width: 420,
          height: 420,
          borderRadius: 999,
          background:
            "radial-gradient(circle, rgba(176,148,90,0.07) 0%, transparent 70%)",
          display: "flex",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          flex: 1,
          position: "relative",
          paddingBottom: 66,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ ...headerLabelStyle, fontSize: 16 }}>Piano Day</span>
          </div>

          <span style={{ ...brandLabelStyle, fontSize: 16 }}>
            Escola do Teatro Bolshoi no Brasil
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            marginTop: 34,
          }}
        >
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              color: "rgba(176,148,90,0.5)",
              fontWeight: 600,
            }}
          >
            Conquista
          </span>

          <span
            style={{
              marginTop: 14,
              fontSize: 52,
              lineHeight: 1.02,
              fontWeight: 700,
              color: "#EAD7A8",
              maxWidth: 780,
              textAlign: "center",
            }}
          >
            {displayTitle}
          </span>

          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              color: "rgba(176,148,90,0.5)",
              fontWeight: 600,
              marginTop: 58,
            }}
          >
            Performance de
          </span>

          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1,
              color: "#FCFBF7",
              marginTop: 10,
              textAlign: "center",
              maxWidth: 820,
            }}
          >
            {displayName}
          </span>

          <div
            style={{
              width: 80,
              height: 2,
              background:
                "linear-gradient(90deg, rgba(176,148,90,0), #B0945A, rgba(176,148,90,0))",
              borderRadius: 2,
              marginTop: 18,
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <span
              style={{
                fontSize: 250,
                fontWeight: 700,
                lineHeight: 0.85,
                color: "#B0945A",
                letterSpacing: "-0.055em",
                textShadow: "0 2px 20px rgba(176,148,90,0.25)",
              }}
            >
              {result?.score ?? "--"}
            </span>
            <span
              style={{
                fontSize: 14,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
                color: "rgba(176,148,90,0.5)",
                fontWeight: 600,
                marginTop: 10,
              }}
            >
              pontos
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 32,
          }}
        ></div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            height: 46,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 836,
              height: 42,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
              {whiteKeys.map((_, index) => (
                <div
                  key={`white-${index}`}
                  style={{
                    width: 30,
                    height: 42,
                    borderRadius: "0 0 6px 6px",
                    background:
                      "linear-gradient(180deg, rgba(252,251,247,0.1), rgba(252,251,247,0.06))",
                    border: "1px solid rgba(252,251,247,0.07)",
                    display: "flex",
                  }}
                />
              ))}
            </div>

            {blackKeys.map((position, index) => (
              <div
                key={`black-${index}`}
                style={{
                  position: "absolute",
                  left: position * 32 - 10,
                  top: 0,
                  width: 20,
                  height: 24,
                  borderRadius: "0 0 5px 5px",
                  background:
                    "linear-gradient(180deg, rgba(176,148,90,0.2), rgba(176,148,90,0.12))",
                  border: "1px solid rgba(176,148,90,0.2)",
                  display: "flex",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
