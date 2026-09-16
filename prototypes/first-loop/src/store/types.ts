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

export type Screen = 'home' | 'input' | 'action' | 'record' | 'appearance';

export interface UIState {
  tab: Tab;
  screen: Screen;
  /** 没有来源控件可依附的页面靠它决定从哪一侧进来:前进从右、后退从左 */
  navDirection: 'forward' | 'back';
  idea: string;
  /** 正在行动的 DO(id);从「上一条 DO」进入行动页时指向既有 DO,新输入为 null */
  activeDOId: string | null;
  historyOpen: boolean;
  /** 正在编辑的记录(id);从回忆页进入编辑态时指向该记录,新建为 null */
  activeRecordId: string | null;
  /** AI 对话规划(#15)产出的行动;行动页优先采用,采用后由行动页清空 */
  plannedAction: DOAction | null;
}

export type StoreState = AppState & UIState;

export type AppAction =
  /** 启动时从 IndexedDB 读入数据,与内存中已有内容合并(按 createdAt 倒序) */
  | { type: 'hydrate'; dos: DO[]; records: MemoryRecord[] }
  /** 创建 DO:id/createdAt 缺省由 store 生成;status/parkedAt/intent 由行动页三选决定 */
  | { type: 'addDO'; id?: string; thought: string; action: DOAction; status: DOStatus; parkedAt?: number; intent?: DOIntent | null }
  /** 局部更新某个 DO(状态流转、意向、行动内容等) */
  | { type: 'updateDO'; id: string; patch: Partial<Omit<DO, 'id'>> }
  /** 创建记录:id/createdAt 由 store 生成;带 linkedDOId 时该 DO 自动变「已记录」 */
  | { type: 'addRecord'; text: string; images?: RecordImage[]; refined?: string; linkedDOId?: string }
  /** 局部更新某条记录(如 #4 的整理版编辑);linkedDOId 变化时联动新旧关联 DO 的状态,显式 null = 移除关联(#13) */
  | { type: 'updateRecord'; id: string; patch: Partial<Omit<MemoryRecord, 'id' | 'linkedDOId'>> & { linkedDOId?: string | null } }
  /** 进入/退出记录编辑态(#13) */
  | { type: 'setActiveRecordId'; id: string | null }
  /** 存入/清除 AI 对话规划产出的行动(#15) */
  | { type: 'setPlannedAction'; action: DOAction | null }
  /** 合并更新设置(theme/background/ai) */
  | { type: 'setSettings'; settings: Partial<AppSettings> }
  /** 数据备份恢复(#12):用备份文件内容整体替换 dos/records(overwrite 语义,调用方先经用户确认) */
  | { type: 'importData'; dos: DO[]; records: MemoryRecord[] }
  | { type: 'setTab'; tab: Tab }
  | { type: 'goHome' }
  | { type: 'setScreen'; screen: Screen; direction?: 'forward' | 'back' }
  | { type: 'setIdea'; idea: string }
  | { type: 'setActiveDO'; id: string | null }
  | { type: 'toggleHistory' };
