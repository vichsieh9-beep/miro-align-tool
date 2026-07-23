/* 同高貼齊 — 共用核心邏輯
 *
 * index.html（一鍵直跑）與 panel.html（app.js）共用同一份，
 * 行為改這裡，兩邊同時生效。
 *
 * 行為（已與需求確認，2026-07-23）：
 *   目標高度 = 固定 1024px
 *   排列順序 = 依目前畫面位置（由左到右）
 *   分排規則 = 每排最多 8 張，第 9 張起自動換到下一排
 *   垂直對齊 = 每排內底端對齊
 *   水平／垂直間距 = 呼叫端傳入同一個 gap（面板可調；一鍵直跑固定 0）
 */

const ALIGN_TARGET_HEIGHT = 1024;
const ALIGN_ITEMS_PER_ROW = 8;

async function alignImagesSameHeight(images, gap) {
  // 先擷取原始幾何（Miro 的 x/y 是物件中心點）
  const items = images.map((img) => ({
    img,
    x: img.x,
    y: img.y,
    w: img.width,
    h: img.height,
  }));

  // 依畫面位置由左到右排序（用中心 x），再依此順序每 8 張切一排
  items.sort((a, b) => a.x - b.x);

  const targetH = ALIGN_TARGET_HEIGHT;

  // 錨點＝整體最左那張：它現在的左緣／底緣＝整個網格的起點
  const anchor = items[0];
  const startLeft = anchor.x - anchor.w / 2;
  const firstRowBottomY = anchor.y + anchor.h / 2;

  let rowCount = 0;
  for (let i = 0; i < items.length; i += ALIGN_ITEMS_PER_ROW) {
    const row = items.slice(i, i + ALIGN_ITEMS_PER_ROW);
    const rowIndex = i / ALIGN_ITEMS_PER_ROW;
    const bottomY = firstRowBottomY + rowIndex * (targetH + gap);

    let cursor = startLeft;
    for (const it of row) {
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
    rowCount++;
  }

  return { count: items.length, targetH, rows: rowCount };
}
