import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { decryptAudioToken } from "@/features/game/rounds";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

const buildAudioHeaders = ({
  fileSize,
  contentLength,
  contentRange,
}: {
  fileSize: number;
  contentLength: number;
  contentRange?: string;
}) => {
  const headers = new Headers({
    "Content-Type": "audio/mpeg",
    "Accept-Ranges": "bytes",
    "Content-Length": String(contentLength),
    "Cache-Control": "private, no-store",
  });

  if (contentRange) {
    headers.set("Content-Range", contentRange);
  } else {
    headers.set("Content-Length", String(fileSize));
  }

  return headers;
};

const parseRangeHeader = (rangeHeader: string, fileSize: number) => {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    return null;
  }

  const [, startRaw, endRaw] = match;

  if (!startRaw && !endRaw) {
    return null;
  }

  if (!startRaw) {
    const suffixLength = Number.parseInt(endRaw, 10);

    if (Number.isNaN(suffixLength) || suffixLength <= 0) {
      return null;
    }

    const contentLength = Math.min(suffixLength, fileSize);
    const start = fileSize - contentLength;
    const end = fileSize - 1;

    return {
      start,
      end,
      contentLength,
    };
  }

  const start = Number.parseInt(startRaw, 10);
  const requestedEnd = endRaw
    ? Number.parseInt(endRaw, 10)
    : fileSize - 1;

  if (
    Number.isNaN(start) ||
    Number.isNaN(requestedEnd) ||
    start < 0 ||
    requestedEnd < start ||
    start >= fileSize
  ) {
    return null;
  }

  const end = Math.min(requestedEnd, fileSize - 1);

  return {
    start,
    end,
    contentLength: end - start + 1,
  };
};

export async function GET(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = decryptAudioToken(token);

  if (!payload) {
    return NextResponse.json({ message: "Token de audio invalido." }, { status: 400 });
  }

  const normalizedAudioPath = path.posix.normalize(payload.audioSrc);

  if (!normalizedAudioPath.startsWith("/audio/")) {
    return NextResponse.json({ message: "Audio nao autorizado." }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", normalizedAudioPath);

  try {
    const { size: fileSize } = await stat(filePath);
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const range = parseRangeHeader(rangeHeader, fileSize);

      if (!range) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const stream = createReadStream(filePath, {
        start: range.start,
        end: range.end,
      });

      return new NextResponse(
        Readable.toWeb(stream) as ReadableStream<Uint8Array>,
        {
        status: 206,
        headers: buildAudioHeaders({
          fileSize,
          contentLength: range.contentLength,
          contentRange: `bytes ${range.start}-${range.end}/${fileSize}`,
        }),
      },
      );
    }

    const stream = createReadStream(filePath);

    return new NextResponse(
      Readable.toWeb(stream) as ReadableStream<Uint8Array>,
      {
      status: 200,
      headers: buildAudioHeaders({
        fileSize,
        contentLength: fileSize,
      }),
    },
    );
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel carregar o audio." },
      { status: 404 },
    );
  }
}
