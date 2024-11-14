import { createContext, Dispatch, SetStateAction } from "react";

export interface GameContextType {
  playerName: string;
  setPlayerName: Dispatch<SetStateAction<string>>;
  score: number;
  setScore: Dispatch<SetStateAction<number>>;
  currentRound: number;
  setCurrentRound: Dispatch<SetStateAction<number>>;
  isAnswered: boolean;
  setIsAnswered: Dispatch<SetStateAction<boolean>>;
  resetGame: (playerName?: string) => void;
}

export const GameContext = createContext<GameContextType | undefined>(
  undefined
);
