import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StartPage } from "@/pages/start.page";
import { GamePage } from "@/pages/game.page";
import { ResultsPage } from "@/pages/results.page";
import { LeaderBoardPage } from "@/pages/leader-board.page";
import { GameProvider } from "./contexts/game-context/game.provider";

export const App = () => {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex flex-col justify-center">
          <main className="flex items-center justify-center p-2">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full">
              <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/leaderboard" element={<LeaderBoardPage />} />
              </Routes>
            </div>
          </main>
          <footer className="flex items-center justify-center pb-2 w-full text-center backdrop-blur-sm">
            <p className="text-gray-600">
              Desenvolvido com 💜 por{" "}
              <a
                href="https://migracode.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-900 transition-colors duration-300"
              >
                migracode.com.br
              </a>
            </p>
          </footer>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
};
