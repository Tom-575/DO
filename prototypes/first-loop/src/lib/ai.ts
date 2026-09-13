import { getAction, planActionMock } from './mock';
import type { AppSettings, DOAction, MemoryRecord, PlanReply, PlanTurn } from '../types';

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

/** 多轮对话规划(#15):history 首条必为用户原话;已配置走远程,任何失败自动回落 mock */
export async function planAction(history: PlanTurn[], settings: AppSettings): Promise<PlanReply> {
  if (isAIConfigured(settings)) {
    return planActionRemote(history, settings.ai!);
  }
  return planActionMock(history);
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

/** 对话规划(#15):系统提示词即对话契约——能不问就不问,至多两问,到点必须给行动;JSON 是唯一输出 */
const PLAN_SYSTEM_PROMPT = `你是 DO，帮用户把一个模糊念头变成可以开始的最小行动。先用简短对话弄清用户想做什么，然后给出一个行动。

对话规则：
- 只有当不同理解会明显改变行动时才提问；每次最多问一个问题，问题要短，并附上好选的回答选项。
- 能不问就不问：用户说得够清楚就直接给行动。
- 你的提问总数不能超过 2 次。

给行动时遵守：
- 每次只给一个最小行动；不列清单，不生成完整计划。
- 行动要适合用户当下的时间、地点、能力和资源，准备成本低；title 写第一步，具体到现在就能动手。
- 行动要小：通常 5–30 分钟内就能停下来，能更短更好；stop 必须是明确的停止或完成条件。
- 开始本身就是成功：不提完成率、连续打卡，不用励志口号施压。
- 涉及危险、医疗等高风险活动时，改给一个更安全的替代行动。
- 用户的第一条消息是念头的原话，它是这个念头的本名；行动里不要改写或替换它。
- 全部用中文，语气平实直接，文字要短，别让建议本身成为开始的障碍。

只输出一个 JSON 对象，不要代码栅栏、解释或任何额外文字。两种格式二选一：
提问：{"kind":"question","text":"一句简短的问题","options":["可选回答一","可选回答二"]}
行动：{"kind":"action","action":{"title":"现在具体做的第一步","time":"预计时长，如：大约 10 分钟","stop":"明确的停止条件"}}`;

/** 红线追加段(#15):assistant 已问满 2 次,第三次交互不再给模型提问的余地 */
const PLAN_FORCE_ACTION = `

这是第三次交互，禁止再提问，必须直接给出行动。`;

/** 发送一次单轮 chat/completions 请求,返回首条回复文本;失败抛错(错误信息只含状态码等,绝不含密钥) */
async function chatCompletion(config: AIClientConfig, system: string, user: string): Promise<string> {
  return chatCompletionMessages(config, system, [{ role: 'user', content: user }]);
}

/** 多轮版本(#15 对话规划):system 置顶,history 按原顺序进 messages;失败抛错,错误信息绝不含密钥 */
async function chatCompletionMessages(
  config: AIClientConfig,
  system: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const url = `${config.baseURL.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.8,
      messages: [{ role: 'system', content: system }, ...history],
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

/** 解析对话规划 JSON(#15):question 只需非空 text;action 复用行动字段的完整性校验;两种都不是就抛错 */
function parsePlanJSON(raw: string): PlanReply {
  let text = raw.trim();
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI 返回中没有 JSON');
  const parsed = JSON.parse(text.slice(start, end + 1)) as {
    kind?: unknown;
    text?: unknown;
    options?: unknown;
    action?: unknown;
  };
  if (parsed.kind === 'question') {
    const question = typeof parsed.text === 'string' ? stripWrappingQuotes(parsed.text.trim()) : '';
    if (!question) throw new Error('AI 返回的提问内容为空');
    // 选项可有可无;只保留非空字符串,空数组视同没有选项
    const options = Array.isArray(parsed.options)
      ? parsed.options.map((option) => (typeof option === 'string' ? option.trim() : '')).filter(Boolean)
      : [];
    return { kind: 'question', text: question, ...(options.length ? { options } : {}) };
  }
  if (parsed.kind === 'action') {
    // 行动结构与「生成行动」契约一致,直接复用同一套字段校验
    return { kind: 'action', action: parseActionJSON(JSON.stringify(parsed.action ?? {})) };
  }
  throw new Error('AI 返回的 kind 不是 question/action');
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

async function planActionRemote(history: PlanTurn[], config: AIClientConfig): Promise<PlanReply> {
  try {
    const asked = history.filter((turn) => turn.role === 'assistant').length;
    // 红线:assistant 提问满 2 次后,系统提示词强制直接给行动;模型仍回提问时按违规处理,回落 mock 的行动
    const system = asked >= 2 ? PLAN_SYSTEM_PROMPT + PLAN_FORCE_ACTION : PLAN_SYSTEM_PROMPT;
    const content = await chatCompletionMessages(config, system, history.map((turn) => ({ role: turn.role, content: turn.text })));
    const reply = parsePlanJSON(content);
    if (asked >= 2 && reply.kind === 'question') throw new Error('AI 在第三次交互仍返回提问');
    return reply;
  } catch (err) {
    console.warn('[DO] AI 对话规划失败，回落本地模拟：', err instanceof Error ? err.message : String(err));
    return planActionMock(history);
  }
}
