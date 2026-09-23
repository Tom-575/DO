#!/usr/bin/env node
/**
 * 桌面复核脚本：一次跑完 change `v2-device-feedback`（#42 / #43 / #44）与
 * `v2-usage-refinement`（#46 / #47 / #48）的全部断言，外加两轮之间的回归。
 *
 * 用法：
 *   npm run verify                 # 自动复用/启动 dev server，跑完自动收摊
 *   APP_URL=http://localhost:5173/ npm run verify
 *   CHROME_PATH=/path/to/chrome npm run verify
 *
 * 做法：headless Chrome + CDP（`--remote-debugging-port`），只依赖 Node 22+ 自带的
 * fetch / WebSocket，不引入任何第三方包。DOM 交互一律用真实 `element.click()`，
 * 走 React 事件委托；截图落在 .sdlc/evidence/v2-device-feedback/。
 *
 * 局限（见 .sdlc/changes/v2-device-feedback/test.md）：它验证的是「手势来源不再被程序化
 * 滚动打断」这条逻辑路径，**不等于真机手指拖拽**；真机确认仍需人工。
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(HERE, '..');
const REPO_ROOT = join(PKG_ROOT, '..', '..');
// 截图归属哪个 change 的证据目录由 EVIDENCE_DIR 指定（默认 v2-device-feedback，脚本最初的落点）
const EVIDENCE = join(REPO_ROOT, '.sdlc', 'evidence', process.env.EVIDENCE_DIR ?? 'v2-device-feedback');
const APP = process.env.APP_URL ?? 'http://localhost:4173/DO/';
const IS_WIN = process.platform === 'win32';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  —  ${detail}` : ''}`);
};

async function reachable(url, timeoutMs = 1500) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return true;
  } catch {
    return false;
  }
}

/** dev server 没起就自己起一个；返回 null 表示复用了已有的 */
async function ensureServer() {
  if (await reachable(APP)) {
    console.log(`· 复用已在运行的 dev server：${APP}`);
    return null;
  }
  console.log('· dev server 未运行，正在启动 vite（npm run prototype）…');
  const child = spawn(IS_WIN ? 'npm.cmd' : 'npm', ['run', 'prototype'], {
    cwd: PKG_ROOT,
    stdio: 'ignore',
    shell: IS_WIN,
  });
  for (let i = 0; i < 60; i += 1) {
    await sleep(500);
    if (await reachable(APP)) return child;
  }
  child.kill();
  throw new Error('vite 启动超时（60s）；请手动执行 npm run prototype 后重试');
}

function stopServer(child) {
  if (!child) return;
  if (IS_WIN) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!hit) {
    throw new Error(
      `找不到 Chrome / Edge；请设置 CHROME_PATH 环境变量。已尝试：\n  ${CHROME_CANDIDATES.join('\n  ')}`,
    );
  }
  return hit;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function waitForTarget(base) {
  for (let i = 0; i < 80; i += 1) {
    try {
      const list = await (await fetch(`${base}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      /* 浏览器还没起来 */
    }
    await sleep(250);
  }
  throw new Error('CDP 目标未就绪');
}

function connect(wsUrl, onEvent) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let seq = 0;
    const pending = new Map();
    const waiters = new Map();
    ws.onopen = () => resolve({ send, once, evaluate, close: () => ws.close() });
    ws.onerror = (err) => reject(err instanceof Error ? err : new Error('WebSocket 连接失败'));
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: res, reject: rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
        return;
      }
      if (msg.method) {
        onEvent?.(msg);
        const cbs = waiters.get(msg.method);
        if (cbs) {
          waiters.delete(msg.method);
          cbs.forEach((cb) => cb(msg.params));
        }
      }
    };
    // 每个 CDP 命令都带超时：某些输入事件（尤其触摸/拖拽）在 headless 下可能永远不返回，
    // 没有超时的话整个脚本会**静默挂死**——2026-09-22 实测踩到（加了一整段触摸实验，
    // 结果 `Input.dispatchMouseEvent` 不返回，看起来像"卡住"）。
    const CDP_TIMEOUT_MS = 15_000;
    const send = (method, params = {}) =>
      new Promise((res, rej) => {
        const id = ++seq;
        const timer = setTimeout(() => {
          pending.delete(id);
          rej(new Error(`CDP timeout: ${method} (>${CDP_TIMEOUT_MS}ms)`));
        }, CDP_TIMEOUT_MS);
        pending.set(id, {
          resolve: (value) => { clearTimeout(timer); res(value); },
          reject: (err) => { clearTimeout(timer); rej(err); },
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const once = (method) =>
      new Promise((res) => {
        const cbs = waiters.get(method) ?? [];
        cbs.push(res);
        waiters.set(method, cbs);
      });
    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(`页面里求值失败: ${JSON.stringify(r.exceptionDetails).slice(0, 400)}`);
      return r.result.value;
    }
  });
}

async function main() {
  const server = await ensureServer();
  const chromePath = findChrome();
  const port = await freePort();
  const profile = join(tmpdir(), `do-verify-${Date.now()}`);
  const base = `http://127.0.0.1:${port}`;
  const exceptions = [];

  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--remote-allow-origins=*',
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  mkdirSync(EVIDENCE, { recursive: true });
  let client;
  try {
    const target = await waitForTarget(base);
    client = await connect(target.webSocketDebuggerUrl, (msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails?.text ?? 'unknown');
      }
    });
    const { send, once, evaluate } = client;
    const shot = async (name) => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(EVIDENCE, name), Buffer.from(r.data, 'base64'));
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });

    // 0. 诊断面板必须真的挂上（`?debug=swipe`）——它存在的唯一目的就是定位横滑，
    //    要是"部署了但没生效"，那比没有更糟（会让人以为页面没问题）。这条同时能验线上。
    const debugLoaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: `${APP}?debug=swipe` });
    await debugLoaded;
    await sleep(800);
    const debugProbe = await evaluate(`(() => ({
      panel: Boolean(document.querySelector('.swipe-debug')),
      snapshot: document.querySelector('.swipe-debug-snapshot')?.textContent ?? '',
    }))()`);
    check('?debug=swipe 挂出诊断面板', debugProbe.panel === true, debugProbe.snapshot.slice(0, 80));

    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: APP });
    await loaded;
    await sleep(500);

    // 造数据：跳过出发页 + 一条「待记录」的 DO
    await evaluate(`(async () => {
      localStorage.setItem('do.settings', JSON.stringify({ theme: 'system', background: 'none', onboarded: true }));
      await new Promise((resolve, reject) => {
        const req = indexedDB.open('keyval-store');
        req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('keyval')) req.result.createObjectStore('keyval'); };
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('keyval', 'readwrite');
          tx.objectStore('keyval').put([{
            id: 'do-1', thought: '跑步 10 分钟',
            action: { title: '下楼慢跑 10 分钟', time: '10 MIN', stop: '跑完 10 分钟就回来' },
            status: '待记录', intent: '愿意去做', createdAt: Date.now(),
          }], 'do.dos');
          tx.oncomplete = () => { db.close(); resolve(true); };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
      return true;
    })()`);

    const reloaded = once('Page.loadEventFired');
    await send('Page.reload');
    await reloaded;
    await sleep(800);

    console.log('\n— #44 念头卡去示例 chip —');
    const home = await evaluate(`(() => ({
      hasChips: Boolean(document.querySelector('.idea-chips')),
      hasInput: Boolean(document.querySelector('.idea-input')),
      hasGo: Boolean(document.querySelector('.idea-go')),
      hasDoCard: Boolean(document.querySelector('.do-card')),
      slides: document.querySelectorAll('.tab-slide').length,
      overflowX: getComputedStyle(document.querySelector('.tab-pager')).overflowX,
      touchAction: getComputedStyle(document.querySelector('.tab-pager')).touchAction,
    }))()`);
    check('#44 首页不存在 .idea-chips', home.hasChips === false, JSON.stringify(home));
    check('输入框与「DO」入口仍在', home.hasInput && home.hasGo && home.hasDoCard);
    check('分页器两页 + 位移交给 transform（不再用原生横向滚动）', home.slides === 2 && home.overflowX === 'hidden' && home.touchAction === 'pan-y', `overflowX=${home.overflowX} touch-action=${home.touchAction}`);
    await shot('01-today-no-chips.png');

    console.log('\n— #43 分页：pointer 手势跟手 + 翻页 —');
    await evaluate(`(() => {
      window.__scrollToCalls = 0;
      const orig = Element.prototype.scrollTo;
      Element.prototype.scrollTo = function (...args) { window.__scrollToCalls += 1; return orig.apply(this, args); };
      window.__inputPageSeen = 0;
      new MutationObserver(() => { window.__inputPageSeen = Math.max(window.__inputPageSeen, document.querySelectorAll('.input-page').length); })
        .observe(document.body, { childList: true, subtree: true });
      return true;
    })()`);

    // 横滑已改成 pointer 手势驱动（不再用原生 overflow-x 滚动）。好处之一是**这条终于能被真正验证**：
    // CDP 派发得了 pointer / mouse，派发不了滚动（探针证明过，连最简对照容器都推不动）。
    const pagerBox = await evaluate(`(() => { const p = document.querySelector('.tab-pager'); const r = p.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
    const dragY = Math.round(pagerBox.y + pagerBox.h * 0.5);
    const dragFrom = Math.round(pagerBox.x + pagerBox.w - 60);
    const dragTo = Math.round(pagerBox.x + 60);
    const transformOf = () => evaluate(`getComputedStyle(document.querySelector('.tab-pager')).transform`);

    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dragFrom, y: dragY, button: 'left', clickCount: 1 });
    const during = [];
    for (let step = 1; step <= 8; step += 1) {
      const x = Math.round(dragFrom + ((dragTo - dragFrom) * step) / 8);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y: dragY, button: 'left' });
      await sleep(25);
      during.push(await transformOf());
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dragTo, y: dragY, button: 'left', clickCount: 1 });
    await sleep(700);
    const swiped = await evaluate(`(() => ({
      transform: getComputedStyle(document.querySelector('.tab-pager')).transform,
      inert: [...document.querySelectorAll('.tab-slide')].map((s) => s.inert),
      selected: [...document.querySelectorAll('.tab-bar button')].findIndex((b) => b.classList.contains('selected')),
    }))()`);
    check('#43 拖动中容器跟着手指位移', new Set(during).size >= 4, `${during.length} 次采样 → ${new Set(during).size} 种 transform`);
    check('#43 越过阈值松手后翻到痕迹页', swiped.inert[0] === true && swiped.inert[1] === false, `inert=${JSON.stringify(swiped.inert)}`);
    check('#43 指示胶囊跟到痕迹槽', swiped.selected === 2, `selected=${swiped.selected}`);
    await shot('02-swipe-traces.png');

    // 位移不够 → 回弹，不翻页
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: dragFrom, y: dragY, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: dragFrom - 26, y: dragY, button: 'left' });
    await sleep(60);
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: dragFrom - 26, y: dragY, button: 'left', clickCount: 1 });
    await sleep(650);
    const bounced = await evaluate(`[...document.querySelectorAll('.tab-slide')].map((s) => s.inert)`);
    check('#43 位移不足则回弹（仍停在痕迹页）', bounced[0] === true, `inert=${JSON.stringify(bounced)}`);

    // 轴向锁定：竖向拖拽不该被横向接管
    const vx = Math.round(pagerBox.x + pagerBox.w / 2);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: vx, y: Math.round(pagerBox.y + 140), button: 'left', clickCount: 1 });
    for (let step = 1; step <= 6; step += 1) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: vx + 5, y: Math.round(pagerBox.y + 140 - step * 14), button: 'left' });
      await sleep(20);
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: vx + 5, y: Math.round(pagerBox.y + 56), button: 'left', clickCount: 1 });
    await sleep(650);
    const vertical = await evaluate(`[...document.querySelectorAll('.tab-slide')].map((s) => s.inert)`);
    check('#43 竖向拖拽不会误翻页（轴向锁定生效）', vertical[0] === true, `inert=${JSON.stringify(vertical)}`);

    console.log('\n— #43c 点 Tab 直接归位 —');
    await evaluate(`(() => { document.querySelectorAll('.tab-bar button')[0].click(); return true; })()`);
    await sleep(900);
    const clickTab = await evaluate(`(() => ({
      inert: [...document.querySelectorAll('.tab-slide')].map((s) => s.inert),
      scrollToCalls: window.__scrollToCalls,
    }))()`);
    check('#43c 点「今天」回到第一页', clickTab.inert[0] === false && clickTab.inert[1] === true, JSON.stringify(clickTab));

    console.log('\n— #42 第一步页返回 —');
    await evaluate(`(() => { document.querySelector('.do-card').click(); return true; })()`);
    await sleep(700);
    const step = await evaluate(`(() => ({
      hasAction: Boolean(document.querySelector('.action-page')),
      figure: document.querySelector('.action-figure')?.textContent ?? null,
    }))()`);
    check('「正在进行」卡进入第一步页', step.hasAction && /^\d+MIN$/.test(step.figure ?? ''), JSON.stringify(step));
    await shot('03-step-edit.png');

    const beforeBack = await evaluate('window.__scrollToCalls');
    await evaluate(`(() => { document.querySelector('.action-page .icon-action').click(); return true; })()`);
    await sleep(1200);
    const back = await evaluate(`(() => ({
      hasPushLayer: Boolean(document.querySelector('.push-layer')),
      inputSeen: window.__inputPageSeen,
      ideaValue: document.querySelector('.idea-input')?.value ?? null,
      scrollDelta: window.__scrollToCalls - ${beforeBack},
    }))()`);
    check('返回后落到今天页（无 push 层）', back.hasPushLayer === false, JSON.stringify(back));
    check('返回过程中从未渲染对话页（修改前必然失败）', back.inputSeen === 0, `inputPageSeen=${back.inputSeen}`);
    check('返回后念头已清空', back.ideaValue === '', `idea="${back.ideaValue}"`);
    check('返回不触发程序化滚动', back.scrollDelta === 0);
    check('等待 1.2s 后仍停在今天页（无「返回 → 弹回」循环）', back.hasPushLayer === false);
    await shot('04-back-home.png');

    console.log('\n— #46 没配 AI 时点 DO 直达第一步页 —');
    // 上一段结束时已经在今天页（#42 的返回落了地），这里直接写念头
    const typed = await evaluate(`(() => {
      const box = document.querySelector('.idea-input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(box, '跑步 10 分钟');
      box.dispatchEvent(new Event('input', { bubbles: true }));
      return box.value;
    })()`);
    check('#46 念头已写进首页黑卡', typed === '跑步 10 分钟', `value="${typed}"`);
    const goLabel = await evaluate(`document.querySelector('.idea-go').textContent.trim()`);
    check('#46 入口文案为「DO」', goLabel === 'DO', `label="${goLabel}"`);
    await evaluate(`(() => { document.querySelector('.idea-go').click(); return true; })()`);
    await sleep(800);
    const direct = await evaluate(`(() => ({
      hasAction: Boolean(document.querySelector('.action-page')),
      inputSeen: window.__inputPageSeen,
      figure: document.querySelector('.action-figure')?.textContent ?? null,
    }))()`);
    check('#46 无 AI 配置下直达第一步页（对话页从未出现）', direct.hasAction && direct.inputSeen === 0, JSON.stringify(direct));
    await shot('05-do-direct-step.png');

    console.log('\n— #48 时长档位 5 / 15 / 自定义 —');
    const options = await evaluate(`(() => {
      const items = [...document.querySelectorAll('.duration-option')];
      return {
        count: items.length,
        labels: items.map((o) => o.textContent.replace(/\\s+/g, '')),
        selected: items.filter((o) => o.classList.contains('selected')).length,
        figure: document.querySelector('.action-figure')?.textContent ?? null,
      };
    })()`);
    check('#48 三档 = 5 / 15 / 自定义', options.count === 3 && options.labels[0] === '5分钟' && options.labels[1] === '15分钟' && options.labels[2] === '自定义', JSON.stringify(options.labels));
    check('#48 恰有一个档位选中（AI 的 10 分钟吸附到 15）', options.selected === 1 && options.figure === '15MIN', JSON.stringify(options));
    check('#48 不出现 HR 半格单位', !(options.figure ?? '').includes('HR'), `figure=${options.figure}`);

    await evaluate(`(() => { document.querySelector('.duration-option-custom').click(); return true; })()`);
    await sleep(400);
    const customOpen = await evaluate(`(() => ({
      hasInput: Boolean(document.querySelector('.duration-custom input')),
      max: document.querySelector('.duration-custom input')?.getAttribute('max') ?? null,
    }))()`);
    check('#48 自定义就地展开输入（上限 90）', customOpen.hasInput && customOpen.max === '90', JSON.stringify(customOpen));

    await evaluate(`(() => {
      const input = document.querySelector('.duration-custom input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '25');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(200);
    await evaluate(`(() => { document.querySelector('.duration-custom-confirm').click(); return true; })()`);
    await sleep(500);
    const custom = await evaluate(`(() => ({
      figure: document.querySelector('.action-figure')?.textContent ?? null,
      customSelected: document.querySelector('.duration-option-custom')?.classList.contains('selected') ?? false,
      selectedCount: [...document.querySelectorAll('.duration-option')].filter((o) => o.classList.contains('selected')).length,
      inputGone: !document.querySelector('.duration-custom'),
    }))()`);
    check('#48 自定义 25 生效、收起、仍只选中一档', custom.figure === '25MIN' && custom.customSelected && custom.selectedCount === 1 && custom.inputGone, JSON.stringify(custom));
    await shot('06-duration-custom.png');

    // 越界夹取：200 → 90（plan 的判据写了「超出被夹到边界」，必须有断言兜住）
    await evaluate(`(() => { document.querySelector('.duration-option-custom').click(); return true; })()`);
    await sleep(400);
    await evaluate(`(() => {
      const input = document.querySelector('.duration-custom input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '200');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(200);
    await evaluate(`(() => { document.querySelector('.duration-custom-confirm').click(); return true; })()`);
    await sleep(500);
    const clamped = await evaluate(`document.querySelector('.action-figure')?.textContent ?? null`);
    check('#48 越界输入 200 被夹到 90', clamped === '90MIN', `figure=${clamped}`);

    console.log('\n— #47 记录页关联入口独立成行 —');
    await evaluate(`(() => { document.querySelector('.action-page .icon-action').click(); return true; })()`);
    await sleep(900);
    await evaluate(`(() => { document.querySelectorAll('.tab-bar button')[1].click(); return true; })()`);
    await sleep(800);
    const record = await evaluate(`(() => {
      const link = document.querySelector('.record-link');
      const chips = [...document.querySelectorAll('.record-chip')];
      return {
        hasLinkRow: Boolean(link),
        linked: link?.classList.contains('linked') ?? false,
        linkText: link?.textContent.trim() ?? null,
        chips: chips.map((c) => c.textContent.trim().replace(/\\s+/g, '')),
        chipHasLink: chips.some((c) => c.textContent.includes('关联一个念头')),
      };
    })()`);
    check('#47 关联入口独立成行（已关联时显示念头原文）', record.hasLinkRow && record.linked && record.linkText === '跑步 10 分钟', JSON.stringify(record.linkText));
    check('#47 工具行不再含关联（只剩 3 颗）', record.chipHasLink === false && record.chips.length === 3, JSON.stringify(record.chips));
    await evaluate(`(() => { document.querySelector('.record-link').click(); return true; })()`);
    await sleep(500);
    check('#47 候选列表跟随入口就地展开', (await evaluate(`Boolean(document.querySelector('.record-picker'))`)) === true);
    await shot('07-record-link.png');

    console.log('\n— #46 反向：配了 AI 时仍走对话页 —');
    await evaluate(`localStorage.setItem('do.settings', JSON.stringify({ theme: 'system', background: 'none', onboarded: true, ai: { baseURL: 'http://127.0.0.1:9/v1', model: 'test', apiKey: 'test' } }))`);
    const withAIReload = once('Page.loadEventFired');
    await send('Page.reload');
    await withAIReload;
    await sleep(800);
    // reload 会把页面里挂的 MutationObserver 一起清掉，这里重新挂一次再点
    await evaluate(`(() => {
      window.__inputPageSeen = 0;
      new MutationObserver(() => { window.__inputPageSeen = Math.max(window.__inputPageSeen, document.querySelectorAll('.input-page').length); })
        .observe(document.body, { childList: true, subtree: true });
      const box = document.querySelector('.idea-input');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(box, '跑步 10 分钟');
      box.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(200);
    await evaluate(`(() => { document.querySelector('.idea-go').click(); return true; })()`);
    await sleep(900);
    const withAI = await evaluate(`window.__inputPageSeen`);
    check('#46 配了 AI 时仍进对话页（对话页出现过）', withAI >= 1, `inputPageSeen=${withAI}`);

    check('页面无未捕获异常', exceptions.length === 0, exceptions.join(' | '));
  } finally {
    client?.close();
    chrome.kill();
    await sleep(500);
    if (IS_WIN) spawn('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* 句柄未释放就留给系统清理 */ }
    stopServer(server);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  console.log(`截图：${EVIDENCE}`);
  if (failed.length) {
    console.log(`FAILED: ${failed.map((f) => f.name).join(' | ')}`);
    process.exitCode = 1;
  }
  console.log('\n提醒：以上是桌面模拟断言，真机（iOS Safari / 安卓 Chrome）的手指拖拽仍需人工确认。');
}

main().catch((err) => {
  console.error(`\n验证脚本失败：${err.message}`);
  process.exitCode = 1;
});
