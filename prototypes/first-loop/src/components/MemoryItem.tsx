import { useState } from 'react';
import { DownloadSimple, ImageBroken } from '@phosphor-icons/react';
import { formatClock, memoryDayLabel } from '../lib/memories-date';
import { useImageUrls } from '../lib/image-urls';
import type { MemoryRecord } from '../types';

interface MemoryItemProps {
  record: MemoryRecord;
  onEdit: (record: MemoryRecord) => void;
  onExport: (record: MemoryRecord) => void;
  onView: (urls: string[], index: number) => void;
}

/** Blob 加载或解码失败不静默:占位块明示「图片加载失败」,其余图片不受影响 */
export default function MemoryItem({ record, onEdit, onExport, onView }: MemoryItemProps) {
  const urls = useImageUrls(record.images);
  const withImage = record.images.length > 0;
  const [failed, setFailed] = useState<number[]>([]);
  const markFailed = (index: number) => setFailed((current) => (current.includes(index) ? current : [...current, index]));
  return <article className={`memory ${withImage ? 'with-image' : 'text-only'}`} onClick={() => onEdit(record)}>
    <button className="memory-export" aria-label="导出卡片" onClick={(event) => { event.stopPropagation(); onExport(record); }}><DownloadSimple size={16} weight="bold" /></button>
    <div className="memory-time"><strong>{memoryDayLabel(record.createdAt)}</strong><span>{formatClock(record.createdAt)}</span></div>
    {urls.length > 0 && (
      <div className="memory-images">
        {urls.map((url, index) => failed.includes(index)
          ? <div key={index} className="memory-image-failed"><ImageBroken size={20} /><span>图片加载失败</span></div>
          : <img key={index} src={url} alt="" loading="lazy" onClick={(event) => { event.stopPropagation(); onView(urls, index); }} onError={() => markFailed(index)} />)}
      </div>
    )}
    <p>{record.text}</p>
  </article>;
}
