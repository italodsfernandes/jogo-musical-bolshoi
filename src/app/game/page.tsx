import { GamePageGate } from "@/components/game-page-gate";
import { isGameClosed } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function GamePage() {
  return <GamePageGate initialClosed={isGameClosed()} />;
}
