import type { PlayerId } from '../state/appReducer';

const PLAYER_DOT: Record<PlayerId, string> = {
  p1: 'bg-orange',
  p2: 'bg-lilac',
};

interface TurnBannerProps {
  instruction: string;
  activePlayer: PlayerId;
  phaseKey: string;
}

export function TurnBanner({ instruction, activePlayer, phaseKey }: TurnBannerProps) {
  return (
    <div
      key={phaseKey}
      className="animate-banner-fade flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm sm:px-5"
    >
      <span className={['h-2.5 w-2.5 flex-shrink-0 rounded-full', PLAYER_DOT[activePlayer]].join(' ')} />
      <p className="font-heading text-sm font-semibold text-white sm:text-base">{instruction}</p>
    </div>
  );
}
