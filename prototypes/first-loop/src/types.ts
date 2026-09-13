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
}

export interface AppState {
  dos: DO[];
  records: MemoryRecord[];
  settings: AppSettings;
}
