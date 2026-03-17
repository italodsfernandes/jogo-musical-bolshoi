import { ImageResponse } from "next/og";
import QRCode from "qrcode";

import { getResultSnapshot } from "@/lib/firebase";

export const runtime = "nodejs";
export const alt = "Card de resultado do Piano Day MusiQuiz";
export const size = {
  width: 1200,
  height: 630,
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
    : "Aluno";
  const displayTitle = result?.title
    ? result.title.length > 26
      ? `${result.title.slice(0, 26)}...`
      : result.title
    : "Resultado especial";
  const positionLabel =
    result?.position === 1
      ? "🥇 1º lugar"
      : result?.position === 2
        ? "🥈 2º lugar"
        : result?.position === 3
          ? "🥉 3º lugar"
          : `#${result?.position ?? "--"}`;
  const playerBadge =
    result?.playerType === "student" ? "Aluno Bolshoi 🎓" : "Visitante 🎵";
  const qrCode = result?.shareUrl
    ? await QRCode.toDataURL(result.shareUrl, {
        margin: 1,
        color: {
          dark: "#052B2C",
          light: "#FCFBF7",
        },
      })
    : null;

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "radial-gradient(circle at top, rgba(200,166,70,0.22), transparent 40%), linear-gradient(180deg, #FCFBF7 0%, #F5F4EF 100%)",
        color: "#142022",
        padding: "48px",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              opacity: 0.6,
            }}
          >
            Piano Day • {playerBadge}
          </span>
          <span style={{ fontSize: 52, fontWeight: 700 }}>
            MusiQuiz Grand Finale
          </span>
        </div>
        <div
          style={{
            borderRadius: 999,
            border: "2px solid rgba(200,166,70,0.45)",
            padding: "12px 22px",
            fontSize: 22,
            maxWidth: 340,
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          {displayTitle}
        </div>
      </div>

      {/* ── Cards row ── */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          gap: 32,
          flex: 1,
        }}
      >
        {/* Left card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            borderRadius: 36,
            border: "2px solid rgba(200,166,70,0.36)",
            background: "rgba(252,251,247,0.92)",
            padding: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span
              style={{
                fontSize: 18,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontFamily: "sans-serif",
                opacity: 0.5,
              }}
            >
              Performance de
            </span>
            <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>
              {displayName}
            </span>
          </div>

          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 16,
                  fontFamily: "sans-serif",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                }}
              >
                Pontos
              </span>
              <span style={{ fontSize: 110, fontWeight: 700, lineHeight: 1 }}>
                {result?.score ?? "--"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontFamily: "sans-serif",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  opacity: 0.6,
                }}
              >
                Lugar
              </span>
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  fontFamily: "sans-serif",
                }}
              >
                {positionLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right dark card */}
        <div
          style={{
            width: 292,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: 20,
            borderRadius: 36,
            background: "#052B2C",
            color: "#FCFBF7",
            padding: "28px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontFamily: "sans-serif",
            }}
          >
            <span
              style={{
                fontSize: 16,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Piano Day 🎹
            </span>
            <span style={{ fontSize: 26, lineHeight: 1.25, fontWeight: 600 }}>
              Veja o placar completo.
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              alignItems: "center",
            }}
          >
            {qrCode ? (
              <img
                alt="QR Code do resultado"
                src={qrCode}
                width={210}
                height={210}
                style={{ borderRadius: 20 }}
              />
            ) : null}
            <span
              style={{
                textAlign: "center",
                fontSize: 15,
                opacity: 0.5,
                fontFamily: "sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              musiquiz.bolshoi
            </span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
