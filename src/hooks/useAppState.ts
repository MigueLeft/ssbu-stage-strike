import { useLocalAppState } from './useLocalAppState';
import { useRoomState } from './useRoomState';
import { appReducer, type AppAction } from '../state/appReducer';
import { isActionAllowed, type Role } from '../state/rolePermissions';

export function useAppState(roomId?: string, myRole?: Role) {
  const local = useLocalAppState();
  const room = useRoomState(roomId);
  const isRemote = !!roomId;

  const state = isRemote ? (room.state ?? local.state) : local.state;

  function dispatch(action: AppAction) {
    if (isRemote) {
      if (!room.state || !myRole) return;
      if (!isActionAllowed(action, room.state, myRole)) return;
      room.push(appReducer(room.state, action));
    } else {
      local.dispatch(action);
    }
  }

  return {
    state,
    dispatch,
    isRemote,
    connected: isRemote ? room.connected : true,
    ready: isRemote ? room.state !== null : local.ready,
  };
}
