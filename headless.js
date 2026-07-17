/* 同高貼齊 — 背景（headless）邏輯，由 index.html 以時間戳載入
 *
 * 兩個免面板入口：
 *   1. 右鍵選單：選取 ≥2 張圖片 → 右鍵（或「⋯」）→「同高貼齊」→ 直接執行
 *   2. 工具列圖示：選取 ≥2 張圖片時點圖示 → 直接執行；選取不足才開面板
 * 兩者都固定間距 0；要調間距走面板（什麼都不選再點圖示）。
 */

(async () => {
  // 共用核心（幾何邏輯）同樣加時間戳，避開 GitHub Pages 快取
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'align-core.js?cb=' + Date.now();
    s.onload = resolve;
    s.onerror = () => reject(new Error('align-core.js 載入失敗'));
    document.body.appendChild(s);
  });

  async function runOnImages(images) {
    if (images.length < 2) {
      await miro.board.notifications.showError('同高貼齊：請先複選 2 張以上的圖片。');
      return;
    }
    const r = await alignImagesSameHeight(images, 0);
    await miro.board.notifications.showInfo(
      '同高貼齊完成：' + r.count + ' 張圖已統一為 ' + Math.round(r.targetH) + 'px 高。'
    );
  }

  function notifyError(e) {
    return miro.board.notifications.showError(
      '同高貼齊失敗：' + (e && e.message ? e.message : String(e))
    );
  }

  // ── 入口 1：右鍵選單（custom action，experimental API）────────────────
  await miro.board.ui.on('custom:same-height-align', async (payload) => {
    try {
      // 文件說 payload＝選取項陣列；部分版本包成 {items}，兩種都接
      const items = Array.isArray(payload) ? payload : (payload && payload.items) || [];
      await runOnImages(items.filter((i) => i.type === 'image'));
    } catch (e) {
      await notifyError(e);
    }
  });

  // icon 只吃官方預定義名稱，但文件沒列清單——由候選逐一嘗試，全滅也不影響其他入口
  const iconCandidates = ['align-bottom', 'align-horizontal', 'layout-grid', 'grid', 'chat-two'];
  for (const icon of iconCandidates) {
    try {
      await miro.board.experimental.action.register({
        event: 'same-height-align',
        ui: {
          label: { en: '同高貼齊' },
          icon: icon,
          description: { en: '統一成中位數高度、底端對齊、貼齊相鄰' },
        },
        scope: 'local',
        predicate: { type: 'image' },
        contexts: { item: {} },
        selection: 'multi',
      });
      break;
    } catch (e) {
      if (icon === iconCandidates[iconCandidates.length - 1]) {
        console.warn('同高貼齊：custom action 註冊失敗（右鍵選單不可用）', e);
      }
    }
  }

  // ── 入口 2：工具列圖示一鍵直跑 ──────────────────────────────────────
  miro.board.ui.on('icon:click', async () => {
    try {
      const selection = await miro.board.getSelection();
      const images = selection.filter((i) => i.type === 'image');

      if (images.length < 2) {
        // 沒選夠圖＝當作要看說明/調間距，走原本的面板
        await miro.board.ui.openPanel({ url: 'panel.html?cb=' + Date.now() });
        return;
      }
      await runOnImages(images);
    } catch (e) {
      await notifyError(e);
    }
  });
})().catch((e) => console.error('同高貼齊 headless 初始化失敗', e));
