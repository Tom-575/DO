import { getAction } from './mock';
import type { AppSettings, DOAction, MemoryRecord } from '../types';

/**
 * AI 统一入口(adapter)。
 * settings.ai 配置完整时走 OpenAI 兼容远程实现(baseURL + /chat/completions 直连,key 存本机);
 * 未配置 key、请求失败或返回不合法时,一律回落本文件的 mock 实现,UI 永不因此崩溃或卡死。
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

/** 由模糊念头生成一个最小行动:已配置走远程,任何失败自动回落 mock */
export async function generateAction(idea: string, settings: AppSettings): Promise<DOAction> {
  if (isAIConfigured(settings)) {
    return generateActionRemote(idea, settings.ai!);
  }
  return getActionMock(idea);
}

/** 由用户原话整理一条记录草稿:已配置走远程,任何失败自动回落 mock */
export async function refineRecord(record: MemoryRecord, settings: AppSettings): Promise<string> {
  if (isAIConfigured(settings)) {
    return refineRecordRemote(record, settings.ai!);
  }
  return refineRecordMock(record);
}

/* ---------- mock 实现(无 key 时的兜底,行为与 #8 前一致) ---------- */

function getActionMock(idea: string): DOAction {
  return getAction(idea);
}

function refineRecordMock(record: MemoryRecord): string {
  const time = new Date(record.createdAt);
  const stamp = `${time.getMonth() + 1}月${time.getDate()}日`;
  return `${stamp}，${record.text.trim()}`;
}

/* ---------- OpenAI 兼容远程实现(#8) ---------- */

const REQUEST_TIMEOUT_MS = 20_000;

/** 行动生成:契约见 docs/DO-PROMPT.md「新想法的回复结构」,收敛为单个最小行动的结构化输出 */
const ACTION_SYSTEM_PROMPT = `你是 DO，帮用户把一个模糊念头变成可以开始的最小行动。

给行动时遵守：
- 每次只给一个行动；不列清单，不生成完整计划。
- 行动要适合用户当下的时间、地点、能力和资源，准备成本低；title 写第一步，具体到现在就能动手。
- 行动要小：通常 5–30 分钟内就能停下来，能更短更好。
- stop 必须是明确的停止或完成条件。
- 开始本身就是成功：不提完成率、连续打卡，不用励志口号施压。
- 用户原话可能很模糊：先推断用户可能想体验什么，直接给一个暂定建议，允许用户之后纠正，不要反问。
- 涉及危险、医疗等高风险活动时，改给一个更安全的替代行动。
- 全部用中文，语气平实直接，文字要短，别让建议本身成为开始的障碍。

只输出一个 JSON 对象，不要代码栅栏、解释或任何额外文字。三个字段都必填：
{"title":"现在具体做的第一步","time":"预计时长，如：大约 10 分钟","stop":"明确的停止条件"}`;

/** 记录整理:契约见 docs/DO-PROMPT.md「行动反馈的回复结构」,只输出记录草稿本身 */
const REFINE_SYSTEM_PROMPT = `你是 DO，用户的行动伙伴。用户回来描述了自己做了什么，你的任务是把它整理成一条可以直接保存的经历记录。

整理时遵守：
- 记录只基于用户这次说的内容，先准确承认实际发生的事实；不虚构、不补充、不脑补任何没发生的细节。
- 保留用户自己的原话、语气、用词习惯、矛盾和感受，能沿用原句就沿用；只做轻度顺句，不要改写成用户写不出来的书面腔。
- 不强行升华，不总结意义，不写成励志文案；做得不顺利、只做了一半、中途停下，都照实记录。
- 不评价完成程度，不用打卡、完成率、坚持这类说法。
- 全部用中文，读起来像用户自己在说话。

只输出整理后的记录文字本身：一段纯文本，不带标题、序号、引号、表情，不要任何解释、前后缀或客套。`;

/** 发送一次 chat/completions 请求,返回首条回复文本;失败抛错(错误信息只含状态码等,绝不含密钥) */
async function chatCompletion(config: AIClientConfig, system: string, user: string): Promise<string> {
  const url = `${config.baseURL.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`AI 请求失败（HTTP ${response.status}）`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error('AI 返回内容为空');
  return content;
}

/** 解析行动 JSON:剥掉可能的代码栅栏后取 JSON 主体,三个字段都必须是非空字符串,否则抛错 */
function parseActionJSON(raw: string): DOAction {
  let text = raw.trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI 返回中没有 JSON');
  const parsed = JSON.parse(text.slice(start, end + 1)) as { title?: unknown; time?: unknown; stop?: unknown };
  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  const time = typeof parsed.time === 'string' ? parsed.time.trim() : '';
  const stop = typeof parsed.stop === 'string' ? parsed.stop.trim() : '';
  if (!title || !time || !stop) throw new Error('AI 返回的行动字段不完整');
  return { title, time, stop };
}

/** 模型偶尔会给整段输出包一层引号;只剥掉首尾同一对引号,不碰内容内部的标点 */
function stripWrappingQuotes(text: string): string {
  const pairs: Array<[string, string]> = [['"', '"'], ['“', '”'], ['「', '」'], ['『', '』']];
  for (const [open, close] of pairs) {
    if (text.length > 1 && text.startsWith(open) && text.endsWith(close)) return text.slice(1, -1).trim();
  }
  return text;
}

/** 从 createdAt 推导「做了时间」,如:2026年9月13日 星期六 */
function formatRecordDate(timestamp: number): string {
  const date = new Date(timestamp);
  const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 星期${week}`;
}

async function generateActionRemote(idea: string, config: AIClientConfig): Promise<DOAction> {
  try {
    const content = await chatCompletion(config, ACTION_SYSTEM_PROMPT, idea);
    return parseActionJSON(content);
  } catch (err) {
    // 失败回落 mock:不崩溃、不卡住 UI;日志只记错误消息,不打印配置与密钥
    console.warn('[DO] AI 行动生成失败，回落本地模拟：', err instanceof Error ? err.message : String(err));
    return getActionMock(idea);
  }
}

async function refineRecordRemote(record: MemoryRecord, config: AIClientConfig): Promise<string> {
  try {
    const text = record.text.trim();
    if (!text || !Number.isFinite(record.createdAt)) throw new Error('记录缺少正文或有效时间');
    const user = `用户原话：${text}\n做了时间：${formatRecordDate(record.createdAt)}`;
    const content = await chatCompletion(config, REFINE_SYSTEM_PROMPT, user);
    const refined = stripWrappingQuotes(content.trim());
    if (!refined) throw new Error('AI 返回的整理结果为空');
    return refined;
  } catch (err) {
    console.warn('[DO] AI 整理记录失败，回落本地模板：', err instanceof Error ? err.message : String(err));
    return refineRecordMock(record);
  }
}
