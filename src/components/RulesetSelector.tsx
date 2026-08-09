import { RULESETS } from '../data/rulesets';

interface RulesetSelectorProps {
  rulesetId: string;
  locked: boolean;
  onChange: (id: string) => void;
}

export function RulesetSelector({ rulesetId, locked, onChange }: RulesetSelectorProps) {
  const active = RULESETS.find((r) => r.id === rulesetId) ?? RULESETS[0];

  return (
    <div className="flex flex-col gap-1">
      <select
        value={rulesetId}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white outline-none disabled:opacity-50"
      >
        {RULESETS.map((r) => (
          <option key={r.id} value={r.id} className="text-text-dark">
            {r.name}
          </option>
        ))}
      </select>
      {locked && <p className="text-xs text-white/60">Reiniciá el set para cambiar de ruleset.</p>}
      {!locked && active.description && <p className="text-xs text-white/60">{active.description}</p>}
    </div>
  );
}
