import type { AppAction, AppState } from './appReducer';

export type Role = 'p1' | 'p2' | 'spectator';

const TURN_ACTIONS = new Set(['BAN_STAGE', 'SELECT_CANDIDATE', 'PICK_STAGE']);
const SHARED_ACTIONS = new Set(['REORDER_STAGES', 'TOGGLE_EDIT_MODE', 'SET_RULESET', 'SET_PLAYER_NAME', 'RESET', 'HYDRATE']);

export function isActionAllowed(action: AppAction, state: AppState, role: Role): boolean {
  if (role === 'spectator') return false;

  if (action.type === 'DECLARE_WINNER') return role === 'p1' || role === 'p2';
  if (action.type === 'RPS_CHOOSE') return action.player === role;
  if (TURN_ACTIONS.has(action.type)) return state.flow.activePlayer === role;
  if (SHARED_ACTIONS.has(action.type)) return role === 'p1' || role === 'p2';

  return false;
}
