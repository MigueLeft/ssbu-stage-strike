import type { PlayerId } from '../state/appReducer';

interface PlayerNamesProps {
  players: Record<PlayerId, string>;
  readOnly?: boolean;
  onChange: (player: PlayerId, name: string) => void;
}

export function PlayerNames({ players, readOnly, onChange }: PlayerNamesProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-orange" />
        <input
          value={players.p1}
          readOnly={readOnly}
          onChange={(e) => onChange('p1', e.target.value)}
          className="w-28 bg-transparent text-sm font-medium text-white placeholder-white/50 outline-none sm:w-36"
          placeholder="Jugador 1"
        />
      </label>
      <label className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-lilac" />
        <input
          value={players.p2}
          readOnly={readOnly}
          onChange={(e) => onChange('p2', e.target.value)}
          className="w-28 bg-transparent text-sm font-medium text-white placeholder-white/50 outline-none sm:w-36"
          placeholder="Jugador 2"
        />
      </label>
    </div>
  );
}
