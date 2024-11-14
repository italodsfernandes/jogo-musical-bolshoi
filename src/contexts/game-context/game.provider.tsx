import { useState, ReactNode } from "react";
import { GameContext, GameContextType } from "./game.context";

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider = ({ children }: GameProviderProps) => {
  const [playerName, setPlayerName] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);

  const resetGame = (playerName?: string) => {
    setPlayerName(playerName ?? "");
    setScore(0);
    setCurrentRound(1);
    setIsAnswered(false);
  };

  const contextValue: GameContextType = {
    playerName,
    setPlayerName,
    score,
    setScore,
    currentRound,
    setCurrentRound,
    isAnswered,
    setIsAnswered,
    resetGame,
  };

  return (
    <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>
  );
};
