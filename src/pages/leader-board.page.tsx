import { Button } from "@/components/ui/button";
import { useGame } from "@/hooks/useGame";
import { fetchLeaderBoard, PlayerScore } from "@/lib/firebase";
import { ArrowLeftIcon, StarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const LeaderBoardPage = () => {
  const navigate = useNavigate();
  const { resetGame } = useGame();

  const [leaderBoard, setLeaderBoard] = useState<PlayerScore[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadLeaderBoard = async () => {
      const data = await fetchLeaderBoard();
      setLeaderBoard(data);
      setLoading(false);
    };

    loadLeaderBoard();
  }, []);

  const handleNewGame = () => {
    resetGame();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-600 text-center">
        🏆 Ranking 🏆
      </h2>

      <div className="flex justify-center items-end space-x-4 mb-6">
        <div className="flex flex-col items-center flex-1">
          <div className="bg-gradient-to-b from-gray-200 to-gray-300 w-full h-24 flex flex-col items-center justify-center rounded-t-lg text-center">
            <span className="text-xl font-semibold text-center">2º 🥈</span>
            <span className="text-sm text-center">{leaderBoard[1]?.name}</span>
            <span className="text-sm font-semibold text-green-600 text-center">
              {leaderBoard[1]?.score}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1">
          <div className="bg-gradient-to-b from-yellow-300 to-yellow-400 w-full h-32 flex flex-col items-center justify-center rounded-t-lg">
            <span className="text-2xl font-semibold text-center">1º 🥇</span>
            <span className="text-sm text-center">{leaderBoard[0]?.name}</span>
            <span className="text-sm font-semibold text-green-600 text-center">
              {leaderBoard[0]?.score}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1">
          <div className="bg-gradient-to-b from-orange-200 to-orange-300 w-full h-20 flex flex-col items-center justify-center rounded-t-lg text-center">
            <span className="text-lg font-semibold text-center">3º 🥉</span>
            <span className="text-sm text-center">{leaderBoard[2]?.name}</span>
            <span className="text-xs font-semibold text-green-600 text-center">
              {leaderBoard[2]?.score}
            </span>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {leaderBoard.slice(3).map((entry, index) => (
          <li
            key={index + 3}
            className="flex justify-between items-center bg-gray-100 rounded p-2 transition-all duration-300 ease-in-out hover:bg-gray-200"
          >
            <span className="font-semibold">
              {index + 4}. {entry.name}
            </span>
            <span className="text-green-600">
              {entry.score}{" "}
              <StarIcon className="inline-block ml-1 h-4 w-4 text-yellow-500" />
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={handleNewGame}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg"
      >
        <ArrowLeftIcon className="mr-2 h-5 w-5" /> Início 🏠
      </Button>
    </div>
  );
};
