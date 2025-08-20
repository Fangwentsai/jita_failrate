# 各斗篷Fail Rate 視覺化圖表

這是一個基於Google Sheets數據的互動式視覺化應用程式，用於分析和展示各斗篷的Fail Rate數據。

## 功能特色

- 📊 **互動式折線圖**：使用Chart.js繪製美觀的折線圖
- 🔍 **多維度篩選**：按日期範圍、斗篷類型、指標類型進行篩選
- 📈 **即時統計**：顯示平均、最高、最低Fail Rate和總流量
- 📋 **詳細數據表**：可滾動的數據表格，支援顏色編碼
- 📱 **響應式設計**：支援桌面和移動設備
- 🎨 **現代化UI**：美觀的漸變背景和卡片式設計

## 檔案結構

```
jita_failrate/
├── index.html          # 主要HTML文件
├── styles.css          # CSS樣式文件
├── script.js           # JavaScript邏輯文件
├── app.py              # Flask後端API
├── requirements.txt    # Python依賴文件
└── README.md           # 說明文件
```

## 使用方法

### 1. 安裝Python依賴

```bash
pip install -r requirements.txt
```

### 2. 啟動後端API服務

```bash
python app.py
```

後端API將運行在 `http://localhost:5001`

### 3. 啟動前端服務

```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server

# 或使用PHP
php -S localhost:8000
```

### 4. 訪問應用程式

在瀏覽器中訪問 `http://localhost:8001`

**注意**：前端和後端需要同時運行才能正常使用。

## 控制選項

### 日期範圍篩選
- **全部日期**：顯示所有數據
- **最近30天**：只顯示最近30天的數據
- **最近7天**：只顯示最近7天的數據
- **自定義範圍**：手動選擇開始和結束日期

### 斗篷篩選
- **全部斗篷**：顯示所有系列數據
- **JB系列**：顯示JB + JT01-JT13系列數據
- **JW系列**：顯示JW + JTW01-JTW13系列數據
- **JG系列**：顯示JG + JTG01-JTG07系列數據

### 指標類型
- **Fail Rate (%)**：顯示失敗率百分比
- **流量**：顯示Meta流量數據

## 數據說明

### 數據來源
基於您提供的Google Sheets數據，包含：
- 日期（8/1 - 12/31）
- 各斗篷的Meta流量
- 各斗篷的GA4流量
- 計算得出的Fail Rate

### 顏色編碼
- 🔴 **紅色**：Fail Rate > 60%（高風險）
- 🟡 **黃色**：Fail Rate 30-60%（中等風險）
- 🟢 **綠色**：Fail Rate < 30%（低風險）

## 技術架構

- **前端**：原生HTML/CSS/JavaScript + Chart.js
- **後端**：Flask + Python
- **數據源**：Google Sheets API
- **設計風格**：現代化漸變設計
- **響應式**：CSS Grid + Flexbox

## 數據更新機制

- **實時同步**：應用程式會動態從Google Sheets獲取最新數據
- **自動刷新**：點擊"刷新數據"按鈕可手動更新數據
- **錯誤處理**：網絡錯誤時會顯示友好的錯誤信息和重試按鈕

## 自定義選項

### 修改數據
在 `script.js` 文件中修改 `rawData` 陣列來更新數據：

```javascript
const rawData = [
    { 
        date: '日期', 
        jb: { meta: Meta流量, ga4: GA4流量, failRate: 失敗率 }, 
        jw: { meta: Meta流量, ga4: GA4流量, failRate: 失敗率 }, 
        jg: { meta: Meta流量, ga4: GA4流量, failRate: 失敗率 } 
    }
];
```

### 修改樣式
在 `styles.css` 文件中自定義顏色和樣式：

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #28a745;
    --warning-color: #ffc107;
    --danger-color: #dc3545;
}
```

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 授權

此專案僅供學習和內部使用。

## 聯絡資訊

如有問題或建議，請聯繫開發團隊。
