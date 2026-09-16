import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ImageBroken, PencilSimple, X } from '@phosphor-icons/react';
import { SPRING_BOUNCE } from '../lib/motion';
import { useExpandTransition } from '../lib/use-expand-transition';

/**
 * 全屏图片查看器(#17,小红书式):黑底、scroll-snap 左右滑动切换、页码指示。
 * 分区响应的「看图」侧:点回忆条目图片区进入;查看器内提供编辑入口。
 * 单图也进,保持一致;不做排序/封面选择/缩放(留待后续 change)。
 */

interface ImageViewerProps {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
  onEdit: () => void;
}

export default function ImageViewer({ urls, initialIndex, onClose, onEdit }: ImageViewerProps) {
  const reduceMotion = useReducedMotion();
  // 查看器从被点的那张缩略图扩开、关闭时收回它(原点由 MemoryItem 在点图时量下)
  const bloom = useExpandTransition(onClose);
  const [index, setIndex] = useState(initialIndex);
  const [failed, setFailed] = useState<number[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const markFailed = (i: number) => setFailed((current) => (current.includes(i) ? current : [...current, i]));

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(urls.length - 1, i));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  // 打开即定位到被点的图片(scroll-snap 下直接设置 scrollLeft)
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = initialIndex * track.clientWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滑动同步页码;snap 定位下取最近的整页
  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    setIndex(Math.max(0, Math.min(urls.length - 1, next)));
  };

  // 电脑可用:← → 切换,Esc 关闭;鼠标滚轮纵向分量转横向
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') scrollToIndex(index + 1);
      if (event.key === 'ArrowLeft') scrollToIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <motion.div
    className={`viewer-overlay${bloom.className}`}
    style={bloom.clipPath ? { clipPath: bloom.clipPath } : undefined}
    role="dialog"
    aria-label="查看图片"
    onClick={bloom.leave}
    initial={bloom.animated ? false : { opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: bloom.animated || reduceMotion ? 0 : .2 }}
  >
    <motion.div className="viewer-bar" onClick={(event) => event.stopPropagation()}
      initial={{ opacity: 0, y: -26 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : SPRING_BOUNCE}>
      <button className="viewer-action" aria-label="关闭" onClick={bloom.leave}><X size={22} /></button>
      <span className="viewer-count">{index + 1} / {urls.length}</span>
      <button className="viewer-action" aria-label="编辑记录" onClick={onEdit}><PencilSimple size={22} /></button>
    </motion.div>
    <div className="viewer-track" ref={trackRef} onScroll={handleScroll} onWheel={(event) => {
      const track = trackRef.current;
      if (track && Math.abs(event.deltaY) > Math.abs(event.deltaX)) track.scrollLeft += event.deltaY;
    }}>
      {urls.map((url, i) => failed.includes(i)
        ? <div key={i} className="viewer-slide"><div className="viewer-failed"><ImageBroken size={22} /><span>图片加载失败</span></div></div>
        : <div key={i} className="viewer-slide"><img src={url} alt="" draggable={false} onError={() => markFailed(i)} /></div>)}
    </div>
  </motion.div>;
}
