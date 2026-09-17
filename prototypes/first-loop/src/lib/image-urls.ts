import { useEffect, useState } from 'react';
import type { RecordImage } from '../types';

/**
 * 把 RecordImage[] 统一转成可渲染的地址:
 * string(URL/dataURL)直接用;Blob 现场创建 object URL,
 * 在依赖变化或卸载时统一 revoke,避免泄漏。
 * TraceItem / RecordPage / ShareCard 共用,新增渲染处不要再复制这份逻辑。
 */
export function useImageUrls(images: RecordImage[]): string[] {
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
