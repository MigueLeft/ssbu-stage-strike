import type { PlayerId, RpsChoice } from '../state/appReducer';
import type { Role } from '../state/rolePermissions';

const CHOICES: { value: RpsChoice; emoji: string; label: string }[] = [
  { value: 'rock', emoji: '🪨', label: 'Piedra' },
  { value: 'paper', emoji: '📄', label: 'Papel' },
  { value: 'scissors', emoji: '✂️', label: 'Tijera' },
];

interface RpsPanelProps {
  p1Choice?: RpsChoice;
  p2Choice?: RpsChoice;
  players: Record<PlayerId, string>;
  myRole?: Role;
  onChoose: (player: PlayerId, choice: RpsChoice) => void;
}

function PlayerColumn({
  player,
  name,
  choice,
  canAct,
  onChoose,
}: {
  player: PlayerId;
  name: string;
  choice?: RpsChoice;
  canAct: boolean;
  onChoose: (player: PlayerId, choice: RpsChoice) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl bg-surface-soft p-4">
      <p className="font-heading text-sm font-semibold text-text-dark">{name}</p>
      {choice ? (
        <p className="animate-pop-check text-sm font-medium text-text-dark-secondary">✓ Ya eligió</p>
      ) : canAct ? (
        <div className="flex gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChoose(player, c.value)}
              title={c.label}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {c.emoji}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-dark-secondary">Esperando…</p>
      )}
    </div>
  );
}

export function RpsPanel({ p1Choice, p2Choice, players, myRole, onChoose }: RpsPanelProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <PlayerColumn
        player="p1"
        name={players.p1}
        choice={p1Choice}
        canAct={myRole === undefined || myRole === 'p1'}
        onChoose={onChoose}
      />
      <PlayerColumn
        player="p2"
        name={players.p2}
        choice={p2Choice}
        canAct={myRole === undefined || myRole === 'p2'}
        onChoose={onChoose}
      />
    </div>
  );
}
