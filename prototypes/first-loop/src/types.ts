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

/**
 * 记录的结果标签(V2)。四个选项都描述**事实**,不是评价:
 * 「发现不太适合我」与「做完了」同等成立,不出现完成率/打卡式表述。
 * 可选字段——旧记录没有它,不展示结果后缀。
 */
export type RecordOutcome = '做完了' | '做了一部分' | '中途停下来了' | '发现不太适合我';

export interface MemoryRecord {
  id: string;
  text: string;
  refined?: string;
  images: RecordImage[];
  outcome?: RecordOutcome;
  linkedDOId?: string;
  createdAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  background: string;
  /** 出发页(冷启动引导)是否已经看过;缺省 = 没看过 */
  onboarded?: boolean;
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
