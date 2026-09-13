export type DOStatus = '待定' | '待记录' | '已记录';

export type DOIntent = '愿意去做' | '不想做了' | '暂不决定';

export interface DOAction {
  title: string;
  time: string;
  stop: string;
}

export interface DO {
  id: string;
  thought: string;
  action: DOAction;
  status: DOStatus;
  intent: DOIntent | null;
  createdAt: number;
  parkedAt?: number;
}

/** 图片既可以是地址/URL(字符串),也可以是存进 IndexedDB 的原始 Blob */
export type RecordImage = string | Blob;

export interface MemoryRecord {
  id: string;
  text: string;
  refined?: string;
  images: RecordImage[];
  linkedDOId?: string;
  createdAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  background: string;
  /** AI 客户端配置;缺省或字段不完整 = 未接入真实 AI,走 mock */
  ai?: import('./lib/ai').AIClientConfig;
}

export interface AppState {
  dos: DO[];
  records: MemoryRecord[];
  settings: AppSettings;
}

/** AI 对话规划(#15)的一轮对话;assistant 文本取模型原样输出,不二次包装 */
export interface PlanTurn {
  role: 'user' | 'assistant';
  text: string;
}

/** 对话规划的单步结果:question 附可选快捷回答;action 即最终行动,对话到此结束 */
export type PlanReply =
  | { kind: 'question'; text: string; options?: string[] }
  | { kind: 'action'; action: DOAction };
