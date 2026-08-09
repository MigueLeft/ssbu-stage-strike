import type { AppState, PlayerId } from './appReducer';
import type { FlowStep, RulesetDef } from '../data/rulesets';
import type { Stage } from '../data/stages';

function getActiveSteps(state: AppState, ruleset: RulesetDef): FlowStep[] {
  return state.flow.isFirstGame ? ruleset.game1Steps : ruleset.repeatSteps;
}

export function currentStep(state: AppState, ruleset: RulesetDef): FlowStep | undefined {
  if (state.flow.phase !== 'strike') return undefined;
  return getActiveSteps(state, ruleset)[state.flow.stepIndex];
}

export function bannedBy(state: AppState, id: string): PlayerId | undefined {
  return state.flow.bannedThisRound[id];
}

export function isCandidate(state: AppState, id: string): boolean {
  return state.flow.candidateStageIds.includes(id);
}

export function isPicked(state: AppState, id: string): boolean {
  return state.flow.phase === 'in_game' && state.flow.currentStageId === id;
}

export function canClickStage(state: AppState, ruleset: RulesetDef, stage: Stage): boolean {
  const step = currentStep(state, ruleset);
  if (!step) return false;
  if (bannedBy(state, stage.id)) return false;
  if (step.pool === 'starter' && stage.category !== 'starter') return false;
  if (step.pool === 'candidates') return isCandidate(state, stage.id);
  if (step.kind === 'select_candidates' && isCandidate(state, stage.id)) return false;
  return true;
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function instructionFor(state: AppState, ruleset: RulesetDef): string {
  const { flow, players } = state;
  const name = players[flow.activePlayer];

  if (flow.phase === 'rps') {
    if (!flow.rps.p1Choice && !flow.rps.p2Choice) return 'Piedra, papel o tijera para decidir quién empieza';
    if (!flow.rps.p1Choice) return `Esperando a ${players.p1}…`;
    if (!flow.rps.p2Choice) return `Esperando a ${players.p2}…`;
    return 'Resolviendo el sorteo…';
  }

  if (flow.phase === 'in_game') return '¿Quién ganó la partida?';

  const step = currentStep(state, ruleset);
  if (!step) return '';

  switch (step.kind) {
    case 'ban': {
      const remaining = step.count - flow.stepProgress;
      const noun = pluralize(remaining, 'escenario', 'escenarios');
      const suffix = step.pool === 'starter' ? ` ${pluralize(remaining, 'starter', 'starters')}` : '';
      return `${name} banea ${remaining} ${noun}${suffix}`;
    }
    case 'select_candidates': {
      const remaining = step.count - flow.stepProgress;
      return `${name} elige ${remaining} ${pluralize(remaining, 'candidato', 'candidatos')} para la siguiente partida`;
    }
    case 'pick':
      return `${name} elige el escenario para jugar`;
  }
}
