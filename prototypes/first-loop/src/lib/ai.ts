import { getAction } from './mock';
import type { AppSettings, DOAction, MemoryRecord } from '../types';

/**
 * AI 统一入口(adapter)。#8 会把真实实现接到 OpenAI 兼容接口;
 * 在 settings.ai 未配置 key 时,一律回落到本文件的 mock 实现。
 * 行为契约见 docs/DO-PROMPT.md:每次只给一个最小行动;整理保留原话语气,不虚构、不升华。
 */

export interface AIClientConfig {
  /** OpenAI 兼容接口地址,如 https://api.example.com/v1 */
  baseURL: string;
  /** 模型名,如 glm-4-flash */
  model: string;
  apiKey: string;
}

/** settings.ai 未配置时视为未接入真实 AI */
export function isAIConfigured(settings: AppSettings): boolean {
  return Boolean(settings.ai?.baseURL && settings.ai?.model && settings.ai?.apiKey);
}

/** 由模糊念头生成一个最小行动(当前 mock:#8 替换内部实现,签名不变) */
export async function generateAction(idea: string, settings: AppSettings): Promise<DOAction> {
  if (isAIConfigured(settings)) {
    return generateActionRemote(idea, settings.ai!);
  }
  return getActionMock(idea);
}

/** 由用户原话整理一条记录草稿(当前 mock:模板拼装;#8 替换内部实现,签名不变) */
export async function refineRecord(record: MemoryRecord, settings: AppSettings): Promise<string> {
  if (isAIConfigured(settings)) {
    return refineRecordRemote(record, settings.ai!);
  }
  return refineRecordMock(record);
}

/* ---------- mock 实现(#8 前的行动生成与整理) ---------- */

function getActionMock(idea: string): DOAction {
  return getAction(idea);
}

function refineRecordMock(record: MemoryRecord): string {
  const time = new Date(record.createdAt);
  const stamp = `${time.getMonth() + 1}月${time.getDate()}日`;
  return `${stamp}，${record.text.trim()}`;
}

/* ---------- 真实实现(#8 任务:替换以下两个函数内部,签名与回落逻辑不变) ---------- */

async function generateActionRemote(_idea: string, _config: AIClientConfig): Promise<DOAction> {
  // TODO(#8): OpenAI 兼容 chat/completions 调用,行为契约见 docs/DO-PROMPT.md
  return getActionMock(_idea);
}

async function refineRecordRemote(_record: MemoryRecord, _config: AIClientConfig): Promise<string> {
  // TODO(#8): OpenAI 兼容 chat/completions 调用,保留用户语气,不虚构经历
  return refineRecordMock(_record);
}
