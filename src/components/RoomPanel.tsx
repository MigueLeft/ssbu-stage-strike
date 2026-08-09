import { useState } from 'react';
import type { Role } from '../state/rolePermissions';

const ROLE_LABEL: Record<Role, string> = {
  p1: 'Eres el Jugador 1',
  p2: 'Eres el Jugador 2',
  spectator: 'Estás viendo como espectador',
};

interface RoomPanelProps {
  roomId?: string;
  myRole?: Role;
  resolving: boolean;
  connected: boolean;
  onCreateRoom: () => void;
  onLeaveRoom: () => void;
}

export function RoomPanel({ roomId, myRole, resolving, connected, onCreateRoom, onLeaveRoom }: RoomPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!roomId) {
    return (
      <button
        type="button"
        onClick={onCreateRoom}
        className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-text-dark transition-colors duration-200 hover:bg-gold-dark"
      >
        Jugar en línea
      </button>
    );
  }

  async function handleShare() {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Stage Strike', url: shareUrl });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white">
      <span className={['h-2 w-2 rounded-full', connected ? 'bg-emerald-400' : 'bg-white/40'].join(' ')} />
      <span>{resolving ? 'Conectando…' : myRole ? ROLE_LABEL[myRole] : ''}</span>
      <button
        type="button"
        onClick={handleShare}
        className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold transition-colors duration-200 hover:bg-white/30"
      >
        {copied ? '¡Copiado!' : 'Compartir link'}
      </button>
      <button type="button" onClick={onLeaveRoom} className="text-xs text-white/70 underline underline-offset-2 hover:text-white">
        Salir
      </button>
    </div>
  );
}
