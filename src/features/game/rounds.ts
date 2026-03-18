import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { QUESTION_IDS, QUESTIONS, QUESTIONS_BY_ID } from "@/features/game/questions";
import {
  GameRoundData,
  GameRoundState,
  Question,
  QuestionOption,
} from "@/features/game/types";

interface AudioTokenPayload {
  v: 1;
  audioSrc: string;
}

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const DEV_FALLBACK_SECRET = "dev-only-game-order-secret-change-in-production";

let hasWarnedAboutFallbackSecret = false;

const shuffleArray = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

const getEncryptionSecret = () => {
  const configuredSecret = process.env.GAME_ORDER_SECRET?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("GAME_ORDER_SECRET is required in production.");
  }

  if (!hasWarnedAboutFallbackSecret) {
    hasWarnedAboutFallbackSecret = true;
    console.warn(
      "GAME_ORDER_SECRET is not configured. Falling back to an insecure development secret.",
    );
  }

  return DEV_FALLBACK_SECRET;
};

const getEncryptionKey = (purpose: string) =>
  createHash("sha256")
    .update(`${purpose}:${getEncryptionSecret()}`)
    .digest();

const encodeOpaqueToken = ({
  iv,
  ciphertext,
  authTag,
}: {
  iv: Buffer;
  ciphertext: Buffer;
  authTag: Buffer;
}) =>
  Buffer.concat([iv, authTag, ciphertext]).toString("base64url");

const decodeOpaqueToken = (token: string) => {
  if (Buffer.from(token, "base64url").toString("base64url") !== token) {
    return null;
  }

  const payload = Buffer.from(token, "base64url");
  const minLength = IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES + 1;

  if (payload.length < minLength) {
    return null;
  }

  return {
    iv: payload.subarray(0, IV_LENGTH_BYTES),
    authTag: payload.subarray(
      IV_LENGTH_BYTES,
      IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES,
    ),
    ciphertext: payload.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES),
  };
};

const encryptOpaquePayload = (purpose: string, payload: object) => {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(AES_ALGORITHM, getEncryptionKey(purpose), iv);
  const serialized = JSON.stringify(payload);
  const ciphertext = Buffer.concat([
    cipher.update(serialized, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return encodeOpaqueToken({ iv, ciphertext, authTag });
};

const decryptOpaquePayload = <T,>(purpose: string, token: string): T | null => {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const decoded = decodeOpaqueToken(token);

    if (!decoded) {
      return null;
    }

    const decipher = createDecipheriv(
      AES_ALGORITHM,
      getEncryptionKey(purpose),
      decoded.iv,
    );
    decipher.setAuthTag(decoded.authTag);
    const plaintext = Buffer.concat([
      decipher.update(decoded.ciphertext),
      decipher.final(),
    ]).toString("utf8");

    return JSON.parse(plaintext) as T;
  } catch {
    return null;
  }
};

const isAudioTokenPayload = (payload: unknown): payload is AudioTokenPayload => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<AudioTokenPayload>;

  return (
    candidate.v === 1 &&
    typeof candidate.audioSrc === "string" &&
    QUESTIONS.some((question) => question.audioSrc === candidate.audioSrc)
  );
};

const createRoundOption = (question: Question) => ({
  optionId: randomBytes(12).toString("hex"),
  composer: question.composer,
  music: question.music,
});

export const buildQuestionOrder = (questionIds: string[] = QUESTION_IDS) =>
  shuffleArray(questionIds);

export const createAnswerOptions = (
  currentQuestionId: string,
  allQuestions: Question[],
  optionCount = 4,
): { options: QuestionOption[]; answerKey: string } | null => {
  const currentQuestion = allQuestions.find(
    (question) => question.id === currentQuestionId,
  );

  if (!currentQuestion) {
    return null;
  }

  const uniqueOtherQuestionsById = new Map(
    allQuestions
      .filter((question) => question.id !== currentQuestionId)
      .map((question) => [question.id, question]),
  );
  const otherQuestions = shuffleArray([...uniqueOtherQuestionsById.values()]);
  const roundQuestions = shuffleArray([
    currentQuestion,
    ...otherQuestions.slice(0, optionCount - 1),
  ]);
  const options = roundQuestions.map(createRoundOption);
  const answerOption = options.find(
    (_, index) => roundQuestions[index]?.id === currentQuestion.id,
  );

  if (!answerOption) {
    return null;
  }

  return {
    options,
    answerKey: answerOption.optionId,
  };
};

export const encryptAudioToken = (audioSrc: string) =>
  encryptOpaquePayload("audio-token", {
    v: 1,
    audioSrc,
  });

export const decryptAudioToken = (token: string): AudioTokenPayload | null => {
  const parsed = decryptOpaquePayload<unknown>("audio-token", token);

  return isAudioTokenPayload(parsed) ? parsed : null;
};

export const createRoundState = (
  questionOrder: string[],
  currentRound: number,
): GameRoundState | null => {
  const currentQuestionId = questionOrder[currentRound - 1];

  if (!currentQuestionId) {
    return null;
  }

  const currentQuestion = QUESTIONS_BY_ID.get(currentQuestionId);

  if (!currentQuestion) {
    return null;
  }

  const roundOptions = createAnswerOptions(currentQuestion.id, QUESTIONS);

  if (!roundOptions) {
    return null;
  }

  return {
    answerKey: roundOptions.answerKey,
    audioToken: encryptAudioToken(currentQuestion.audioSrc),
    options: roundOptions.options,
    roundStartedAt: null,
    answeredAt: null,
    selectedOptionId: null,
  };
};

export const toPublicRoundData = (
  roundState: GameRoundState,
): GameRoundData => {
  return {
    currentQuestion: {
      audioToken: roundState.audioToken,
    },
    options: roundState.options,
    roundStartedAt: roundState.roundStartedAt,
  };
};
