/**
 * 痕迹页的推导（V2）：统计与尝试次数。
 * 全部**不落库**，只从既有记录算出来；分类筛选已按用户决定移除。
 */

import type { MemoryRecord, RecordOutcome } from '../types';

/** 结果标签 → 痕迹行左侧那道竖条的色相；只影响观感，不承载额外语义 */
export type OutcomeTone = 'done' | 'part' | 'stop' | 'unsuited' | 'none';

export function outcomeTone(outcome?: RecordOutcome): OutcomeTone {
  switch (outcome) {
    case '做完了':
      return 'done';
    case '做了一部分':
      return 'part';
    case '中途停下来了':
      return 'stop';
    case '发现不太适合我':
      return 'unsuited';
    default:
      return 'none';
  }
}

export interface TraceStats {
  /** 真实尝试次数 = 记录条数 */
  total: number;
  /** 结果标签为「做完了」的条数 */
  done: number;
  /** 结果标签为「中途停下来了」的条数 */
  stopped: number;
}

export function traceStats(records: MemoryRecord[]): TraceStats {
  return {
    total: records.length,
    done: records.filter((record) => record.outcome === '做完了').length,
    stopped: records.filter((record) => record.outcome === '中途停下来了').length,
  };
}

/** 某条 DO 的尝试次数：关联到它的记录条数 */
export function attemptCount(records: MemoryRecord[], doId: string): number {
  return records.filter((record) => record.linkedDOId === doId).length;
}

/** 某条 DO 最近一次尝试的封面图（今天页「正在进行」卡的缩略图）；没有图返回 undefined */
export function latestCover(records: MemoryRecord[], doId: string): MemoryRecord['images'][number] | undefined {
  const linked = records.filter((record) => record.linkedDOId === doId && record.images.length > 0);
  return linked[0]?.images[0];
}
