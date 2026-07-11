/* 同高貼齊 — Miro Web SDK 面板邏輯
 *
 * 行為（已與需求確認）：
 *   目標高度 = 選取圖片高度的「中位數」
 *   垂直對齊 = 底端對齊
 *   排列順序 = 依目前畫面位置（由左到右）
 *   水平間距 = 面板可調，預設 0（貼齊相鄰）
 */

const $btn = document.getElementById('run');
const $gap = document.getElementById('gap');
const $status = document.getElementById('status');

function setStatus(msg, kind) {
  if (!$status) return;
  $status.textContent = msg;
  $status.className = 'status' + (kind ? ' ' + kind : '');
}

// 任何未捕捉錯誤都顯示在面板上，方便日後排查
window.addEventListener('error', (e) => setStatus('發生錯誤：' + e.message, 'err'));
window.addEventListener('unhandledrejection', (e) =>
  setStatus('發生錯誤：' + (e.reason && e.reason.message ? e.reason.message : e.reason), 'err'));

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function run() {
  setStatus('處理中…');
  $btn.disabled = true;

  try {
    if (typeof miro === 'undefined' || !miro.board) {
      setStatus('找不到 Miro，請重新打開面板再試。', 'err');
      return;
    }

    const gap = Math.max(0, Number($gap.value) || 0);

    const selection = await miro.board.getSelection();
    const images = selection.filter((i) => i.type === 'image');

    if (images.length < 2) {
      setStatus('請先複選 2 張以上的圖片。', 'err');
      return;
    }

    // 先擷取原始幾何（Miro 的 x/y 是物件中心點）
    const items = images.map((img) => ({
      img,
      x: img.x,
      y: img.y,
      w: img.width,
      h: img.height,
    }));

    // 依畫面位置由左到右排序（用中心 x）
    items.sort((a, b) => a.x - b.x);

    const targetH = median(items.map((it) => it.h));

    // 錨點＝最左那張：保留它現在的左緣與底緣，其他往它貼齊
    const anchor = items[0];
    const startLeft = anchor.x - anchor.w / 2;
    const bottomY = anchor.y + anchor.h / 2;

    let cursor = startLeft;
    for (const it of items) {
      const scale = targetH / it.h;
      const newW = it.w * scale;   // Miro 會等比例得到這個寬，這裡自己算來定位

      // Miro 圖片一次只能改寬或高其中一個（另一個等比例自動帶）。
      // 只設高，寬會自動變成 newW，畫質不變形。
      it.img.height = targetH;
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
} else {
  setStatus('找不到按鈕元素（id=run）', 'err');
}
