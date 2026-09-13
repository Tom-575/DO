import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppAction, StoreState } from './types';
import { defaultLastIdea, seedDos, seedRecords } from '../lib/mock';

const initialState: StoreState = {
  dos: seedDos,
  records: seedRecords,
  settings: { theme: 'system', background: '/assets/mountain-walk.jpg' },
  tab: 'today',
  screen: 'home',
  idea: '',
  lastIdea: defaultLastIdea,
  historyOpen: false,
  appearanceOpen: false,
};

function reducer(state: StoreState, action: AppAction): StoreState {
  switch (action.type) {
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'goHome':
      return { ...state, screen: 'home', tab: 'today' };
    case 'setScreen':
      return { ...state, screen: action.screen };
    case 'setIdea':
      return { ...state, idea: action.idea };
    case 'setLastIdea':
      return { ...state, lastIdea: action.idea };
    case 'toggleHistory':
      return { ...state, historyOpen: !state.historyOpen };
    case 'setAppearanceOpen':
      return { ...state, appearanceOpen: action.open };
    case 'setTheme':
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case 'setBackground':
      return { ...state, settings: { ...state.settings, background: action.background } };
    default:
      return state;
  }
}

interface Store {
  state: StoreState;
  dispatch: Dispatch<AppAction>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreProvider is missing');
  return store;
}

export function useAppState(): StoreState {
  return useStore().state;
}

export function useDispatch(): Dispatch<AppAction> {
  return useStore().dispatch;
}
