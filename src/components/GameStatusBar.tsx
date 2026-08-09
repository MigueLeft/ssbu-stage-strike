import type { Stage } from '../data/stages';
import type { PlayerId } from '../state/appReducer';

interface GameStatusBarProps {
  round: number;
  currentStage?: Stage;
  players: Record<PlayerId, string>;
  readOnly?: boolean;
  onDeclareWinner: (winner: PlayerId) => void;
}

export function GameStatusBar({ round, currentStage, players, readOnly, onDeclareWinner }: GameStatusBarProps) {
  if (!currentStage) return null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-4 shadow-sm sm:flex-row sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <img
          src={currentStage.image.src}
          alt={currentStage.name}
          className="h-14 w-24 rounded-xl object-cover shadow-sm"
        />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-dark-secondary">Partida {round}</p>
          <p className="font-heading text-base font-semibold text-text-dark">{currentStage.name}</p>
        </div>
      </div>

      {!readOnly && (
        <div className="hidden items-center gap-2 sm:flex">
          <span className="mr-1 text-sm font-medium text-text-dark-secondary">Siguiente partida — ¿quién ganó?</span>
          <button
            type="button"
            onClick={() => onDeclareWinner('p1')}
            className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {players.p1}
          </button>
          <button
            type="button"
            onClick={() => onDeclareWinner('p2')}
            className="rounded-full bg-lilac px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {players.p2}
          </button>
        </div>
      )}
    </div>
  );
}
