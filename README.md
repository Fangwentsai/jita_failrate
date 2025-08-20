# 各斗篷Fail Rate 視覺化圖表

基於Google Sheets數據的互動式fail rate分析工具，支持新舊A面比較和數據標籤顯示。

## 🌐 線上版本

**公開網址**: https://fangwentsai.github.io/jita_failrate/

## ✨ 功能特點

### 📊 **數據可視化**
- 互動式折線圖顯示fail rate趨勢
- 支持0-100%範圍限制
- 自定義tooltip顯示詳細數據
- 可切換顯示數據標籤

### 🎯 **斗篷管理**
- **JB系列**: JT01-JT13
- **JW系列**: JTW01-JTW13  
- **JG系列**: JTG01-JTG13
- 支持個別選擇或全選/全不選

### 🔍 **分析模式**
- **舊A面(01-08)**: 統計01-08號斗篷的聚合fail rate
- **新A面(09-13)**: 統計09-13號斗篷的聚合fail rate
- 可同時啟用，支持對比分析
- 使用虛線區分新舊A面

### 📈 **統計信息**
- 平均/最高/最低 Fail Rate
- 總流量統計
- 詳細數據表格

## 🛠 技術架構

### 前端技術
- **HTML5 + CSS3**: 響應式UI設計
- **JavaScript (ES6+)**: 數據處理和互動邏輯
- **Chart.js**: 圖表渲染和數據可視化
- **Chart.js DataLabels**: 數據標籤插件

### 後端技術 (本地開發)
- **Python Flask**: API服務器
- **Pandas**: 數據處理
- **Flask-CORS**: 跨域請求支持

### 數據來源
- **Google Sheets**: 即時數據同步
- **CSV解析**: 前端直接讀取Google Sheets導出的CSV

## 📁 項目結構

```
jita_failrate/
├── docs/                    # GitHub Pages部署文件
│   ├── index.html          # 前端頁面
│   ├── script.js           # 前端邏輯
│   └── styles.css          # 樣式文件
├── app_new.py              # Flask後端服務器
├── requirements.txt        # Python依賴
└── README.md              # 項目說明
```

## 🚀 本地開發

### 前端開發
```bash
# 啟動HTTP服務器
python3 -m http.server 8001

# 訪問網址
http://localhost:8001
```

### 後端開發 (完整功能)
```bash
# 安裝依賴
pip install -r requirements.txt

# 啟動後端服務
python3 app_new.py

# 啟動前端服務
python3 -m http.server 8001
```

## 📊 數據計算邏輯

### Fail Rate計算
```
新舊A面 Fail Rate = 1 - (GA4 Session總和 ÷ Meta Click總和)
```

### 斗篷分組
- **舊A面**: 01-08號斗篷
- **新A面**: 09-13號斗篷

## 🎨 設計特點

- **簡潔現代**: 淺灰色背景，統一按鈕樣式
- **響應式設計**: 支持不同螢幕尺寸
- **直觀操作**: 清晰的控制面板和即時反饋
- **專業視覺**: 企業級數據可視化風格

## 📱 瀏覽器支持

- Chrome (推薦)
- Firefox
- Safari
- Edge

## 🔗 相關鏈接

- [GitHub Repository](https://github.com/Fangwentsai/jita_failrate)
- [Live Demo](https://fangwentsai.github.io/jita_failrate/)
- [Google Sheets數據源](https://docs.google.com/spreadsheets/d/147oXFJ07Hmrc1GoUKlq4dSrvKXYJ6u4to_LiJ7GC_Mg/edit?gid=599397897)

## 📄 授權

本項目採用 MIT 授權條款。