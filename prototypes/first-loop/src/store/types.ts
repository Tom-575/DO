export type {
  DOStatus,
  DOIntent,
  DOAction,
  DO,
  MemoryRecord,
  RecordImage,
  AppSettings,
  AppState,
} from '../types';

import type {
  AppSettings,
  AppState,
  DO,
  DOAction,
  DOIntent,
  DOStatus,
  MemoryRecord,
  RecordImage,
} from '../types';

export type Tab = 'today' | 'memories';

export type Screen = 'home' | 'input' | 'action' | 'record';

export interface UIState {
  tab: Tab;
  screen: Screen;
  idea: string;
  /** 正在行动的 DO(id);从「上一条 DO」进入行动页时指向既有 DO,新输入为 null */
  activeDOId: string | null;
  historyOpen: boolean;
  appearanceOpen: boolean;
}

export type StoreState = AppState & UIState;

export type AppAction =
  /** 启动时从 IndexedDB 读入数据,与内存中已有内容合并(按 createdAt 倒序) */
  | { type: 'hydrate'; dos: DO[]; records: MemoryRecord[] }
  /** 创建 DO:id/createdAt 由 store 生成,调用方也可预生成 id 传入(行动页先记意向再开始时指向同一条);现在开始→status 待记录;先放着→status 待定 + parkedAt */
  | { type: 'addDO'; id?: string; thought: string; action: DOAction; status: DOStatus; parkedAt?: number; intent?: DOIntent | null }
  /** 局部更新某个 DO(状态流转、意向、行动内容等) */
  | { type: 'updateDO'; id: string; patch: Partial<Omit<DO, 'id'>> }
  /** 创建记录:id/createdAt 由 store 生成;带 linkedDOId 时该 DO 自动变「已记录」 */
  | { type: 'addRecord'; text: string; images?: RecordImage[]; refined?: string; linkedDOId?: string }
  /** 局部更新某条记录(如 #4 的整理版编辑) */
  | { type: 'updateRecord'; id: string; patch: Partial<Omit<MemoryRecord, 'id'>> }
  /** 合并更新设置(theme/background/ai) */
  | { type: 'setSettings'; settings: Partial<AppSettings> }
  /** 数据备份恢复(#12):用备份文件内容整体替换 dos/records(overwrite 语义,调用方先经用户确认) */
  | { type: 'importData'; dos: DO[]; records: MemoryRecord[] }
  | { type: 'setTab'; tab: Tab }
  | { type: 'goHome' }
  | { type: 'setScreen'; screen: Screen }
  | { type: 'setIdea'; idea: string }
  | { type: 'setActiveDO'; id: string | null }
  | { type: 'toggleHistory' }
  | { type: 'setAppearanceOpen'; open: boolean };
