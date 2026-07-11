/* 同高貼齊 — Miro Web SDK 面板邏輯
 *
 * 行為（已與需求確認）：
 *   目標高度 = 選取圖片高度的「中位數」
 *   垂直對齊 = 底端對齊
 *   排列順序 = 依目前畫面位置（由左到右）
 *   水平間距 = 面板可調，預設 0（貼齊相鄰）
 */

const VERSION = 'v3';
const $btn = document.getElementById('run');
const $gap = document.getElementById('gap');
const $status = document.getElementById('status');

function setStatus(msg, kind) {
  if (!$status) return;
  $status.textContent = msg;
  $status.className = 'status' + (kind ? ' ' + kind : '');
}

// 任何未捕捉錯誤都顯示在面板上，方便診斷
window.addEventListener('error', (e) => setStatus('JS 錯誤：' + e.message, 'err'));
window.addEventListener('unhandledrejection', (e) =>
  setStatus('Promise 錯誤：' + (e.reason && e.reason.message ? e.reason.message : e.reason), 'err'));

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function run() {
  setStatus('開始…（' + VERSION + '）');
  $btn.disabled = true;

  try {
    if (typeof miro === 'undefined' || !miro.board) {
      setStatus('找不到 Miro SDK（miro 未定義）', 'err');
      return;
    }

    const gap = Math.max(0, Number($gap.value) || 0);

    const selection = await miro.board.getSelection();
    setStatus('選取 ' + selection.length + ' 個物件…');

    const images = selection.filter((i) => i.type === 'image');

    if (images.length < 2) {
      setStatus('請先複選 2 張以上的圖片（目前圖片 ' + images.length + '）。', 'err');
      return;
    }

    const items = images.map((img) => ({
      img,
      x: img.x,
      y: img.y,
      w: img.width,
      h: img.height,
    }));

    items.sort((a, b) => a.x - b.x);

    const targetH = median(items.map((it) => it.h));

    const anchor = items[0];
    const startLeft = anchor.x - anchor.w / 2;
    const bottomY = anchor.y + anchor.h / 2;

    let cursor = startLeft;
    for (const it of items) {
      const scale = targetH / it.h;
      const newW = it.w * scale;

      it.img.height = targetH;   // 先設高（圖片會等比例帶動寬）
      it.img.width = newW;       // 再對齊寬（同 scale，值一致）
      it.img.x = cursor + newW / 2;
      it.img.y = bottomY - targetH / 2;   // 底端對齊

      await it.img.sync();
      cursor += newW + gap;
    }

    setStatus('完成：' + items.length + ' 張圖已統一為 ' + Math.round(targetH) + 'px 高並貼齊。', 'ok');
  } catch (e) {
    setStatus('執行失敗：' + (e && e.message ? e.message : String(e)), 'err');
  } finally {
    $btn.disabled = false;
  }
}

if ($btn) {
  $btn.addEventListener('click', run);
  setStatus('已載入 ' + VERSION + '，請複選圖片後按按鈕。', 'ok');
} else {
  setStatus('找不到按鈕元素（id=run）', 'err');
}
