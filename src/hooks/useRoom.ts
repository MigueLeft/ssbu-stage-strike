import { useCallback, useEffect, useState } from 'react';
import { getDatabase, ref, runTransaction, set } from 'firebase/database';
import { firebaseApp } from '../lib/firebase';
import { generateRoomId } from '../lib/roomId';
import { initialAppState } from '../state/appReducer';
import type { Role } from '../state/rolePermissions';

interface Claims {
  p1?: boolean;
  p2?: boolean;
}

function roleStorageKey(roomId: string): string {
  return `ssbu-stage-strike-role-${roomId}`;
}

async function claimRole(roomId: string): Promise<Role> {
  const db = getDatabase(firebaseApp);
  const claimsRef = ref(db, `rooms/${roomId}/claims`);

  const p1Attempt = await runTransaction(claimsRef, (claims: Claims | null) => {
    if (claims?.p1) return undefined;
    return { ...(claims ?? {}), p1: true };
  });
  if (p1Attempt.committed) return 'p1';

  const p2Attempt = await runTransaction(claimsRef, (claims: Claims | null) => {
    if (claims?.p2) return undefined;
    return { ...(claims ?? {}), p2: true };
  });
  if (p2Attempt.committed) return 'p2';

  return 'spectator';
}

export function useRoom() {
  const [roomId, setRoomIdState] = useState<string | undefined>(undefined);
  const [myRole, setMyRole] = useState<Role | undefined>(undefined);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('room');
    if (id) setRoomIdState(id);
  }, []);

  useEffect(() => {
    if (!roomId) {
      setMyRole(undefined);
      return;
    }

    const stored = window.sessionStorage.getItem(roleStorageKey(roomId));
    if (stored === 'p1' || stored === 'p2' || stored === 'spectator') {
      setMyRole(stored);
      return;
    }

    let cancelled = false;
    setResolving(true);
    claimRole(roomId).then((role) => {
      if (cancelled) return;
      window.sessionStorage.setItem(roleStorageKey(roomId), role);
      setMyRole(role);
      setResolving(false);
    });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const createRoom = useCallback(async (rulesetId: string) => {
    const id = generateRoomId();
    const db = getDatabase(firebaseApp);
    await set(ref(db, `rooms/${id}/state`), initialAppState(rulesetId));
    await set(ref(db, `rooms/${id}/claims`), { p1: true });
    window.sessionStorage.setItem(roleStorageKey(id), 'p1');

    const url = new URL(window.location.href);
    url.searchParams.set('room', id);
    window.history.pushState({}, '', url);

    setRoomIdState(id);
    setMyRole('p1');
  }, []);

  const leaveRoom = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url);
    setRoomIdState(undefined);
    setMyRole(undefined);
  }, []);

  return { roomId, myRole, resolving, createRoom, leaveRoom };
}
