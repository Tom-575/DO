import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, CaretDown, Check, Plus, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { refineRecord } from '../lib/ai';
import type { MemoryRecord, RecordImage } from '../types';
import NavBar from '../components/NavBar';
import './record.css';

const MAX_IMAGES = 9;

/** Blob → 预览地址;依赖变化或卸载时统一 revoke(与 MemoryItem 同一套约定) */
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

/** 输入时自适应高度:内容多高输入区就多高,不出现内层滚动 */
function grow(element: HTMLTextAreaElement): void {
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

/**
 * 记录创建页(#3/#4)。小红书式发布流:先表达 → 想整理再点「帮我整理」→ 保存。
 * 草稿(text/images/refined/关联)全部是组件本地 state,不进全局 store;
 * AI 只在这一个按钮上触发,不在输入过程中改写;原话永远保留在主输入区。
 */
export default function RecordPage() {
  const { dos, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();

  const [text, setText] = useState('');
  const [images, setImages] = useState<RecordImage[]>([]);
  const previews = useImageUrls(images);

  /* 整理版:生成后是普通可编辑草稿,再点一次按钮会用当前输入重新生成 */
  const [refined, setRefined] = useState('');
  const [hasRefined, setHasRefined] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineFailed, setRefineFailed] = useState(false);

  /* 关联 DO:默认应用系统推荐(最新的待记录 DO);× 取消后本次进入不再自动推荐 */
  const pending = dos.filter((item) => item.status === '待定' || item.status === '待记录');
  const recommended = pending.find((item) => item.status === '待记录');
  const [linkedId, setLinkedId] = useState<string | null>(null);
  const [recommendDismissed, setRecommendDismissed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    if (!recommendDismissed && recommended) setLinkedId((current) => current ?? recommended.id);
  }, [recommendDismissed, recommended]);
  const selected = linkedId ? dos.find((item) => item.id === linkedId) : undefined;
  const unlink = () => {
    setLinkedId(null);
    setRecommendDismissed(true);
  };

  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImages((current) => [...current, ...Array.from(files).slice(0, MAX_IMAGES - current.length)]);
  };

  const refine = async () => {
    if (refining || !text.trim()) return;
    setRefining(true);
    setRefineFailed(false);
    try {
      // 草稿态对象:此刻还没有记录 id,text/images 就是当前输入的原话与素材
      const draft: MemoryRecord = { id: '', text, images, createdAt: Date.now() };
      const result = await refineRecord(draft, settings);
      setRefined(result);
      setHasRefined(true);
    } catch {
      setRefineFailed(true);
    } finally {
      setRefining(false);
    }
  };

  const canSave = text.trim().length > 0 || images.length > 0;
  const save = () => {
    if (!canSave) return;
    dispatch({
      type: 'addRecord',
      text: text.trim(),
      images,
      ...(refined.trim() ? { refined: refined.trim() } : {}),
      ...(selected ? { linkedDOId: selected.id } : {}),
    });
    // 回忆页按时间倒序,保存后切过去让用户看到记录已经留下
    dispatch({ type: 'setTab', tab: 'memories' });
    dispatch({ type: 'setScreen', screen: 'home' });
  };

  return <motion.section className="page record-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={() => dispatch({ type: 'goHome' })} aria-label="返回"><ArrowLeft size={23} /></button>} title="新的记录" right={<span className="nav-spacer" />} />
    <div className="record-content">
      <textarea className="record-text" aria-label="记录内容" value={text} onChange={(event) => { setText(event.target.value); grow(event.target); }} placeholder="做了什么，就写什么" />
      <button className="record-refine" disabled={!text.trim() || refining} onClick={() => void refine()}>{refining ? '整理中…' : '帮我整理'}</button>
      {refineFailed && <p className="record-refine-error">整理没成功，稍后再试。</p>}
      {hasRefined && <section className="record-refined">
        <h2>整理版</h2>
        <textarea aria-label="整理版" value={refined} onChange={(event) => { setRefined(event.target.value); grow(event.target); }} />
        <p>可以直接改，原话仍会保留。</p>
      </section>}
      <div className="record-images">
        {previews.map((url, index) => <div className="record-image" key={url}>
          <img src={url} alt="" />
          <button aria-label={`移除第 ${index + 1} 张图片`} onClick={() => setImages((current) => current.filter((_, i) => i !== index))}><X size={12} weight="bold" /></button>
        </div>)}
        {images.length < MAX_IMAGES && <label className="record-add">
          <input type="file" multiple accept="image/*" onChange={(event) => { addImages(event.target.files); event.target.value = ''; }} />
          <Plus size={20} weight="light" />
          <span>{images.length}/{MAX_IMAGES}</span>
        </label>}
      </div>
      {pending.length > 0 && <section className="record-link">
        <div className="record-link-heading">
          <span>关联 DO</span>
          <button onClick={() => setPickerOpen((open) => !open)} aria-label={pickerOpen ? '收起 DO 列表' : '展开 DO 列表'} aria-expanded={pickerOpen}><CaretDown className={pickerOpen ? 'rotated' : ''} size={16} weight="bold" /></button>
        </div>
        <div className="record-link-card">
          <div className="record-link-current">
            {selected
              ? <>
                  {selected.id === recommended?.id && <em>推荐</em>}
                  <span>{selected.thought}</span>
                  <button onClick={unlink} aria-label="取消关联"><X size={13} weight="bold" /></button>
                </>
              : <span className="empty">不关联</span>}
          </div>
          {pickerOpen && pending.map((item) => <button key={item.id} className="record-link-row" onClick={() => (item.id === linkedId ? unlink() : setLinkedId(item.id))}>
            <span>{item.thought}</span>
            {item.id === linkedId && <Check size={16} weight="bold" />}
          </button>)}
        </div>
      </section>}
    </div>
    <div className="bottom-actions">
      <button className="primary-action" disabled={!canSave} onClick={save}>保存</button>
    </div>
  </motion.section>;
}
