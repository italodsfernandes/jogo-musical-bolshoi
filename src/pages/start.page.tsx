import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGame } from "@/hooks/useGame";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const StartPage = () => {
  const { playerName, setPlayerName, resetGame } = useGame();

  const navigate = useNavigate();

  const handleStart = () => {
    if (playerName.trim()) {
      navigate("/game");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && playerName.trim()) {
      handleStart();
    }
  };

  useEffect(() => {
    resetGame(playerName);
  }, [playerName, resetGame]);

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold text-purple-600">🎼 Jogo Musical 🎼</h1>
      <p className="text-lg text-gray-600">
        Teste seus conhecimentos sobre compositores clássicos!
      </p>
      <Input
        type="text"
        placeholder="Digite seu nome e sobrenome"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={handleKeyPress}
        className="text-center"
      />
      <Button
        onClick={handleStart}
        disabled={!playerName.trim()}
        className="w-full bg-green-500 hover:bg-green-600 text-white text-lg"
      >
        Iniciar Jogo!
      </Button>
    </div>
  );
};
