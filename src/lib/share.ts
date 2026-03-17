export type ShareStrategy = "file" | "native" | "clipboard" | "whatsapp";

export interface ShareCapabilities {
  canShareFiles: boolean;
  canNativeShare: boolean;
  canClipboard: boolean;
}

export interface ResultShareMessage {
  title: string;
  nativeText: string;
  clipboardText: string;
}

export interface ShareResult {
  status: "shared" | "copied" | "cancelled" | "failed";
  strategy?: ShareStrategy;
}

interface NavigatorLike {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: {
    writeText: (value: string) => Promise<void>;
  };
}

interface ShareDeps {
  navigatorRef?: NavigatorLike;
  openWindow?: (url: string, target?: string) => unknown;
  fetchRef?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  fileCtor?: typeof File;
}

interface ShareResultInput {
  sessionId: string;
  studentName: string;
  score: number;
  shareUrl: string;
}

const FEEDBACK_TIMEOUT_MS = 1800;

export const SHARE_FEEDBACK_TIMEOUT_MS = FEEDBACK_TIMEOUT_MS;

export const createResultShareMessage = ({
  score,
  shareUrl,
  studentName,
}: {
  score: number;
  shareUrl: string;
  studentName: string;
}): ResultShareMessage => {
  const title = `Resultado de ${studentName} no Piano Day`;
  const nativeText = `Fiz ${score} pts no MusiQuiz Piano Day 🎹 Será que você bate?`;
  const clipboardText = `${nativeText} ${shareUrl}`;

  return {
    title,
    nativeText,
    clipboardText,
  };
};

export const getShareCapabilities = ({
  navigatorRef,
  fileCtor,
}: {
  navigatorRef: NavigatorLike;
  fileCtor?: typeof File;
}): ShareCapabilities => {
  const canNativeShare = typeof navigatorRef.share === "function";
  const canClipboard = typeof navigatorRef.clipboard?.writeText === "function";

  const hasFileCtor = Boolean(fileCtor);
  let canShareFiles = false;

  if (
    canNativeShare &&
    typeof navigatorRef.canShare === "function" &&
    hasFileCtor
  ) {
    try {
      canShareFiles = navigatorRef.canShare({
        files: [new fileCtor!([""], "probe.png", { type: "image/png" })],
      });
    } catch {
      canShareFiles = false;
    }
  }

  return {
    canShareFiles,
    canNativeShare,
    canClipboard,
  };
};

export const selectShareStrategy = (
  capabilities: ShareCapabilities,
): ShareStrategy => {
  if (capabilities.canShareFiles) {
    return "file";
  }

  if (capabilities.canNativeShare) {
    return "native";
  }

  if (capabilities.canClipboard) {
    return "clipboard";
  }

  return "whatsapp";
};

const isAbortError = (error: unknown) => {
  return error instanceof DOMException && error.name === "AbortError";
};

const createShareImageFile = async ({
  sessionId,
  fetchRef,
  fileCtor,
}: {
  sessionId: string;
  fetchRef: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  fileCtor: typeof File;
}) => {
  const response = await fetchRef(`/resultado/${sessionId}/opengraph-image`);

  if (!response.ok) {
    throw new Error("Could not load result image for sharing");
  }

  const blob = await response.blob();

  return new fileCtor([blob], `musiquiz-${sessionId}.png`, {
    type: blob.type || "image/png",
  });
};

const getFallbackChain = (start: ShareStrategy): ShareStrategy[] => {
  if (start === "file") {
    return ["file", "native", "clipboard", "whatsapp"];
  }

  if (start === "native") {
    return ["native", "clipboard", "whatsapp"];
  }

  if (start === "clipboard") {
    return ["clipboard", "whatsapp"];
  }

  return ["whatsapp"];
};

export const shareResultWithFallback = async (
  input: ShareResultInput,
  deps: ShareDeps = {},
): Promise<ShareResult> => {
  const navigatorRef = deps.navigatorRef ?? (globalThis.navigator as NavigatorLike);
  const openWindow = deps.openWindow ?? globalThis.window?.open?.bind(globalThis.window);
  const fetchRef = deps.fetchRef ?? globalThis.fetch;
  const fileCtor = deps.fileCtor ?? globalThis.File;

  const message = createResultShareMessage({
    score: input.score,
    shareUrl: input.shareUrl,
    studentName: input.studentName,
  });

  const capabilities = getShareCapabilities({
    navigatorRef,
    fileCtor,
  });

  const chain = getFallbackChain(selectShareStrategy(capabilities));

  for (const strategy of chain) {
    try {
      if (strategy === "file") {
        if (
          typeof navigatorRef.share !== "function" ||
          typeof fetchRef !== "function" ||
          !fileCtor
        ) {
          continue;
        }

        const imageFile = await createShareImageFile({
          sessionId: input.sessionId,
          fetchRef,
          fileCtor,
        });

        await navigatorRef.share({
          title: message.title,
          text: message.nativeText,
          url: input.shareUrl,
          files: [imageFile],
        });

        return { status: "shared", strategy: "file" };
      }

      if (strategy === "native") {
        if (typeof navigatorRef.share !== "function") {
          continue;
        }

        await navigatorRef.share({
          title: message.title,
          text: message.nativeText,
          url: input.shareUrl,
        });

        return { status: "shared", strategy: "native" };
      }

      if (strategy === "clipboard") {
        if (typeof navigatorRef.clipboard?.writeText !== "function") {
          continue;
        }

        await navigatorRef.clipboard.writeText(message.clipboardText);
        return { status: "copied", strategy: "clipboard" };
      }

      if (typeof openWindow === "function") {
        openWindow(
          `https://wa.me/?text=${encodeURIComponent(message.clipboardText)}`,
          "_blank",
        );
        return { status: "shared", strategy: "whatsapp" };
      }
    } catch (error) {
      if ((strategy === "file" || strategy === "native") && isAbortError(error)) {
        return { status: "cancelled", strategy };
      }
    }
  }

  return { status: "failed" };
};
