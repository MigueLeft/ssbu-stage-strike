interface EditModeToggleProps {
  editMode: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function EditModeToggle({ editMode, onToggle, onReset }: EditModeToggleProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200',
          editMode ? 'bg-gold text-text-dark hover:bg-gold-dark' : 'bg-orange text-white hover:brightness-110',
        ].join(' ')}
      >
        {editMode ? 'Guardar mapas' : 'Editar mapas'}
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
      >
        Reiniciar set
      </button>
    </div>
  );
}
