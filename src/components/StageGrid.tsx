import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { PlayerId } from '../state/appReducer';
import type { Stage, StageCategory } from '../data/stages';
import { StageCard } from './StageCard';

interface StageGridProps {
  title: string;
  dropId?: StageCategory;
  stages: Stage[];
  editMode: boolean;
  bannedBy: (id: string) => PlayerId | undefined;
  isPicked: (id: string) => boolean;
  isCandidate: (id: string) => boolean;
  canClickStage: (stage: Stage) => boolean;
  onStageClick: (stage: Stage) => void;
}

export function StageGrid({
  title,
  dropId,
  stages,
  editMode,
  bannedBy,
  isPicked,
  isCandidate,
  canClickStage,
  onStageClick,
}: StageGridProps) {
  // El contenedor solo actúa como zona de drop cuando está vacío — con escenarios
  // adentro, cada card ya es su propio destino de drop (vía useSortable) y dejar
  // el contenedor también droppable genera ambigüedad en la detección de colisión.
  const isEmpty = stages.length === 0;
  const { setNodeRef, isOver } = useDroppable({ id: dropId ?? 'flat', disabled: !editMode || !dropId || !isEmpty });

  return (
    <section
      ref={isEmpty ? setNodeRef : undefined}
      className={[
        'rounded-3xl bg-surface-soft p-4 transition-colors duration-200 sm:p-5',
        editMode && isEmpty && isOver ? 'bg-gold/15 ring-2 ring-gold' : '',
      ].join(' ')}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-orange" />
        <h2 className="font-heading text-base font-semibold text-text-dark sm:text-lg">{title}</h2>
      </div>

      {isEmpty ? (
        <p className="text-sm text-text-dark-secondary">
          {editMode ? 'Arrastra un escenario aquí' : 'Sin escenarios en esta categoría'}
        </p>
      ) : (
        <SortableContext items={stages.map((s) => s.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stages.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                bannedBy={bannedBy(stage.id)}
                picked={isPicked(stage.id)}
                candidate={isCandidate(stage.id)}
                clickable={canClickStage(stage)}
                editMode={editMode}
                onClick={() => onStageClick(stage)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </section>
  );
}
