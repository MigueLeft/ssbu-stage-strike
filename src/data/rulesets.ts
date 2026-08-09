import { DEFAULT_STAGES, type StageCategory } from './stages';

export type ActorRole = 'p1' | 'p2' | 'rps_winner' | 'rps_loser' | 'game_winner' | 'game_loser';
export type PoolScope = 'starter' | 'all' | 'candidates';

export type FlowStep =
  | { kind: 'ban'; by: ActorRole; count: number; pool: PoolScope }
  | { kind: 'select_candidates'; by: ActorRole; count: number; pool: PoolScope }
  | { kind: 'pick'; by: ActorRole; pool: PoolScope };

export interface RulesetDef {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  stagePoolMode: 'flat' | 'starter-counterpick';
  stageIds: string[];
  stageCategoryOverrides?: Record<string, StageCategory>;
  usesRps: boolean;
  editablePool: boolean;
  dsrNote?: string;
  game1Steps: FlowStep[];
  repeatSteps: FlowStep[];
}

const ALL_STAGE_IDS = DEFAULT_STAGES.map((s) => s.id);

export const RULESETS: RulesetDef[] = [
  {
    id: 'custom-1-2-1',
    name: 'Stike 1-2-1',
    shortLabel: '1-2-1',
    // description: 'Formato clásico de striking con starters/counterpicks editables a tu gusto.',
    stagePoolMode: 'starter-counterpick',
    stageIds: ALL_STAGE_IDS,
    usesRps: false,
    editablePool: true,
    game1Steps: [
      { kind: 'ban', by: 'p1', count: 1, pool: 'starter' },
      { kind: 'ban', by: 'p2', count: 2, pool: 'starter' },
      { kind: 'pick', by: 'p1', pool: 'starter' },
    ],
    repeatSteps: [
      { kind: 'ban', by: 'game_winner', count: 3, pool: 'all' },
      { kind: 'pick', by: 'game_loser', pool: 'all' },
    ],
  },
  {
    id: 'unified-european',
    name: 'Unified European Ruleset',
    shortLabel: 'European',
    // description:
    //   'Sin distinción starter/counterpick: los 9 escenarios están disponibles desde el inicio (usamos los 8 que tenemos cargados; Yoshi\'s Story queda fuera por no tener la imagen).',
    stagePoolMode: 'flat',
    stageIds: ALL_STAGE_IDS,
    usesRps: true,
    editablePool: false,
    dsrNote: 'DSR no está en efecto en este ruleset.',
    game1Steps: [
      { kind: 'ban', by: 'rps_winner', count: 3, pool: 'all' },
      { kind: 'select_candidates', by: 'rps_loser', count: 2, pool: 'all' },
      { kind: 'pick', by: 'rps_winner', pool: 'candidates' },
    ],
    repeatSteps: [
      { kind: 'ban', by: 'game_winner', count: 3, pool: 'all' },
      { kind: 'pick', by: 'game_loser', pool: 'all' },
    ],
  },
  {
    id: 'unified-north-american',
    name: 'Unified North American Ruleset',
    shortLabel: 'North American',
    // description: 'Starters y counterpicks fijos según el reglamento unificado de Norteamérica.',
    stagePoolMode: 'starter-counterpick',
    stageIds: ALL_STAGE_IDS,
    stageCategoryOverrides: {
      battlefield: 'starter',
      final_destination: 'starter',
      town_and_city: 'starter',
      small_battlefield: 'starter',
      hollow_bastion: 'starter',
      pokemon_stadium_2: 'counterpick',
      smashville: 'counterpick',
      kalos_league: 'counterpick',
    },
    usesRps: true,
    editablePool: false,
    dsrNote:
      'Modified DSR: por simplicidad, esta versión no bloquea escenarios repetidos automáticamente.',
    game1Steps: [
      { kind: 'ban', by: 'rps_winner', count: 1, pool: 'starter' },
      { kind: 'ban', by: 'rps_loser', count: 2, pool: 'starter' },
      { kind: 'pick', by: 'rps_winner', pool: 'starter' },
    ],
    repeatSteps: [
      { kind: 'ban', by: 'game_winner', count: 2, pool: 'all' },
      { kind: 'pick', by: 'game_loser', pool: 'all' },
    ],
  },
];

export function getRuleset(id: string): RulesetDef {
  return RULESETS.find((r) => r.id === id) ?? RULESETS[0];
}
