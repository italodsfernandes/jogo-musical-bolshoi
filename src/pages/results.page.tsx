import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { saveScore } from "@/lib/firebase";
import { TrophyIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const ResultsPage = () => {
  const navigate = useNavigate();
  const { playerName, score, currentRound, resetGame } = useGame();

  const handlePlayAgain = () => {
    resetGame(playerName);
    navigate("/game");
  };

  const handleNewGame = () => {
    resetGame();
    navigate("/");
  };

  const handleViewLeaderBoard = () => {
    navigate("/leaderboard");
  };

  useEffect(() => {
    if (currentRound === 1) {
      resetGame(playerName);
      navigate("/");
    }
  }, [currentRound, navigate, playerName, resetGame]);

  useEffect(() => {
    console.log(playerName, score);
    if (playerName && score !== undefined) {
      saveScore(playerName, score);
    }
  }, [playerName, score]);

  return (
    <div className="space-y-6 text-center">
      <h2 className="text-3xl font-bold text-purple-600">Fim de Jogo! 🎉</h2>
      <p className="text-xl text-gray-600">
        Parabéns, {playerName}! Seu score:{" "}
        <span className="font-semibold text-green-600">{score} 🌟</span>
      </p>
      <Button
        onClick={handleViewLeaderBoard}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-lg flex items-center justify-center"
      >
        <TrophyIcon className="mr-2 h-5 w-5" /> Ver Ranking 🏆
      </Button>
      <Button
        onClick={handlePlayAgain}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg flex items-center justify-center"
      >
        Jogar Novamente 🔄
      </Button>
      <Button
        onClick={handleNewGame}
        className="w-full bg-gray-500 hover:bg-gray-600 text-white text-lg flex items-center justify-center"
      >
        Iniciar Novo Jogo ✨
      </Button>
    </div>
  );
};
