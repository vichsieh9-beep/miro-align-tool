# 同高貼齊（Miro 小工具）

複選多張圖片，一鍵：**統一成中位數高度 → 依畫面位置由左到右、底端對齊、貼齊相鄰**。

只影響圖片，其他物件（文字、便利貼、框）會被略過；圖片等比例縮放不變形。

---

## 檔案

| 檔案 | 作用 |
|---|---|
| `index.html` | App 的 SDK 進入點（背景載入，負責「點圖示 → 開面板」） |
| `panel.html` | 點開後的面板 UI（按鈕、間距輸入） |
| `app.js` | 對選取圖片做同高＋貼齊的邏輯 |

---

## 一次性設定（約 5 分鐘）

### 1. 建立 Miro App
1. 到 <https://miro.com/app/settings/user-profile/apps>（或你的團隊 → **Profile settings → Your apps**）。
2. **Create new app** → 取名（例：`同高貼齊`）→ 選你的團隊 → Create。

### 2. 開權限（Permissions）
在 App 設定頁 **Permissions** 勾選：
- `boards:read`
- `boards:write`

### 3. 設定 Web SDK URL
在 **App URL / SDK URL** 欄位填入 `index.html` 的網址（見下方「怎麼放上網」）。
在 **App icon / Configure toolbar** 開啟工具列圖示，讓 App 出現在白板左側工具列。

### 4. 安裝到團隊
**Install app and get OAuth token** → 選團隊 → 安裝。

之後打開任何白板，左側工具列就會有這個 App 圖示。

---

## 怎麼放上網（index.html 要有網址）

Miro 只吃 **https**（或 `http://localhost`）。二選一：

### 方案 A：本機測試（最快，只有這台電腦能用）
```bash
cd /Users/hsiehkailin/dev/Temp-Project/miro-align-tool
npx serve -l 3000
```
SDK URL 填：`http://localhost:3000/index.html`
（要用工具時這個指令得開著。）

### 方案 B：GitHub Pages（永久網址，推薦長期用）
把這個資料夾推到一個 GitHub repo → repo **Settings → Pages** → 選 branch `main` / 根目錄 → 存檔。
SDK URL 填 GitHub 給的網址，例如：
`https://<你的帳號>.github.io/<repo>/index.html`

> 純靜態、無需 build，兩種方案都直接可用。

---

## 使用方式

1. 在白板上複選多張圖片。
2. 點左側工具列的「同高貼齊」App 圖示 → 面板打開。
3. （可選）改一下「圖與圖間距」，預設 0＝完全貼齊。
4. 按 **同高 + 貼齊**。

---

## 想改行為？

都在 `app.js`：
- **改對齊方式**（現在是底端 `it.img.y = bottomY - targetH / 2`）：
  置中改成 `it.img.y = anchor.y`；頂端改成先算 `const topY = anchor.y - anchor.h / 2`，再 `it.img.y = topY + targetH / 2`。
- **改目標高度**（現在是中位數）：換掉 `median(...)`，例如最高 `Math.max(...)`、固定值 `300`。
- **改排序**（現在依畫面位置）：拿掉 `items.sort(...)` 就會用選取順序。
