import { get, set } from 'idb-keyval';
import type { AppSettings, DO, MemoryRecord } from '../types';

/**
 * 存储分工:
 * - DO 数组、记录数组(含未来的图片 Blob)→ IndexedDB(idb-keyval)
 * - 设置(theme/background,后续还有 AI 配置)→ localStorage,JSON 序列化
 * - schema 版本号写 do.version,为将来迁移留余地
 *
 * 所有读写失败都静默忽略:这是可丢弃原型,存储不可用时退化为内存态即可。
 */

const DOS_KEY = 'do.dos';
const RECORDS_KEY = 'do.records';
const SETTINGS_KEY = 'do.settings';
const VERSION_KEY = 'do.version';

/** 当前数据契约版本;结构变化时递增并在 hydrate 前做迁移 */
export const SCHEMA_VERSION = 1;

export const defaultSettings: AppSettings = {
  theme: 'system',
  background: '/assets/mountain-walk.jpg',
};

/* ---------- IndexedDB:DO 与记录 ---------- */

export async function loadDos(): Promise<DO[]> {
  try {
    return sanitizeDos(await get<unknown>(DOS_KEY));
  } catch {
    return [];
  }
}

export async function loadRecords(): Promise<MemoryRecord[]> {
  try {
    return sanitizeRecords(await get<unknown>(RECORDS_KEY));
  } catch {
    return [];
  }
}

export function saveDos(dos: DO[]): void {
  void set(DOS_KEY, dos).catch(() => undefined);
}

export function saveRecords(records: MemoryRecord[]): void {
  void set(RECORDS_KEY, records).catch(() => undefined);
}

/* ---------- localStorage:设置 ---------- */

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...defaultSettings };
    const partial = parsed as Partial<AppSettings>;
    const theme =
      partial.theme === 'light' || partial.theme === 'dark' || partial.theme === 'system'
        ? partial.theme
        : defaultSettings.theme;
    const background = typeof partial.background === 'string' ? partial.background : defaultSettings.background;
    return { theme, background };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* 忽略:设置只是外观偏好 */
  }
}

/* ---------- 启动初始化 ---------- */

/** 进程生命周期内调用一次:写版本号,并申请持久化存储(fire-and-forget) */
export function initStorage(): void {
  try {
    if (localStorage.getItem(VERSION_KEY) === null) {
      localStorage.setItem(VERSION_KEY, String(SCHEMA_VERSION));
    }
  } catch {
    /* 忽略 */
  }
  try {
    void navigator.storage?.persist()?.catch(() => undefined);
  } catch {
    /* 忽略:不支持 persist 的环境直接跳过 */
  }
}

/* ---------- 读取时的轻量校验(防止旧数据/脏数据把页面打崩) ---------- */

function sanitizeDos(value: unknown): DO[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DO =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as DO).id === 'string' &&
      typeof (item as DO).thought === 'string' &&
      typeof (item as DO).createdAt === 'number',
  );
}

function sanitizeRecords(value: unknown): MemoryRecord[] {
  if (!Array.isArray(value)) return [];
  const records: MemoryRecord[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const raw = item as Partial<MemoryRecord>;
    if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || typeof raw.createdAt !== 'number') continue;
    records.push({
      ...raw,
      id: raw.id,
      text: raw.text,
      createdAt: raw.createdAt,
      images: Array.isArray(raw.images) ? raw.images : [],
    });
  }
  return records;
}
