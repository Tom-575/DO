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

export function createId(): string {
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
  navDirection: 'forward',
  idea: '',
  activeDOId: null,
  historyOpen: false,
  activeRecordId: null,
  plannedAction: null,
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
        id: action.id ?? createId(),
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
        createdAt: action.createdAt ?? Date.now(),
        ...(action.refined === undefined ? {} : { refined: action.refined }),
        ...(action.outcome === undefined ? {} : { outcome: action.outcome }),
        ...(action.linkedDOId === undefined ? {} : { linkedDOId: action.linkedDOId }),
      };
      const dos = action.linkedDOId
        ? state.dos.map((item) => (item.id === action.linkedDOId ? { ...item, status: '已记录' as const } : item))
        : state.dos;
      return { ...state, dos, records: [record, ...state.records] };
    }
    case 'updateRecord': {
      const current = state.records.find((item) => item.id === action.id);
      if (!current) return state;
      const records = state.records.map((item) => {
        if (item.id !== action.id) return item;
        // patch.linkedDOId 为 null 时该键先以 null 进入,下一行立即删键,断言成立
        const next = { ...item, ...action.patch } as MemoryRecord;
        if (action.patch.linkedDOId === null) delete (next as { linkedDOId?: string }).linkedDOId;
        return next;
      });
      // 编辑态改关联(#13):原关联因本条记录而「已记录」,移出时回退「待记录」;
      // 新关联随即转「已记录」。仅当 patch 明确携带 linkedDOId 才视为改关联。
      if (action.patch.linkedDOId !== undefined && action.patch.linkedDOId !== current.linkedDOId) {
        const before = current.linkedDOId;
        let dos = state.dos;
        if (before) dos = dos.map((item) => (item.id === before && item.status === '已记录' ? { ...item, status: '待记录' as const } : item));
        if (action.patch.linkedDOId) dos = dos.map((item) => (item.id === action.patch.linkedDOId ? { ...item, status: '已记录' as const } : item));
        return { ...state, records, dos };
      }
      return { ...state, records };
    }
    case 'setActiveRecordId':
      return { ...state, activeRecordId: action.id };
    case 'setPlannedAction':
      return { ...state, plannedAction: action.action };
    case 'setSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'importData':
      // 备份恢复(#12):整体替换,不与现有数据合并;排序维持「按 createdAt 倒序」的存放约定,
      // 持久化由下方 dos/records 的写回 effect 自动完成。
      return {
        ...state,
        dos: [...action.dos].sort((a, b) => b.createdAt - a.createdAt),
        records: [...action.records].sort((a, b) => b.createdAt - a.createdAt),
      };
    case 'setTab':
      return { ...state, tab: action.tab };
    case 'goHome':
      // 只回首页、不动 tab:首页常驻在 push 屏底下,掰回「今天」会让收回动画露出的下一屏跳页
      return { ...state, screen: 'home' };
    case 'setScreen':
      return { ...state, screen: action.screen, navDirection: action.direction ?? 'forward' };
    case 'setIdea':
      return { ...state, idea: action.idea };
    case 'setActiveDO':
      return { ...state, activeDOId: action.id };
    case 'toggleHistory':
      return { ...state, historyOpen: !state.historyOpen };
    default:
      return state;
  }
}

interface Store {
  state: StoreState;
  dispatch: Dispatch<AppAction>;
}

/* ---------- 首页推荐与 24h 回收(#5) ---------- */

/** 回收只是展示层口径,不改动状态、不写库:待定 DO 停放超过 24 小时即不再占据首页主/备选位 */
export const PENDING_RECYCLE_MS = 24 * 60 * 60 * 1000;

/** 待定 DO 是否已过 24h 回收线(锚点是 parkedAt,缺失时按 createdAt 计) */
export function isRecycledPending(item: DO, now: number): boolean {
  if (item.status !== '待定') return false;
  return now - (item.parkedAt ?? item.createdAt) >= PENDING_RECYCLE_MS;
}

export interface HomeQueue {
  /** 主推荐:最新的活跃 DO(待定/待记录) */
  main: DO | undefined;
  /** 备选:次新的活跃 DO */
  alternate: DO | undefined;
  /** 收起区展开后再显示的其余候选,最多 3 条;更早的念头留在 store,不并列展示 */
  extra: DO[];
  /** 超过 24h 的待定 DO,排在展开区末尾;已记录的 DO 不在此列(痕迹在痕迹页) */
  recycled: DO[];
}

export function selectHomeQueue(dos: DO[], now: number): HomeQueue {
  const byRecency = [...dos].sort((a, b) => b.createdAt - a.createdAt);
  const active: DO[] = [];
  const recycled: DO[] = [];
  for (const item of byRecency) {
    if (item.status === '已记录') continue;
    (isRecycledPending(item, now) ? recycled : active).push(item);
  }
  return { main: active[0], alternate: active[1], extra: active.slice(2, 5), recycled };
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
