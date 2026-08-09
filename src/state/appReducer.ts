import { DEFAULT_STAGES, type Stage, type StageCategory } from '../data/stages';
import { getRuleset, type ActorRole, type FlowStep, type PoolScope, type RulesetDef } from '../data/rulesets';

export type PlayerId = 'p1' | 'p2';
export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface GameRecord {
  round: number;
  stageId: string;
  winner?: PlayerId;
}

export interface FlowState {
  phase: 'rps' | 'strike' | 'in_game';
  isFirstGame: boolean;
  stepIndex: number;
  stepProgress: number;
  activePlayer: PlayerId;
  bannedThisRound: Partial<Record<string, PlayerId>>;
  candidateStageIds: string[];
  currentStageId: string | null;
  gameHistory: GameRecord[];
  round: number;
  roundWinner?: PlayerId;
  rps: { p1Choice?: RpsChoice; p2Choice?: RpsChoice; winner?: PlayerId };
}

export interface AppState {
  rulesetId: string;
  stageOverrides: Record<string, StageCategory>;
  stageOrder: string[];
  players: Record<PlayerId, string>;
  editMode: boolean;
  flow: FlowState;
}

export type AppAction =
  | { type: 'SET_RULESET'; id: string }
  | { type: 'REORDER_STAGES'; order: string[]; categoryChange?: { id: string; category: StageCategory } }
  | { type: 'SET_PLAYER_NAME'; player: PlayerId; name: string }
  | { type: 'TOGGLE_EDIT_MODE' }
  | { type: 'RPS_CHOOSE'; player: PlayerId; choice: RpsChoice }
  | { type: 'BAN_STAGE'; id: string }
  | { type: 'SELECT_CANDIDATE'; id: string }
  | { type: 'PICK_STAGE'; id: string }
  | { type: 'DECLARE_WINNER'; winner: PlayerId }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: Partial<Pick<AppState, 'rulesetId' | 'stageOverrides' | 'stageOrder' | 'players'>> };

function resolveActor(role: ActorRole, flow: FlowState): PlayerId {
  switch (role) {
    case 'p1':
      return 'p1';
    case 'p2':
      return 'p2';
    case 'rps_winner':
      return flow.rps.winner ?? 'p1';
    case 'rps_loser':
      return (flow.rps.winner ?? 'p1') === 'p1' ? 'p2' : 'p1';
    case 'game_winner':
      return flow.roundWinner ?? 'p1';
    case 'game_loser':
      return (flow.roundWinner ?? 'p1') === 'p1' ? 'p2' : 'p1';
  }
}

function advanceStep(flow: FlowState, steps: FlowStep[], stepIndex: number): FlowState {
  const step = steps[stepIndex];
  return {
    ...flow,
    stepIndex,
    stepProgress: 0,
    activePlayer: step ? resolveActor(step.by, flow) : flow.activePlayer,
  };
}

function initialFlow(ruleset: RulesetDef): FlowState {
  const base: FlowState = {
    phase: ruleset.usesRps ? 'rps' : 'strike',
    isFirstGame: true,
    stepIndex: 0,
    stepProgress: 0,
    activePlayer: 'p1',
    bannedThisRound: {},
    candidateStageIds: [],
    currentStageId: null,
    gameHistory: [],
    round: 1,
    rps: {},
  };
  return ruleset.usesRps ? base : advanceStep(base, ruleset.game1Steps, 0);
}

export function initialAppState(rulesetId: string, players?: Record<PlayerId, string>): AppState {
  const ruleset = getRuleset(rulesetId);
  return {
    rulesetId: ruleset.id,
    stageOverrides: {},
    stageOrder: DEFAULT_STAGES.map((s) => s.id),
    players: players ?? { p1: 'Jugador 1', p2: 'Jugador 2' },
    editMode: false,
    flow: initialFlow(ruleset),
  };
}

/**
 * Firebase Realtime Database elimina los objetos y arrays vacíos al guardarlos
 * (no existen como valor "vacío" en su modelo de datos) — por eso, al leer de vuelta,
 * campos como `stageOverrides: {}` o `bannedThisRound: {}` pueden llegar `undefined`.
 * Esta función repone los valores por defecto antes de exponer el estado a la app.
 */
export function normalizeAppState(raw: Partial<AppState> | null | undefined): AppState | null {
  if (!raw) return null;
  const flow = raw.flow ?? ({} as Partial<FlowState>);

  return {
    rulesetId: raw.rulesetId ?? 'custom-1-2-1',
    stageOverrides: raw.stageOverrides ?? {},
    stageOrder: raw.stageOrder ?? DEFAULT_STAGES.map((s) => s.id),
    players: raw.players ?? { p1: 'Jugador 1', p2: 'Jugador 2' },
    editMode: raw.editMode ?? false,
    flow: {
      phase: flow.phase ?? 'strike',
      isFirstGame: flow.isFirstGame ?? true,
      stepIndex: flow.stepIndex ?? 0,
      stepProgress: flow.stepProgress ?? 0,
      activePlayer: flow.activePlayer ?? 'p1',
      bannedThisRound: flow.bannedThisRound ?? {},
      candidateStageIds: flow.candidateStageIds ?? [],
      currentStageId: flow.currentStageId ?? null,
      gameHistory: flow.gameHistory ?? [],
      round: flow.round ?? 1,
      // `roundWinner` es opcional: si no viene, no se debe fijar como `undefined`
      // explícito, porque Firebase rechaza cualquier `set()` que lo contenga.
      ...(flow.roundWinner ? { roundWinner: flow.roundWinner } : {}),
      rps: flow.rps ?? {},
    },
  };
}

function getActiveSteps(state: AppState): FlowStep[] {
  const ruleset = getRuleset(state.rulesetId);
  return state.flow.isFirstGame ? ruleset.game1Steps : ruleset.repeatSteps;
}

function resolveRpsWinner(a: RpsChoice, b: RpsChoice): PlayerId | 'tie' {
  if (a === b) return 'tie';
  const beats: Record<RpsChoice, RpsChoice> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
  return beats[a] === b ? 'p1' : 'p2';
}

export function resolveStages(
  ruleset: RulesetDef,
  stageOverrides: Record<string, StageCategory>,
  stageOrder: string[],
): Stage[] {
  const stages = DEFAULT_STAGES.filter((s) => ruleset.stageIds.includes(s.id)).map((s) => {
    const fixedCategory = ruleset.stageCategoryOverrides?.[s.id];
    if (fixedCategory) return { ...s, category: fixedCategory };
    if (ruleset.editablePool && stageOverrides[s.id]) return { ...s, category: stageOverrides[s.id] };
    return s;
  });

  // El orden personalizado solo aplica al ruleset editable — los rulesets con pool
  // fijo siempre se muestran en su orden natural, sin importar lo que el usuario
  // haya reordenado en el ruleset personalizado.
  if (!ruleset.editablePool) return stages;

  const orderIndex = new Map(stageOrder.map((id, index) => [id, index]));
  return [...stages].sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));
}

export function appReducer(state: AppState, action: AppAction): AppState {
  const ruleset = getRuleset(state.rulesetId);

  switch (action.type) {
    case 'SET_RULESET': {
      const nextRuleset = getRuleset(action.id);
      return { ...state, rulesetId: nextRuleset.id, editMode: false, flow: initialFlow(nextRuleset) };
    }

    case 'REORDER_STAGES': {
      const stageOverrides = action.categoryChange
        ? { ...state.stageOverrides, [action.categoryChange.id]: action.categoryChange.category }
        : state.stageOverrides;
      return { ...state, stageOverrides, stageOrder: action.order };
    }

    case 'SET_PLAYER_NAME':
      return { ...state, players: { ...state.players, [action.player]: action.name } };

    case 'TOGGLE_EDIT_MODE':
      return { ...state, editMode: !state.editMode };

    case 'RPS_CHOOSE': {
      if (state.flow.phase !== 'rps') return state;
      const rpsField = action.player === 'p1' ? 'p1Choice' : 'p2Choice';
      const rps = { ...state.flow.rps, [rpsField]: action.choice };

      if (!rps.p1Choice || !rps.p2Choice) {
        return { ...state, flow: { ...state.flow, rps } };
      }

      const result = resolveRpsWinner(rps.p1Choice, rps.p2Choice);
      if (result === 'tie') {
        return { ...state, flow: { ...state.flow, rps: {} } };
      }

      const flowWithWinner: FlowState = { ...state.flow, rps: { ...rps, winner: result }, phase: 'strike' };
      return { ...state, flow: advanceStep(flowWithWinner, ruleset.game1Steps, 0) };
    }

    case 'BAN_STAGE': {
      const steps = getActiveSteps(state);
      const step = steps[state.flow.stepIndex];
      if (!step || step.kind !== 'ban') return state;
      if (state.flow.bannedThisRound[action.id]) return state;

      const bannedThisRound = { ...state.flow.bannedThisRound, [action.id]: state.flow.activePlayer };
      const stepProgress = state.flow.stepProgress + 1;

      if (stepProgress < step.count) {
        return { ...state, flow: { ...state.flow, bannedThisRound, stepProgress } };
      }
      return { ...state, flow: advanceStep({ ...state.flow, bannedThisRound, stepProgress: 0 }, steps, state.flow.stepIndex + 1) };
    }

    case 'SELECT_CANDIDATE': {
      const steps = getActiveSteps(state);
      const step = steps[state.flow.stepIndex];
      if (!step || step.kind !== 'select_candidates') return state;
      if (state.flow.bannedThisRound[action.id] || state.flow.candidateStageIds.includes(action.id)) return state;

      const candidateStageIds = [...state.flow.candidateStageIds, action.id];
      const stepProgress = state.flow.stepProgress + 1;

      if (stepProgress < step.count) {
        return { ...state, flow: { ...state.flow, candidateStageIds, stepProgress } };
      }
      return { ...state, flow: advanceStep({ ...state.flow, candidateStageIds, stepProgress: 0 }, steps, state.flow.stepIndex + 1) };
    }

    case 'PICK_STAGE': {
      const steps = getActiveSteps(state);
      const step = steps[state.flow.stepIndex];
      if (!step || step.kind !== 'pick') return state;
      if (state.flow.bannedThisRound[action.id]) return state;
      if (step.pool === 'candidates' && !state.flow.candidateStageIds.includes(action.id)) return state;

      const gameHistory = [...state.flow.gameHistory, { round: state.flow.round, stageId: action.id }];
      return {
        ...state,
        flow: {
          ...state.flow,
          currentStageId: action.id,
          gameHistory,
          candidateStageIds: [],
          stepProgress: 0,
          phase: 'in_game',
        },
      };
    }

    case 'DECLARE_WINNER': {
      if (state.flow.phase !== 'in_game') return state;

      const gameHistory = state.flow.gameHistory.map((game, index) =>
        index === state.flow.gameHistory.length - 1 ? { ...game, winner: action.winner } : game,
      );

      const nextFlowBase: FlowState = {
        ...state.flow,
        gameHistory,
        round: state.flow.round + 1,
        bannedThisRound: {},
        candidateStageIds: [],
        stepProgress: 0,
        isFirstGame: false,
        roundWinner: action.winner,
        phase: 'strike',
      };
      return { ...state, flow: advanceStep(nextFlowBase, ruleset.repeatSteps, 0) };
    }

    case 'RESET':
      return { ...state, flow: initialFlow(ruleset) };

    case 'HYDRATE': {
      const merged = { ...state, ...action.state };
      return { ...merged, flow: initialFlow(getRuleset(merged.rulesetId)) };
    }

    default:
      return state;
  }
}

export type { RulesetDef, FlowStep, PoolScope };
