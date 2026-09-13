import { createContext, useContext, useEffect, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import type { AppAction, StoreState } from './types';
import type { DO, MemoryRecord } from '../types';
import {
  initStorage,
  loadDos,
  loadRecords,
  loadSettings,
  saveDos,
  saveRecords,
  saveSettings,
} from '../lib/storage';

/**
 * 数据流约定:
 * - dos / records 按 createdAt 倒序存放(最新在前),hydrate 合并后排序,新增插到头部;
 * - 启动即用空数据 + 同步读到的 settings 渲染(无 loading 页),IndexedDB 数据毫秒级到达后 hydrate;
 * - hydrate 完成后,dos/records 每次变化写回 IndexedDB,settings 变化写回 localStorage,
 *   组件一律通过 dispatch 间接持久化,不直接碰存储。
 */

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function mergeByRecency<T extends { id: string; createdAt: number }>(stored: T[], local: T[]): T[] {
  const seen = new Set(stored.map((item) => item.id));
  return [...stored, ...local.filter((item) => !seen.has(item.id))].sort((a, b) => b.createdAt - a.createdAt);
}

const initialState: StoreState = {
  dos: [],
  records: [],
  settings: loadSettings(),
  tab: 'today',
  screen: 'home',
  idea: '',
  activeDOId: null,
  historyOpen: false,
  appearanceOpen: false,
};

function reducer(state: StoreState, action: AppAction): StoreState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        dos: mergeByRecency(action.dos, state.dos),
        records: mergeByRecency(action.records, state.records),
      };
    case 'addDO': {
      const item: DO = {
        id: createId(),
        thought: action.thought,
        action: action.action,
        status: action.status,
        intent: action.intent ?? null,
        createdAt: Date.now(),
        ...(action.parkedAt === undefined ? {} : { parkedAt: action.parkedAt }),
      };
      return { ...state, dos: [item, ...state.dos] };
    }
    case 'updateDO':
      return { ...state, dos: state.dos.map((item) => (item.id === action.id ? { ...item, ...action.patch } : item)) };
    case 'addRecord': {
      const record: MemoryRecord = {
        id: createId(),
        text: action.text,
        images: action.images ?? [],
        createdAt: Date.now(),
        ...(action.refined === undefined ? {} : { refined: action.refined }),
        ...(action.linkedDOId === undefined ? {} : { linkedDOId: action.linkedDOId }),
      };
      const dos = action.linkedDOId
        ? state.dos.map((item) => (item.id === action.linkedDOId ? { ...item, status: '已记录' as const } : item))
        : state.dos;
      return { ...state, dos, records: [record, ...state.records] };
    }
    case 'updateRecord':
      return {
        ...state,
        records: state.records.map((item) => (item.id === action.id ? { ...item, ...action.patch } : item)),
      };
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'goHome':
      return { ...state, screen: 'home', tab: 'today' };
    case 'setScreen':
      return { ...state, screen: action.screen };
    case 'setIdea':
      return { ...state, idea: action.idea };
    case 'setActiveDO':
      return { ...state, activeDOId: action.id };
    case 'toggleHistory':
      return { ...state, historyOpen: !state.historyOpen };
    case 'setAppearanceOpen':
      return { ...state, appearanceOpen: action.open };
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initStorage();
    let cancelled = false;
    void Promise.all([loadDos(), loadRecords()]).then(([dos, records]) => {
      if (cancelled) return;
      dispatch({ type: 'hydrate', dos, records });
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveDos(state.dos);
  }, [hydrated, state.dos]);

  useEffect(() => {
    if (hydrated) saveRecords(state.records);
  }, [hydrated, state.records]);

  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

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
