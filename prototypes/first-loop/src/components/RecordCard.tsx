import { useEffect, useRef } from 'react';
import { renderRecordCard } from '../lib/card-render';
import type { DO, MemoryRecord } from '../types';
import './card.css';

interface RecordCardProps {
  record: MemoryRecord;
  dos: DO[];
}

/**
 * 分享卡片(#14):canvas 手绘,预览即导出物(html-to-image 的 DOM 序列化在嵌入式
 * webview 中永久挂起,弃用;canvas 路径完全确定性)。浅色固定配色,独立于应用主题。
 */
export default function RecordCard({ record, dos }: RecordCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linked = record.linkedDOId ? dos.find((item) => item.id === record.linkedDOId) : undefined;
  const cover = record.images[0] ?? null;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void renderRecordCard(canvas, {
      createdAt: record.createdAt,
      body: record.refined || record.text,
      idea: linked?.thought ?? null,
      coverBlob: cover instanceof Blob ? cover : null,
      coverUrl: typeof cover === 'string' ? cover : null,
    });
  }, [record, linked, cover]);
  return <canvas ref={canvasRef} className="record-card" aria-label="记录卡片预览" />;
}
