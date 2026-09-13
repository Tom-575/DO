import type { DO, DOAction, DOIntent, DOStatus, MemoryRecord, RecordImage } from '../types';

/**
 * 数据备份(#12):把全部 DO 与记录打包成一个 JSON 文件导出,再从文件整体恢复。
 * - 图片在 store 里是原始 Blob,JSON 装不下,导出时统一转成 dataURL(base64);
 *   恢复时把 data: 开头的字符串还原回 Blob,普通地址(http/相对路径)原样保留。
 * - 导出文件包含图片 base64,体积会明显大于原始 Blob,属预期。
 * - 恢复是 overwrite 语义:调用方(lib/UI)先经确认,再 dispatch importData 整体替换。
 */

export const BACKUP_VERSION = 1;

/** 导出的 JSON 形状 */
export interface BackupPayload {
  version: number;
  exportedAt: string;
  dos: DO[];
  records: SerializedRecord[];
}

/** 记录导出后的形态:images 里的 Blob 全部变成了 dataURL 字符串 */
export interface SerializedRecord extends Omit<MemoryRecord, 'images'> {
  images: string[];
}

/** 恢复结果:字段形状与 store 契约一致,图片已还原为 Blob */
export interface BackupData {
  dos: DO[];
  records: MemoryRecord[];
}

/* ---------- 导出 ---------- */

/** 序列化并触发下载,返回生成的文件名(如 do-backup-20260913.json) */
export async function exportBackup(dos: DO[], records: MemoryRecord[]): Promise<string> {
  const serialized: SerializedRecord[] = await Promise.all(
    records.map(async (record) => ({
      ...record,
      images: await Promise.all(
        record.images.map((image) => (image instanceof Blob ? blobToDataURL(image) : image)),
      ),
    })),
  );
  const payload: BackupPayload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    dos,
    records: serialized,
  };
  const filename = `do-backup-${dateStamp(new Date())}.json`;
  downloadBlob(new Blob([JSON.stringify(payload)], { type: 'application/json' }), filename);
  return filename;
}

/** Blob → dataURL(base64)。失败抛错,由调用方转成行内提示 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('图片读取失败,导出已取消'));
    reader.readAsDataURL(blob);
  });
}

function dateStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- 恢复 ---------- */

/** 解析并校验备份文件;失败抛出带中文说明的 Error,调用方直接展示 */
export async function importBackup(file: File): Promise<BackupData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('无法读取:这不是有效的 JSON 备份文件');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('备份文件格式不正确');
  }
  const { version, dos, records } = parsed as { version?: unknown; dos?: unknown; records?: unknown };
  // version 兼容:缺省或非数字按 v1 处理;更高版本无法保证字段兼容,明确拒绝
  if (typeof version === 'number' && version !== BACKUP_VERSION) {
    throw new Error(
      version > BACKUP_VERSION
        ? `备份版本过新(v${version}),请先升级应用`
        : `备份版本过旧(v${version})`,
    );
  }
  if (!Array.isArray(dos) || !Array.isArray(records)) {
    throw new Error('备份文件缺少 DO 或记录数据');
  }
  const restoredDos = dos.map(sanitizeDO).filter((item): item is DO => item !== null);
  const restoredRecords = records.map(sanitizeRecord).filter((item): item is MemoryRecord => item !== null);
  if (restoredDos.length === 0 && restoredRecords.length === 0) {
    throw new Error('备份文件里没有可恢复的数据');
  }
  return { dos: restoredDos, records: restoredRecords };
}

const DO_STATUSES: readonly DOStatus[] = ['待定', '待记录', '已记录'];
const DO_INTENTS: readonly DOIntent[] = ['愿意去做', '不想做了', '暂不决定'];

function sanitizeDO(raw: unknown): DO | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Partial<DO>;
  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.thought !== 'string') return null;
  if (typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt)) return null;
  const action: DOAction = {
    title: typeof item.action?.title === 'string' ? item.action.title : '',
    time: typeof item.action?.time === 'string' ? item.action.time : '',
    stop: typeof item.action?.stop === 'string' ? item.action.stop : '',
  };
  const status = DO_STATUSES.includes(item.status as DOStatus) ? (item.status as DOStatus) : '待定';
  const intent = DO_INTENTS.includes(item.intent as DOIntent) ? (item.intent as DOIntent) : null;
  return {
    id: item.id,
    thought: item.thought,
    action,
    status,
    intent,
    createdAt: item.createdAt,
    ...(typeof item.parkedAt === 'number' && Number.isFinite(item.parkedAt) ? { parkedAt: item.parkedAt } : {}),
  };
}

function sanitizeRecord(raw: unknown): MemoryRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Partial<MemoryRecord>;
  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.text !== 'string') return null;
  if (typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt)) return null;
  const images = Array.isArray(item.images) ? item.images.map(restoreImage).filter((image): image is RecordImage => image !== null) : [];
  return {
    id: item.id,
    text: item.text,
    createdAt: item.createdAt,
    images,
    ...(typeof item.refined === 'string' ? { refined: item.refined } : {}),
    ...(typeof item.linkedDOId === 'string' ? { linkedDOId: item.linkedDOId } : {}),
  };
}

/** dataURL 还原成 Blob;普通地址原样返回;无效值丢弃 */
function restoreImage(image: unknown): RecordImage | null {
  if (typeof image !== 'string' || !image) return null;
  if (!image.startsWith('data:')) return image;
  return dataURLToBlob(image);
}

/** dataURL → Blob(atob + Uint8Array,纯本地解码);解析失败返回 null */
function dataURLToBlob(dataURL: string): Blob | null {
  const commaIndex = dataURL.indexOf(',');
  if (commaIndex < 0) return null;
  const header = dataURL.slice(0, commaIndex);
  const payload = dataURL.slice(commaIndex + 1);
  const mime = /^data:([^;,]*)/.exec(header)?.[1] || 'application/octet-stream';
  try {
    if (/;base64$/i.test(header)) {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    }
    return new Blob([decodeURIComponent(payload)], { type: mime });
  } catch {
    return null;
  }
}
