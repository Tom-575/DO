export type {
  DOStatus,
  DOIntent,
  DOAction,
  DO,
  MemoryRecord,
  AppSettings,
  AppState,
} from '../types';

import type { AppSettings, AppState } from '../types';

export type Tab = 'today' | 'memories';

export type Screen = 'home' | 'input' | 'action';

export interface UIState {
  tab: Tab;
  screen: Screen;
  idea: string;
  lastIdea: string;
  historyOpen: boolean;
  appearanceOpen: boolean;
}

export type StoreState = AppState & UIState;

export type AppAction =
  | { type: 'setTab'; tab: Tab }
  | { type: 'goHome' }
  | { type: 'setScreen'; screen: Screen }
  | { type: 'setIdea'; idea: string }
  | { type: 'setLastIdea'; idea: string }
  | { type: 'toggleHistory' }
  | { type: 'setAppearanceOpen'; open: boolean }
  | { type: 'setTheme'; theme: AppSettings['theme'] }
  | { type: 'setBackground'; background: string };
