import { useEffect, useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { renderRecordCard } from '../lib/card-render';
import { parseMinutes } from '../lib/duration';
import type { DO, MemoryRecord } from '../types';
import './card.css';

interface ShareCardProps {
  record: MemoryRecord;
  dos: DO[];
  records: MemoryRecord[];
  reduceMotion: boolean;
  onClose: () => void;
}

/** Web Share 在部分环境缺失，这里只声明用到的两个方法，避免 any */
type ShareNavigator = Navigator & {
  canShare?: (data: { files?: File[] }) => boolean;
  share?: (data: { files?: File[]; title?: string }) => Promise<void>;
};

/**
 * 分享卡（V2 稿 06）：一整屏深色，预览即导出物（canvas 手绘）。
 * 「保留我的原话，不做修饰」默认开——原话是这份记录的事实来源，整理版是可选的表达。
 */
export default function ShareCard({ record, dos, records, reduceMotion, onClose }: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preserveOriginal, setPreserveOriginal] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const linked = record.linkedDOId ? dos.find((item) => item.id === record.linkedDOId) : undefined;
  const attempt = linked ? Math.max(1, records.filter((item) => item.linkedDOId === linked.id).length) : 0;
  const minutes = linked ? parseMinutes(linked.action.time) : null;
  const cover = record.images[0] ?? null;
  const body = preserveOriginal ? record.text : record.refined || record.text;
  const fileName = `DO痕迹-${new Date(record.createdAt).toISOString().slice(0, 10).replaceAll('-', '')}.png`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void renderRecordCard(canvas, {
      createdAt: record.createdAt,
      body,
      idea: linked?.thought ?? null,
      minutes,
      attempt,
      coverBlob: cover instanceof Blob ? cover : null,
      coverUrl: typeof cover === 'string' ? cover : null,
    });
  }, [record, body, linked, minutes, attempt, cover]);

  const toBlob = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const saveImage = async () => {
    setBusy(true);
    setNote('');
    try {
      const blob = await toBlob();
      if (!blob) throw new Error('toBlob returned null');
      download(blob);
    } catch {
      setNote('这张卡没生成成功，再试一次。');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    setNote('');
    try {
      const blob = await toBlob();
      if (!blob) throw new Error('toBlob returned null');
      const nav = navigator as ShareNavigator;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({ files: [file], title: 'DO' });
      } else {
        // 不支持带文件的分享：直接给图片，并说明发生了什么（不静默什么都不做）
        download(blob);
        setNote('这台设备不支持直接分享，已经保存图片。');
      }
    } catch {
      // 用户取消分享也会走到这里，不再补一次下载，只保持安静
      setNote('');
    } finally {
      setBusy(false);
    }
  };

  return <div className={`share-page${reduceMotion ? '' : ' animated'}`} role="dialog" aria-label="分享这张痕迹">
    <header className="share-head">
      <h2>把这次留下</h2>
      <button className="share-close" aria-label="关闭" onClick={onClose}><X size={18} weight="bold" /></button>
    </header>

    <div className="share-stage">
      <canvas ref={canvasRef} className="share-canvas" aria-label="分享卡预览" />
    </div>

    <div className="share-foot">
      <label className="share-switch">
        <span>保留我的原话，不做修饰</span>
        <input type="checkbox" checked={preserveOriginal} onChange={(event) => setPreserveOriginal(event.target.checked)} />
        <span className="switch" aria-hidden="true" />
      </label>
      {note && <p className="share-note">{note}</p>}
      <button className="pill pill-peach pill-wide" disabled={busy} onClick={() => void share()}>分享</button>
      <button className="pill pill-outline pill-wide share-save" disabled={busy} onClick={() => void saveImage()}>只保存图片</button>
      <button className="text-action share-quiet" onClick={onClose}>只留给自己，不分享</button>
    </div>
  </div>;
}
