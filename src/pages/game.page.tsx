import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useGame } from "@/hooks/useGame";
import {
  CheckIcon,
  Music2Icon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  XIcon,
} from "lucide-react";
import { SetStateAction, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import YouTube, { YouTubeEvent } from "react-youtube";

const questions = [
  {
    id: "I_AX4R-d29o",
    composer: "Wolfgang Amadeus Mozart",
    music: "piano sonata n°16 k.545",
    startTime: 7,
  },
  {
    id: "pOT1T2qSd2M",
    composer: "Ludwig Van Beethoven",
    music: "Sonata op.27 n°2 - Moonlight Sonata",
    startTime: 0,
  },
  {
    id: "_RmuTuVWXy4",
    composer: "Robert Schumann",
    music: "traumerei - Cenas Infantis op.15 n°7",
    startTime: 0,
  },
  {
    id: "kkq_3CrvFUM",
    composer: "Franz Liszt",
    music: "La Campanella",
    startTime: 7,
  },
  {
    id: "BWerj8FcprM",
    composer: "Piotr Ilitch Tchaikovski",
    music: "Concerto para piano e orquestra n°1",
    startTime: 0,
  },
  {
    id: "c977QdbTImU",
    composer: "Claude Debussy",
    music: "Clair de lune",
    startTime: 2,
  },
  {
    id: "Fxk9qwCFf8s",
    composer: "Scott Joplin",
    music: "The Entertainer",
    startTime: 0,
  },
  {
    id: "ievpSwyvxoE",
    composer: "Felix Mendelssohn",
    music: "Canções sem Palavras Op.67 n°2",
    startTime: 0,
  },
  {
    id: "LUp2u9wI1fY",
    composer: "Franz Schubert",
    music: "IPROMPTU op.90 n°3",
    startTime: 3,
  },
  {
    id: "6bYdZo4MYEw",
    composer: "Frédéric Chopin",
    music: "Fantaisie-Impromptu",
    startTime: 0,
  },
  {
    id: "mKsAypz6Ou8",
    composer: "Johann Sebastian Bach",
    music: "Preludio e Fuga em Dó maior BWV 846",
    startTime: 22,
  },
].sort(() => 0.5 - Math.random());

export const GamePage = () => {
  const navigate = useNavigate();

  const {
    playerName,
    score,
    setScore,
    currentRound,
    setCurrentRound,
    isAnswered,
    setIsAnswered,
  } = useGame();

  const [isPlaying, setIsPlaying] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  const [ytPlayer, setYtPlayer] = useState<YT.Player | null>(null);
  const [answerFeedback, setAnswerFeedback] = useState<React.ReactNode>("");
  const [options, setOptions] = useState<string[]>([]);
  const [isLoadingNextRound, setIsLoadingNextRound] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const currentQuestion = questions[currentRound - 1];

  const togglePlay = () => {
    if (ytPlayer) {
      if (isPlaying) {
        ytPlayer?.pauseVideo();
      } else {
        ytPlayer.playVideo();
        ytPlayer.unMute();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const onReady = (event: YouTubeEvent) => {
    setYtPlayer(event.target);
    setVideoDuration(event.target.getDuration());

    event.target.playVideo();

    setTimeout(() => {
      event.target.unMute();
    }, 500);
  };

  const onStateChange = (event: {
    data: number;
    target: { getCurrentTime: () => SetStateAction<number> };
  }) => {
    if (event.data === 1) {
      setIsPlaying(true);
    }
  };

  const generateOptions = useCallback(() => {
    const optionsArray = [currentQuestion.composer];

    while (optionsArray.length < 4) {
      const randomComposer =
        questions[Math.floor(Math.random() * questions.length)].composer;
      if (!optionsArray.includes(randomComposer)) {
        optionsArray.push(randomComposer);
      }
    }

    setOptions(optionsArray.sort(() => 0.5 - Math.random()));
  }, [currentQuestion]);

  const handleAnswer = (composer: string) => {
    if (isAnswered) return;

    setIsAnswered(true);
    const correctAnswer = currentQuestion.composer;

    const timeTaken = Math.max(
      (ytPlayer ? ytPlayer.getCurrentTime() : 0) - currentQuestion.startTime,
      0
    );

    const maxTime = Math.max(videoDuration - currentQuestion.startTime, 1);

    const points = Math.max(
      1000 - Math.floor((timeTaken / maxTime) * 1000),
      100
    );

    if (composer === correctAnswer) {
      setScore(score + points);
      setAnswerFeedback(
        <div className="flex items-center flex-col">
          <div className="flex items-center flex-col">
            <div className="flex items-center">
              <CheckIcon className="h-8 w-8 mr-2 text-green-600" />
              <span>Resposta correta! 🎉</span>
            </div>
            <span>{currentQuestion.music}</span>
          </div>
          <span>+ {points} pontos</span>
        </div>
      );
    } else {
      setAnswerFeedback(
        <div className="flex items-center flex-col">
          <div className="flex items-center ">
            <XIcon className="h-8 w-8 mr-2 text-red-600" />
            <span>Resposta errada! 😔</span>
          </div>
          <span>A resposta correta era {correctAnswer}.</span>
          <span>{currentQuestion.music}</span>
        </div>
      );
    }

    setLoadingProgress(0);
    setIsLoadingNextRound(true);
  };

  useEffect(() => {
    generateOptions();
  }, [currentRound, generateOptions]);

  useEffect(() => {
    if (!playerName) navigate("/");
  }, [playerName, navigate]);

  useEffect(() => {
    if (isLoadingNextRound) {
      const loadingInterval = setInterval(() => {
        setLoadingProgress((prevProgress) => {
          if (prevProgress >= 100) {
            if (currentRound < questions.length) {
              clearInterval(loadingInterval);
              setIsLoadingNextRound(false);
              setLoadingProgress(0);
              setIsAnswered(false);
              setAnswerFeedback("");
              setCurrentRound(currentRound + 1);
              return prevProgress;
            } else {
              navigate("/results");
            }
          }
          return prevProgress + 5;
        });
      }, 200);

      return () => clearInterval(loadingInterval);
    }
  }, [
    currentRound,
    isLoadingNextRound,
    navigate,
    setCurrentRound,
    setIsAnswered,
  ]);

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center">
        <h2 className="text-base  md:text-xl font-semibold text-purple-600">
          Rodada {currentRound}/{questions.length} 🎭
        </h2>
        <span className="text-base md:text-xl font-semibold text-green-600">
          Pontos: {score} 🏆
        </span>
      </div>

      <div className="relative  rounded-lg overflow-hidden border-8 border-yellow-600 h-32">
        <div className="hidden">
          <YouTube
            videoId={currentQuestion.id}
            opts={{
              width: "100%",
              playerVars: {
                autoplay: 1,
                mute: 1,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                fs: 0,
                iv_load_policy: 3,
                cc_load_policy: 0,
                enablejsapi: 1,
                start: currentQuestion.startTime,
              },
            }}
            onReady={onReady}
            onStateChange={onStateChange}
          />
        </div>
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 text-white h-16 z-10">
          <div className="bg-yellow-100 flex items-center justify-between gap-6 h-full p-8 text-yellow-600">
            <Music2Icon className="h-8 w-8 text-yellow-600 animate-bounce" />
            <span className="text-base md:text-xl font-semibold text-yellow-600 text-center ">
              Qual o compositor?
            </span>
            <Music2Icon className="h-8 w-8 text-yellow-600 animate-bounce" />
          </div>
        </div>
        <div
          className={`absolute inset-0 bg-black transition duration-1000 ${
            isPlaying ? "bg-opacity-0" : "bg-opacity-100"
          }`}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-yellow-100 text-white h-16">
          <div className="bg-yellow-100 rounded-lg p-4 flex items-center justify-center">
            <Button
              onClick={togglePlay}
              variant="ghost"
              size="icon"
              className="text-yellow-600 "
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8" />
              ) : (
                <PlayIcon className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {answerFeedback && (
        <div className="bg-yellow-100 text-center text-base md:text-xl font-semibold text-yellow-600 flex items-center justify-center whitespace-pre-line">
          {answerFeedback}
        </div>
      )}

      {isLoadingNextRound && (
        <Progress value={loadingProgress} className="w-full h-2 bg-gray-200">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-200 ease-in-out"
            style={{ width: `${loadingProgress}%` }}
          />
        </Progress>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((composer) => (
          <Button
            key={composer}
            onClick={() => handleAnswer(composer)}
            disabled={isAnswered || isLoadingNextRound || !isPlaying}
            className="bg-blue-500 hover:bg-blue-600 text-white text-base md:text-xl transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            {composer} <MusicIcon className="ml-2 h-5 w-5" />
          </Button>
        ))}
      </div>
    </div>
  );
};
