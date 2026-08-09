import { useEffect, useState } from 'react';
import { getDatabase, onValue, ref, set } from 'firebase/database';
import { firebaseApp } from '../lib/firebase';
import { normalizeAppState, type AppState } from '../state/appReducer';

export function useRoomState(roomId: string | undefined) {
  const [state, setState] = useState<AppState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setState(null);
    setConnected(false);
    if (!roomId) return;

    const db = getDatabase(firebaseApp);
    const stateRef = ref(db, `rooms/${roomId}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      setState(normalizeAppState(snapshot.val() as Partial<AppState> | null));
      setConnected(true);
    });

    return () => unsubscribe();
  }, [roomId]);

  function push(next: AppState) {
    if (!roomId) return;
    const db = getDatabase(firebaseApp);
    void set(ref(db, `rooms/${roomId}/state`), next);
  }

  return { state, connected, push };
}
