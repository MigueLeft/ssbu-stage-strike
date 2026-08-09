import { useEffect, useReducer, useState } from 'react';
import { appReducer, initialAppState, type PlayerId } from '../state/appReducer';
import { RULESETS } from '../data/rulesets';
import type { StageCategory } from '../data/stages';

const STORAGE_KEY = 'ssbu-stage-strike-v2';

interface PersistedPrefs {
  rulesetId?: string;
  stageOverrides?: Record<string, StageCategory>;
  stageOrder?: string[];
  players?: Record<PlayerId, string>;
}

function loadPrefs(): PersistedPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PersistedPrefs;
  } catch {
    return {};
  }
}

export function useLocalAppState() {
  // El estado inicial coincide siempre con el render del servidor; las preferencias
  // guardadas (ruleset, pool editado, orden, nombres) se aplican recién tras el montaje.
  const [state, dispatch] = useReducer(appReducer, initialAppState(RULESETS[0].id));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefs = loadPrefs();
    const hydratePayload: PersistedPrefs = {};
    if (prefs.rulesetId) hydratePayload.rulesetId = prefs.rulesetId;
    if (prefs.stageOverrides) hydratePayload.stageOverrides = prefs.stageOverrides;
    if (prefs.stageOrder) hydratePayload.stageOrder = prefs.stageOrder;
    if (prefs.players) hydratePayload.players = prefs.players;
    if (Object.keys(hydratePayload).length > 0) {
      dispatch({ type: 'HYDRATE', state: hydratePayload });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const prefs: PersistedPrefs = {
      rulesetId: state.rulesetId,
      stageOverrides: state.stageOverrides,
      stageOrder: state.stageOrder,
      players: state.players,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [ready, state.rulesetId, state.stageOverrides, state.stageOrder, state.players]);

  return { state, dispatch, ready };
}
