/**
 * 探针 v2：`.tab-pager` 能不能被"滚"，以及是哪种输入能滚。
 * v1 的基线用了 scrollLeft = 200，被 mandatory snap 立刻吸回 0 → 那张表证明不了任何事。
 * 这版：基线用整页宽度（430），并开 headless 必需的焦点模拟，且**滚动后立即采样**（不等吸附）。
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 9334;
const BASE = `http://127.0.0.1:${PORT}`;
const APP = 'http://localhost:4173/DO/';
const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

// 用**有窗口的普通 Chrome**，不用 --headless：
// headless 的输入管线是残缺的（滚轮/触摸都推不动容器），只有完整浏览器才能代表真机行为。
const HEADLESS = process.env.PROBE_HEADLESS === '1';
const chrome = spawn(CHROME, [
  ...(HEADLESS ? ['--headless=new'] : ['--window-size=460,960']),
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  `--user-data-dir=${join(tmpdir(), `do-probe2-${Date.now()}`)}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank',
], { stdio: 'ignore' });

async function waitTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`${BASE}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page;
    } catch { /* not up */ }
    await sleep(250);
  }
  throw new Error('no target');
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let seq = 0;
    const pending = new Map();
    const waiters = new Map();
    ws.onopen = () => resolve({ send, once, evaluate, close: () => ws.close() });
    ws.onerror = reject;
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && pending.has(m.id)) {
        const { res, rej } = pending.get(m.id);
        pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method && waiters.has(m.method)) {
        waiters.get(m.method).forEach((cb) => cb(m.params));
        waiters.delete(m.method);
      }
    };
    const send = (method, params = {}) => new Promise((res, rej) => {
      const id = ++seq;
      const timer = setTimeout(() => { pending.delete(id); rej(new Error(`TIMEOUT ${method}`)); }, 8000);
      pending.set(id, { res: (v) => { clearTimeout(timer); res(v); }, rej: (e) => { clearTimeout(timer); rej(e); } });
      ws.send(JSON.stringify({ id, method, params }));
    });
    const once = (method) => new Promise((res) => {
      const cbs = waiters.get(method) ?? [];
      cbs.push(res);
      waiters.set(method, cbs);
    });
    const evaluate = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300));
      return r.result.value;
    };
  });
}

const target = await waitTarget();
const { send, once, evaluate } = await connect(target.webSocketDebuggerUrl);

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
const loaded = once('Page.loadEventFired');
await send('Page.navigate', { url: APP });
await loaded;
await sleep(700);
await evaluate(`localStorage.setItem('do.settings', JSON.stringify({ theme:'system', background:'none', onboarded:true }))`);
const reloaded = once('Page.loadEventFired');
await send('Page.reload');
await reloaded;
await sleep(900);
await send('Page.bringToFront');

const shape = await evaluate(`(() => {
  const p = document.querySelector('.tab-pager');
  const r = p.getBoundingClientRect();
  return { scrollWidth: p.scrollWidth, clientWidth: p.clientWidth,
           rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
})()`);
const cx = Math.round(shape.rect.x + shape.rect.w / 2);
const cy = Math.round(shape.rect.y + shape.rect.h / 2);
console.log(`pager: scrollWidth=${shape.scrollWidth} clientWidth=${shape.clientWidth} rect=${JSON.stringify(shape.rect)}`);

const reset = () => evaluate(`(() => { document.querySelector('.tab-pager').scrollLeft = 0; return true; })()`);
const read = () => evaluate(`Math.round(document.querySelector('.tab-pager').scrollLeft)`);
const trace = async (n = 8, gap = 70) => {
  const out = [];
  for (let i = 0; i < n; i += 1) { out.push(await read()); await sleep(gap); }
  return out;
};

// A. 可滚性基线：设到整页宽度，mandatory snap 不会把它吸走
await reset(); await sleep(300);
await evaluate(`(() => { document.querySelector('.tab-pager').scrollLeft = 430; return true; })()`);
await sleep(400);
console.log(`A 程序化 scrollLeft=430 → ${await read()}   （期望 430，证明容器可滚）`);

// B. 滚轮
await reset(); await sleep(400);
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx, y: cy, deltaX: 400, deltaY: 0 });
console.log(`B wheel deltaX=+400 采样 → ${JSON.stringify(await trace())}`);

// C. 合成手势（mouse 源）
await reset(); await sleep(400);
(async () => { try { await send('Input.synthesizeScrollGesture', { x: cx, y: cy, xDistance: -430, yDistance: 0, gestureSourceType: 'mouse', speed: 2000 }); } catch (e) { console.log(`C 出错 ${e.message}`); } })();
console.log(`C synthesize(mouse, -430) 采样 → ${JSON.stringify(await trace())}`);

// D. 合成手势（touch 源）
await reset(); await sleep(400);
(async () => { try { await send('Input.synthesizeScrollGesture', { x: cx, y: cy, xDistance: -430, yDistance: 0, gestureSourceType: 'touch', speed: 2000 }); } catch (e) { console.log(`D 出错 ${e.message}`); } })();
console.log(`D synthesize(touch, -430) 采样 → ${JSON.stringify(await trace())}`);

// I. 页面本身能不能纵向滚？（能滚 = 手指的横向手势会被"页面滚动"这个更大的滚动目标抢走）
const pageScroll = await evaluate(`(() => {
  const se = document.scrollingElement;
  const frame = document.querySelector('.prototype-frame');
  const phone = document.querySelector('.phone-app');
  return {
    innerHeight: window.innerHeight,
    docScrollHeight: se.scrollHeight,
    docClientHeight: se.clientHeight,
    canScrollPage: se.scrollHeight > se.clientHeight,
    frameHeight: frame ? Math.round(frame.getBoundingClientRect().height) : null,
    phoneHeight: phone ? Math.round(phone.getBoundingClientRect().height) : null,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
  };
})()`);
console.log(`I 页面级滚动能力 → ${JSON.stringify(pageScroll)}`);

// F. 决定性对照：动态插入一个**最简**横向容器（同样的 overflow-x:auto），对它发同样的滚轮。
//    它滚 = 问题在 `.tab-pager` 自身（CSS / 结构）；它也不滚 = 问题在环境 / 事件分发。
await evaluate(`(() => {
  const d = document.createElement('div');
  d.id = 'probe-plain';
  d.style.cssText = 'position:fixed;left:0;top:0;width:200px;height:80px;overflow-x:auto;overflow-y:hidden;background:#000;z-index:99999';
  d.innerHTML = '<div style="width:800px;height:60px;background:#fff"></div>';
  document.body.appendChild(d);
  window.__plainLog = { wheel: 0, scroll: 0 };
  d.addEventListener('wheel', () => { window.__plainLog.wheel += 1; }, { passive: true });
  d.addEventListener('scroll', () => { window.__plainLog.scroll += 1; }, { passive: true });
  return true;
})()`);
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 100, y: 40, deltaX: 200, deltaY: 0 });
await sleep(500);
const plain = await evaluate(`({ ...window.__plainLog, scrollLeft: Math.round(document.getElementById('probe-plain').scrollLeft) })`);
console.log(`F 对照容器（最简 overflow-x:auto）wheel → ${JSON.stringify(plain)}`);

// G. 事件到底有没有到 `.tab-pager`？挂计数再发一次。
await evaluate(`(() => {
  window.__pagerLog = { wheel: 0, scroll: 0 };
  const p = document.querySelector('.tab-pager');
  p.addEventListener('wheel', () => { window.__pagerLog.wheel += 1; }, { passive: true });
  p.addEventListener('scroll', () => { window.__pagerLog.scroll += 1; }, { passive: true });
  return true;
})()`);
await evaluate(`(() => { document.querySelector('.tab-pager').scrollLeft = 0; return true; })()`);
await sleep(400);
await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: cx, y: cy, deltaX: 400, deltaY: 0 });
await sleep(500);
const pagerLog = await evaluate(`({ ...window.__pagerLog, scrollLeft: Math.round(document.querySelector('.tab-pager').scrollLeft) })`);
console.log(`G 对 .tab-pager 发 wheel → ${JSON.stringify(pagerLog)}   （wheel=0 表示事件没到它身上）`);

// H. 同样坐标，看 hit-test 命中的是谁
const hit = await evaluate(`(() => {
  const el = document.elementFromPoint(${cx}, ${cy});
  const chain = [];
  let n = el;
  while (n && chain.length < 5) { chain.push(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/)[0] : '')); n = n.parentElement; }
  return chain.join(' ← ');
})()`);
console.log(`H (${cx},${cy}) 命中链 → ${hit}`);

// E. 触摸模拟 + 逐帧鼠标拖拽：**刻意不跑**。
// 2026-09-22 实测：`Input.dispatchMouseEvent` 在 headless 下会**超时不返回**
// （它的语义是"发送并等待事件被处理"，而触摸拖拽的手势周期永不结束），
// 会让整个脚本挂住好几分钟 —— 看起来就像"卡死"。结论已记入
// `.sdlc/changes/v2-device-feedback/test.md`，要复试请自行加更短的超时。

close_browser();
function close_browser() {
  try { chrome.kill(); } catch { /* ignore */ }
  spawn('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
}
