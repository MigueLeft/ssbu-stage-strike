import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useAppState } from '../hooks/useAppState';
import { useRoom } from '../hooks/useRoom';
import { resolveStages, type PlayerId, type RpsChoice } from '../state/appReducer';
import { getRuleset } from '../data/rulesets';
import { DEFAULT_STAGES, type StageCategory } from '../data/stages';
import { bannedBy, canClickStage, currentStep, instructionFor, isCandidate, isPicked } from '../state/selectors';
import { PlayerNames } from './PlayerNames';
import { TurnBanner } from './TurnBanner';
import { EditModeToggle } from './EditModeToggle';
import { RulesetSelector } from './RulesetSelector';
import { RpsPanel } from './RpsPanel';
import { RoomPanel } from './RoomPanel';
import { StageGrid } from './StageGrid';
import { GameStatusBar } from './GameStatusBar';

export function StageStriker() {
  const { roomId, myRole, resolving, createRoom, leaveRoom } = useRoom();
  const { state, dispatch, isRemote, connected, ready } = useAppState(roomId, myRole);

  if (isRemote && !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="font-heading text-lg font-semibold text-text-dark-secondary">Conectando a la sala…</p>
      </div>
    );
  }

  const ruleset = getRuleset(state.rulesetId);
  const stages = resolveStages(ruleset, state.stageOverrides, state.stageOrder);
  const currentStage = stages.find((s) => s.id === state.flow.currentStageId);
  const isSpectator = isRemote && myRole === 'spectator';

  const hasProgress =
    state.flow.gameHistory.length > 0 ||
    Object.keys(state.flow.bannedThisRound).length > 0 ||
    state.flow.candidateStageIds.length > 0 ||
    !!state.flow.rps.p1Choice ||
    !!state.flow.rps.p2Choice;

  const instruction = instructionFor(state, ruleset);
  const step = currentStep(state, ruleset);
  const canActNow = !isRemote || myRole === state.flow.activePlayer;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const categoryOf = new Map(stages.map((s) => [s.id, s.category] as const));
    const isOverContainer = overId === 'starter' || overId === 'counterpick';
    const targetCategory: StageCategory = isOverContainer
      ? (overId as StageCategory)
      : (categoryOf.get(overId) ?? categoryOf.get(activeId)!);

    const withoutActive = state.stageOrder.filter((id) => id !== activeId);
    const overIndex = isOverContainer ? -1 : withoutActive.indexOf(overId);
    const insertIndex = overIndex === -1 ? withoutActive.length : overIndex;

    const order = [...withoutActive.slice(0, insertIndex), activeId, ...withoutActive.slice(insertIndex)];
    const categoryChanged = targetCategory !== categoryOf.get(activeId);

    dispatch({
      type: 'REORDER_STAGES',
      order,
      ...(categoryChanged ? { categoryChange: { id: activeId, category: targetCategory } } : {}),
    });
  }

  function handleStageClick(stageId: string) {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage || !step || !canActNow) return;
    if (!canClickStage(state, ruleset, stage)) return;
    if (step.kind === 'ban') dispatch({ type: 'BAN_STAGE', id: stage.id });
    else if (step.kind === 'select_candidates') dispatch({ type: 'SELECT_CANDIDATE', id: stage.id });
    else dispatch({ type: 'PICK_STAGE', id: stage.id });
  }

  function handleRpsChoose(player: PlayerId, choice: RpsChoice) {
    dispatch({ type: 'RPS_CHOOSE', player, choice });
  }

  function handleDeclareWinner(winner: PlayerId) {
    dispatch({ type: 'DECLARE_WINNER', winner });
  }

  function handleRulesetChange(id: string) {
    if (hasProgress) return;
    dispatch({ type: 'SET_RULESET', id });
  }

  function handleResetPool() {
    dispatch({
      type: 'HYDRATE',
      state: { stageOverrides: {}, stageOrder: DEFAULT_STAGES.map((s) => s.id) },
    });
  }

  const phaseKey = [
    state.flow.phase,
    state.flow.stepIndex,
    state.flow.stepProgress,
    state.flow.round,
    state.flow.rps.p1Choice ?? '',
    state.flow.rps.p2Choice ?? '',
  ].join('-');

  const gridProps = {
    editMode: state.editMode && ruleset.editablePool,
    bannedBy: (id: string) => bannedBy(state, id),
    isPicked: (id: string) => isPicked(state, id),
    isCandidate: (id: string) => isCandidate(state, id),
    canClickStage: (stage: (typeof stages)[number]) => canActNow && canClickStage(state, ruleset, stage),
  };

  return (
    <div className="min-h-screen bg-bg pb-28 sm:pb-16">
      <header
        className="px-4 py-5 sm:px-8 sm:py-8"
        style={{ background: 'linear-gradient(150deg, var(--color-panel-from) 0%, var(--color-panel-to) 100%)' }}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-xl font-extrabold text-white sm:text-3xl">Stage Strike</h1>
            <div className="flex flex-wrap items-center gap-2">
              <RoomPanel
                roomId={roomId}
                myRole={myRole}
                resolving={resolving}
                connected={connected}
                onCreateRoom={() => createRoom(state.rulesetId)}
                onLeaveRoom={leaveRoom}
              />
              {!isSpectator &&
                (ruleset.editablePool ? (
                  <EditModeToggle
                    editMode={state.editMode}
                    onToggle={() => dispatch({ type: 'TOGGLE_EDIT_MODE' })}
                    onReset={() => dispatch({ type: 'RESET' })}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'RESET' })}
                    className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
                  >
                    Reiniciar set
                  </button>
                ))}
            </div>
          </div>

          <RulesetSelector rulesetId={state.rulesetId} locked={hasProgress || isSpectator} onChange={handleRulesetChange} />

          <PlayerNames
            players={state.players}
            readOnly={isSpectator}
            onChange={(player, name) => dispatch({ type: 'SET_PLAYER_NAME', player, name })}
          />

          {!state.editMode && <TurnBanner instruction={instruction} activePlayer={state.flow.activePlayer} phaseKey={phaseKey} />}
          {state.editMode && (
            <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90">
              Modo edición: arrastra los escenarios entre Starters y Counterpicks.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pt-6 sm:px-8">
        {state.flow.phase === 'rps' && (
          <RpsPanel
            p1Choice={state.flow.rps.p1Choice}
            p2Choice={state.flow.rps.p2Choice}
            players={state.players}
            myRole={isRemote ? myRole : undefined}
            onChoose={handleRpsChoose}
          />
        )}

        {state.flow.phase === 'in_game' && (
          <GameStatusBar
            round={state.flow.round}
            currentStage={currentStage}
            players={state.players}
            readOnly={isSpectator}
            onDeclareWinner={handleDeclareWinner}
          />
        )}

        {state.flow.phase !== 'rps' && (
          <DndContext id="stage-striker-dnd" collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {ruleset.stagePoolMode === 'starter-counterpick' ? (
              <>
                <StageGrid
                  title="Starters"
                  dropId="starter"
                  stages={stages.filter((s) => s.category === 'starter')}
                  onStageClick={(stage) => handleStageClick(stage.id)}
                  {...gridProps}
                />
                <StageGrid
                  title="Counterpicks"
                  dropId="counterpick"
                  stages={stages.filter((s) => s.category === 'counterpick')}
                  onStageClick={(stage) => handleStageClick(stage.id)}
                  {...gridProps}
                />
              </>
            ) : (
              <StageGrid
                title="Escenarios"
                stages={stages}
                onStageClick={(stage) => handleStageClick(stage.id)}
                {...gridProps}
              />
            )}
          </DndContext>
        )}

        {state.editMode && ruleset.editablePool && (
          <button
            type="button"
            onClick={handleResetPool}
            className="self-start text-xs font-medium text-text-dark-secondary underline underline-offset-2 hover:text-text-dark"
          >
            Restaurar clasificación por defecto
          </button>
        )}
      </main>

      {!state.editMode && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-surface/95 px-4 py-3 backdrop-blur sm:hidden">
          <p className="mb-2 text-center text-xs font-semibold text-text-dark-secondary">{instruction}</p>
          {state.flow.phase === 'in_game' && currentStage && !isSpectator && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDeclareWinner('p1')}
                className="flex-1 rounded-full bg-orange px-3 py-2 text-sm font-semibold text-white"
              >
                {state.players.p1}
              </button>
              <button
                type="button"
                onClick={() => handleDeclareWinner('p2')}
                className="flex-1 rounded-full bg-lilac px-3 py-2 text-sm font-semibold text-white"
              >
                {state.players.p2}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
