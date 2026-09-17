import { useRef, useState, type ChangeEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Download, Moon, Palette, Plus, Sun, UploadSimple, X } from '@phosphor-icons/react';
import { useAppState, useDispatch } from '../store/store';
import { isAIConfigured, type AIClientConfig } from '../lib/ai';
import { exportBackup, importBackup } from '../lib/backup';
import { SPRING_IN } from '../lib/motion';
import { useExpandTransition } from '../lib/use-expand-transition';
import type { AppSettings } from '../types';
import NavBar from './NavBar';
import './appearance.css';
import './sheet-extras.css';

/** 面板里可改的三项设置 —— 就是「草稿」的全部内容 */
interface SettingsDraft {
  theme: AppSettings['theme'];
  background: string;
  ai: AIClientConfig;
}

/**
 * 外观 / 设置(对外唯一的设置入口),一整屏。
 *
 * 明暗 / 背景 / AI 三项走本地草稿:✓ 才写回、✕ 直接丢弃,所以按 ✕ 是真正的空操作。
 * 数据分组不在草稿内——导出是只读,恢复点下去立即写入(组标签上标了「立即生效」)。
 */
export default function AppearancePanel() {
  const { dos, records, settings } = useAppState();
  const dispatch = useDispatch();
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [exportNote, setExportNote] = useState('');
  const [importNote, setImportNote] = useState<{ text: string; alert?: boolean } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 打开那一刻的设置快照 → 草稿。之后所有改动只改草稿,store 一动不动。
  const [draft, setDraft] = useState<SettingsDraft>(() => ({
    theme: settings.theme,
    background: settings.background,
    ai: { baseURL: '', model: '', apiKey: '', ...settings.ai },
  }));
  const aiReady = isAIConfigured({ ...settings, ai: draft.ai });

  /** 编辑 AI 任一字段:始终保持三字段完整(空串 = 未填),isAIConfigured 据此判断 */
  function editAI(patch: Partial<AIClientConfig>) {
    setDraft((current) => {
      const next: AIClientConfig = { ...current.ai, ...patch };
      return {
        ...current,
        ai: { baseURL: next.baseURL.trim(), model: next.model.trim(), apiKey: next.apiKey.trim() },
      };
    });
  }

  async function handleExport() {
    if (busy) return;
    setBusy(true);
    setExportNote('正在导出…');
    try {
      const filename = await exportBackup(dos, records);
      setExportNote(`已导出 ${filename},包含图片,文件会比原图更大`);
    } catch {
      setExportNote('导出失败,请重试');
    } finally {
      setBusy(false);
    }
  }

  function handleFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = ''; // 允许再次选择同一个文件
    if (!file) return;
    setImportNote(null);
    setPendingFile(file);
  }

  async function handleImportConfirm() {
    if (!pendingFile || busy) return;
    setBusy(true);
    try {
      const data = await importBackup(pendingFile);
      dispatch({ type: 'importData', dos: data.dos, records: data.records });
      setImportNote({ text: `已恢复 ${data.dos.length} 条 DO、${data.records.length} 条记录` });
      setPendingFile(null);
    } catch (err) {
      setImportNote({ text: err instanceof Error ? err.message : '恢复失败,请重试', alert: true });
    } finally {
      setBusy(false);
    }
  }

  // 收缩动画播完才回首页(不用退场动画机制,见 DESIGN §5)
  const expand = useExpandTransition(() => dispatch({ type: 'goHome' }));
  /** 取消:直接走人,草稿丢掉 */
  const cancel = expand.leave;
  /** 确认:先把草稿写回,再走人 —— 收回去的路上露出的首页已经是新的外观 */
  const confirm = () => {
    dispatch({ type: 'setSettings', settings: { theme: draft.theme, background: draft.background, ai: draft.ai } });
    expand.leave();
  };

  return <motion.section
    className={`page appearance-page${expand.className}`}
    style={expand.clipPath ? { clipPath: expand.clipPath } : undefined}
    initial={expand.animated ? false : { x: '30%' }}
    animate={{ x: 0 }}
    transition={expand.animated || reduceMotion ? { duration: 0 } : SPRING_IN}
  >
    <NavBar
      left={<button className="icon-action" aria-label="取消" onClick={cancel}><X size={18} weight="bold" /></button>}
      title="我的"
      right={<button className="icon-action icon-action-end" aria-label="确认" onClick={confirm}><Check size={19} weight="bold" /></button>}
    />
    <div className="appearance-content">
      <p className="appearance-lead">让 DO 更像你的空间。改动点 ✓ 才生效，点 ✕ 全部丢弃。</p>

      <div className="appearance-group">
        <span className="group-label">明暗</span>
        <div className="choice-row">
          <button className={draft.theme === 'light' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, theme: 'light' }))}>
            <Sun size={18} />
            <span>白天</span>
          </button>
          <button className={draft.theme === 'dark' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, theme: 'dark' }))}>
            <Moon size={18} />
            <span>黑夜</span>
          </button>
          <button className={draft.theme === 'system' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, theme: 'system' }))}>
            <Palette size={18} />
            <span>跟随系统</span>
          </button>
        </div>
      </div>

      <div className="appearance-group">
        <span className="group-label">背景</span>
        <div className="background-grid">
          <button className={draft.background === 'none' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, background: 'none' }))}>
            <span className="background-swatch plain" />
            纯净
          </button>
          <button className={draft.background === 'mist' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, background: 'mist' }))}>
            <span className="background-swatch mist" />
            薄雾
          </button>
          <button className={draft.background === 'night' ? 'active' : ''} onClick={() => setDraft((current) => ({ ...current, background: 'night' }))}>
            <span className="background-swatch night" />
            夜色
          </button>
          <label className="background-upload">
            <span className="background-swatch upload">
              <Plus size={20} />
            </span>
            添加照片
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => setDraft((current) => ({ ...current, background: String(reader.result) }));
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="appearance-group">
        <span className="group-label">AI</span>
        <p className={`sheet-status${aiReady ? ' ready' : ''}`}>{aiReady ? '已接入,行动与整理将调用你的接口' : '未配置,使用离线演示'}</p>
        <label className="sheet-field">
          <span>接口地址</span>
          <input
            value={draft.ai.baseURL}
            placeholder="https://xxx/v1"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => editAI({ baseURL: event.currentTarget.value })}
          />
        </label>
        <label className="sheet-field">
          <span>模型名</span>
          <input
            value={draft.ai.model}
            placeholder="如 glm-4-flash"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => editAI({ model: event.currentTarget.value })}
          />
        </label>
        <label className="sheet-field">
          <span>API Key</span>
          <input
            type="password"
            value={draft.ai.apiKey}
            placeholder="sk-…"
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => editAI({ apiKey: event.currentTarget.value })}
          />
        </label>
        <p className="sheet-note">三项都填写后生效;密钥只保存在本机。</p>
      </div>

      <div className="appearance-group">
        <span className="group-label">
          数据
          <em className="group-tag">立即生效</em>
        </span>
        <div className="sheet-actions">
          <button className="sheet-action" disabled={busy} onClick={handleExport}>
            <Download size={16} />
            导出备份
          </button>
          <button className="sheet-action" disabled={busy} onClick={() => fileInputRef.current?.click()}>
            <UploadSimple size={16} />
            从文件恢复
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleFileChosen} />
        </div>
        {pendingFile ? (
          <div className="sheet-confirm">
            <p>恢复会覆盖当前全部数据:用「{pendingFile.name}」替换所有 DO 与记录。</p>
            <div className="sheet-confirm-actions">
              <button className="primary" disabled={busy} onClick={handleImportConfirm}>
                {busy ? '恢复中…' : '确认恢复'}
              </button>
              <button onClick={() => setPendingFile(null)}>取消</button>
            </div>
          </div>
        ) : (
          <p className={importNote ? `sheet-note${importNote.alert ? ' alert' : ''}` : 'sheet-note'}>
            {importNote ? importNote.text : '恢复会覆盖全部数据,建议先导出一份备份。'}
          </p>
        )}
        {exportNote && <p className="sheet-note">{exportNote}</p>}
      </div>
    </div>
  </motion.section>;
}
