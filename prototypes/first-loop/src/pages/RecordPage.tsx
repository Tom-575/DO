import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, CaretDown, Check, Plus, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { refineRecord } from '../lib/ai';
import { clearRecordDraft, loadRecordDraft, saveRecordDraft } from '../lib/storage';
import { useImageUrls } from '../lib/image-urls';
import type { MemoryRecord, RecordImage } from '../types';
import NavBar from '../components/NavBar';
import './record.css';

const MAX_IMAGES = 9;
/** 压缩阈值:原图 ≤300KB 直接保留;超过则长边压到 1600px、JPEG 0.85 */
const COMPRESS_THRESHOLD = 300_000;
const COMPRESS_EDGE = 1600;

/** 输入时自适应高度:内容多高输入区就多高,不出现内层滚动 */
function grow(element: HTMLTextAreaElement): void {
  element.style.height = 'auto';
  element.style.height = `${element.scrollHeight}px`;
}

/** 大图压缩:canvas 重采样;任何一步失败都回退原图,压缩不能阻塞保存 */
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size <= COMPRESS_THRESHOLD) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

/**
 * 记录创建/编辑页(#3/#4/#13)。小红书式发布流:先表达 → 想整理再点「帮我整理」→ 保存。
 * 新建态草稿自动暂存 IndexedDB,重进恢复;编辑态由回忆页进入(activeRecordId),
 * 保存走 updateRecord,关联变更的 DO 状态联动在 reducer 内完成。
 */
export default function RecordPage() {
  const { dos, records, settings, activeRecordId } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const activeRecord = activeRecordId ? records.find((item) => item.id === activeRecordId) : undefined;
  const editing = Boolean(activeRecord);

  const [text, setText] = useState(() => activeRecord?.text ?? '');
  const [images, setImages] = useState<RecordImage[]>(() => activeRecord?.images ?? []);
  const previews = useImageUrls(images);

  /* 整理版:生成后是普通可编辑草稿,再点一次按钮会用当前输入重新生成 */
  const [refined, setRefined] = useState(() => activeRecord?.refined ?? '');
  const [hasRefined, setHasRefined] = useState(() => Boolean(activeRecord?.refined));
  const [refining, setRefining] = useState(false);
  const [refineFailed, setRefineFailed] = useState(false);

  /* 关联 DO:新建默认应用系统推荐(最新的待记录 DO);编辑态以记录既有关联为准,不自动推荐 */
  const pending = dos.filter((item) => item.status === '待定' || item.status === '待记录');
  const recommended = pending.find((item) => item.status === '待记录');  const [linkedId, setLinkedId] = useState<string | null>(() => activeRecord?.linkedDOId ?? null);
  const [recommendDismissed, setRecommendDismissed] = useState(() => Boolean(activeRecord));
  const [pickerOpen, setPickerOpen] = useState(false);
  useEffect(() => {
    if (!recommendDismissed && recommended) setLinkedId((current) => current ?? recommended.id);
  }, [recommendDismissed, recommended]);
  const selected = linkedId ? dos.find((item) => item.id === linkedId) : undefined;
  // 编辑态候选:当前已关联的 DO(可能已是「已记录」)必须留在列表里,否则既看不到也取消不了
  const linkCandidates = selected && !pending.some((item) => item.id === selected.id) ? [selected, ...pending] : pending;
  const unlink = () => {
    setLinkedId(null);
    setRecommendDismissed(true);
  };

  /* 草稿:仅新建态;恢复完成前不写入,防止空态覆盖已存草稿 */
  const [draftReady, setDraftReady] = useState(editing);
  const [draftHint, setDraftHint] = useState(false);
  useEffect(() => {
    if (editing) return;
    void loadRecordDraft().then((draft) => {
      if (draft && (draft.text.trim() || draft.refined.trim() || draft.images.length > 0)) {
        setText(draft.text);
        if (draft.refined) {
          setRefined(draft.refined);
          setHasRefined(true);
        }
        if (draft.images.length > 0) setImages(draft.images);
        if (draft.linkedDOId) setLinkedId(draft.linkedDOId);
        setDraftHint(true);
      }
      setDraftReady(true);
    });
  }, []); // 挂载时一次;editing 在本页生命周期内不变
  useEffect(() => {
    if (editing || !draftReady) return;
    if (!text.trim() && !refined.trim() && images.length === 0) {
      void clearRecordDraft();
      return;
    }
    saveRecordDraft({ text, refined: hasRefined ? refined : '', images: images.filter((image): image is Blob => image instanceof Blob), linkedDOId: linkedId, savedAt: Date.now() });
  }, [text, refined, hasRefined, images, linkedId, editing, draftReady]);

  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // FileList 是实时引用:调用方随后会清空 input.value,必须先同步快照,延迟读取会拿到空列表
    const picked = Array.from(files);
    void (async () => {
      const processed = await Promise.all(picked.map(compressImage));
      setImages((current) => [...current, ...processed.slice(0, MAX_IMAGES - current.length)]);
    })();
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
    if (activeRecord) {
      // 编辑态:linkedDOId 必传,reducer 依据新旧差异联动 DO 状态;refined 清空即移除
      const patch: Partial<Omit<MemoryRecord, 'id' | 'linkedDOId'>> & { linkedDOId?: string | null } = {
        text: text.trim(),
        images,
        linkedDOId: linkedId,
        ...(refined.trim() ? { refined: refined.trim() } : { refined: undefined }),
      };
      dispatch({ type: 'updateRecord', id: activeRecord.id, patch });
      dispatch({ type: 'setActiveRecordId', id: null });
    } else {
      dispatch({
        type: 'addRecord',
        text: text.trim(),
        images,
        ...(refined.trim() ? { refined: refined.trim() } : {}),
        ...(selected ? { linkedDOId: selected.id } : {}),
      });
      void clearRecordDraft();
    }
    // 回忆页按时间倒序,保存后切过去让用户看到记录已经留下
    dispatch({ type: 'setTab', tab: 'memories' });
    dispatch({ type: 'setScreen', screen: 'home' });
  };

  const leave = () => {
    if (editing) dispatch({ type: 'setActiveRecordId', id: null });
    dispatch({ type: 'goHome' });
  };

  return <motion.section className="page record-page" initial={{ x: '18%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 34 }}>
    <NavBar left={<button className="icon-action" onClick={leave} aria-label="返回"><ArrowLeft size={23} /></button>} title={editing ? '编辑记录' : '新的记录'} right={<span className="nav-spacer" />} />
    <div className="record-content">
      {draftHint && <p className="record-draft-hint">已恢复上次未保存的草稿</p>}
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
      {linkCandidates.length > 0 && <section className="record-link">
        <div className="record-link-heading">
          <span>关联 DO</span>
          <button onClick={() => setPickerOpen((open) => !open)} aria-label={pickerOpen ? '收起 DO 列表' : '展开 DO 列表'} aria-expanded={pickerOpen}><CaretDown className={pickerOpen ? 'rotated' : ''} size={16} weight="bold" /></button>
        </div>
        <div className="record-link-card">
          <div className="record-link-current">
            {selected
              ? <>
                  {!editing && selected.id === recommended?.id && <em>推荐</em>}
                  <span>{selected.thought}</span>
                  <button onClick={unlink} aria-label="取消关联"><X size={13} weight="bold" /></button>
                </>
              : <span className="empty">不关联</span>}
          </div>
          {pickerOpen && linkCandidates.map((item) => <button key={item.id} className="record-link-row" onClick={() => (item.id === linkedId ? unlink() : setLinkedId(item.id))}>
            <span>{item.thought}</span>
            {item.id === linkedId && <Check size={16} weight="bold" />}
          </button>)}
        </div>
      </section>}
    </div>
    <div className="bottom-actions">
      <button className="primary-action" disabled={!canSave} onClick={save}>{editing ? '保存修改' : '保存'}</button>
    </div>
  </motion.section>;
}
