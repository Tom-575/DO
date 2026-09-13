import { useEffect, useState } from 'react';
import { formatClock, memoryDayLabel } from '../lib/memories-date';
import type { MemoryRecord, RecordImage } from '../types';

interface MemoryItemProps {
  record: MemoryRecord;
}

/**
 * 把 RecordImage[] 统一转成可渲染的地址:
 * string(URL/dataURL)直接用;Blob 现场创建 object URL,
 * 在依赖变化或卸载时统一 revoke,避免泄漏。
 */
function useImageUrls(images: RecordImage[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const created: string[] = [];
    const next = images.map((image) => {
      if (typeof image === 'string') return image;
      const url = URL.createObjectURL(image);
      created.push(url);
      return url;
    });
    setUrls(next);
    return () => {
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [images]);
  return urls;
}

export default function MemoryItem({ record }: MemoryItemProps) {
  const urls = useImageUrls(record.images);
  const withImage = record.images.length > 0;
  return <article className={`memory ${withImage ? 'with-image' : 'text-only'}`}>
    <div className="memory-time"><strong>{memoryDayLabel(record.createdAt)}</strong><span>{formatClock(record.createdAt)}</span></div>
    {urls.length > 0 && (
      <div className="memory-images">
        {urls.map((url, index) => <img key={index} src={url} alt="" loading="lazy" />)}
      </div>
    )}
    <p>{record.text}</p>
  </article>;
}
