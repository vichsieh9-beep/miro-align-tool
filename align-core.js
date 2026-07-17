/* 同高貼齊 — 共用核心邏輯
 *
 * index.html（一鍵直跑）與 panel.html（app.js）共用同一份，
 * 行為改這裡，兩邊同時生效。
 *
 * 行為（已與需求確認）：
 *   目標高度 = 選取圖片高度的「中位數」
 *   垂直對齊 = 底端對齊
 *   排列順序 = 依目前畫面位置（由左到右）
 *   水平間距 = 呼叫端傳入（面板可調；一鍵直跑固定 0）
 */

async function alignImagesSameHeight(images, gap) {
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

  const heights = items.map((it) => it.h).sort((a, b) => a - b);
  const mid = Math.floor(heights.length / 2);
  const targetH = heights.length % 2 ? heights[mid] : (heights[mid - 1] + heights[mid]) / 2;

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

  return { count: items.length, targetH };
}
