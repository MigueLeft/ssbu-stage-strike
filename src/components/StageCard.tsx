import type { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Stage } from '../data/stages';
import type { PlayerId } from '../state/appReducer';

const PLAYER_COLOR: Record<PlayerId, string> = {
  p1: 'var(--color-orange)',
  p2: 'var(--color-lilac)',
};

interface StageCardProps {
  stage: Stage;
  bannedBy?: PlayerId;
  picked: boolean;
  candidate?: boolean;
  clickable: boolean;
  editMode: boolean;
  onClick: () => void;
}

export function StageCard({ stage, bannedBy, picked, candidate, clickable, editMode, onClick }: StageCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging, isOver } = useSortable({
    id: stage.id,
    disabled: !editMode,
  });

  // Mientras se arrastra, la transición CSS de `transition-all` compite con el
  // transform que dnd-kit aplica en cada frame — eso es lo que hace sentir el
  // drag lento/pesado. Se desactiva por completo mientras `isDragging` es true.
  const style: CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    zIndex: isDragging ? 20 : undefined,
    transition: isDragging ? 'none' : undefined,
    touchAction: editMode ? 'none' : undefined,
  };

  const dimmed = !editMode && !clickable && !bannedBy && !picked && !candidate;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      type="button"
      onClick={editMode ? undefined : onClick}
      disabled={dimmed}
      className={[
        'group relative aspect-video w-full select-none overflow-hidden rounded-2xl bg-surface text-left shadow-sm ring-0 transition-all duration-200',
        editMode ? 'cursor-grab active:cursor-grabbing' : clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'cursor-default',
        picked ? 'scale-[1.06] shadow-lg ring-4 ring-gold' : '',
        candidate ? 'ring-4 ring-dashed ring-lilac' : '',
        editMode && isOver && !isDragging ? 'ring-4 ring-dashed ring-orange' : '',
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
    >
      <img
        src={stage.image.src}
        alt={stage.name}
        className={[
          'h-full w-full object-cover transition-all duration-300',
          bannedBy ? 'scale-105 grayscale' : '',
          dimmed ? 'opacity-40 grayscale-[0.6]' : '',
        ].join(' ')}
        draggable={false}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent px-3 py-2">
        <span className="font-heading text-xs font-semibold text-white sm:text-sm">{stage.name}</span>
      </div>

      {bannedBy && (
        <div className="animate-strike-in pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
          <svg viewBox="0 0 100 100" className="h-2/3 w-2/3 drop-shadow-lg">
            <line x1="15" y1="15" x2="85" y2="85" stroke={PLAYER_COLOR[bannedBy]} strokeWidth="12" strokeLinecap="round" />
            <line x1="85" y1="15" x2="15" y2="85" stroke={PLAYER_COLOR[bannedBy]} strokeWidth="12" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {picked && (
        <div className="animate-pop-check pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-md sm:h-8 sm:w-8">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white sm:h-5 sm:w-5" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {candidate && (
        <div className="animate-pop-check pointer-events-none absolute left-2 top-2 rounded-full bg-lilac px-2 py-0.5 text-[10px] font-semibold text-white shadow-md sm:text-xs">
          Candidato
        </div>
      )}
    </button>
  );
}
