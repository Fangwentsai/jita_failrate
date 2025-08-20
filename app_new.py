from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import requests
import logging
import csv
import io
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=['http://localhost:8001', 'http://127.0.0.1:8001'], supports_credentials=True)

# 設置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Google Sheets URL (CSV export)
GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/147oXFJ07Hmrc1GoUKlq4dSrvKXYJ6u4to_LiJ7GC_Mg/export?format=csv&gid=599397897"

def get_google_sheets_data():
    """從Google Sheets獲取CSV數據"""
    try:
        response = requests.get(GOOGLE_SHEETS_URL, timeout=10)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"獲取Google Sheets數據失敗: {e}")
        return None

def safe_convert_int(value):
    """安全轉換整數"""
    if not value or str(value).strip() == '':
        return 0
    try:
        return int(float(str(value).strip()))
    except (ValueError, TypeError):
        return 0

def safe_convert_float(value):
    """安全轉換浮點數，處理百分比"""
    if not value or str(value).strip() == '':
        return 0.0
    try:
        value_str = str(value).strip().replace('%', '')
        if '/' in value_str:  # 跳過日期字符串
            return 0.0
        return float(value_str)
    except (ValueError, TypeError):
        return 0.0

def parse_google_sheets_data(csv_content):
    """解析Google Sheets的CSV數據"""
    try:
        # 使用csv.reader處理CSV數據
        csv_reader = csv.reader(io.StringIO(csv_content))
        rows = list(csv_reader)
        
        logger.info(f"CSV總行數: {len(rows)}")
        
        result_data = []
        
        # 從第3行開始處理數據 (索引2，因為0-based indexing)
        for row_idx in range(2, min(len(rows), 33)):  # A3:A33 對應數據
            row = rows[row_idx]
            
            if len(row) == 0 or not row[0].strip():
                continue
                
            date_str = row[0].strip()
            logger.info(f"處理日期: {date_str}")
            
            date_data = {'date': date_str}
            
            # JB系列: jt01-jt13 
            # 根據實際數據分析，嘗試：ga4, fail_rate, meta 順序
            # C欄=索引2，所以jt01=2:4, jt02=5:7, jt03=8:10, ...
            jt_cloaks = ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13']
            for i, cloak in enumerate(jt_cloaks):
                base_col = 2 + i * 3  # C欄開始 (索引2)，跳過B欄的JB標題
                ga4_col = base_col            # 嘗試GA4
                fail_rate_col = base_col + 1  # 嘗試fail rate
                meta_col = base_col + 2       # 嘗試meta
                
                meta = safe_convert_int(row[meta_col] if meta_col < len(row) else '')
                ga4 = safe_convert_int(row[ga4_col] if ga4_col < len(row) else '')
                fail_rate = safe_convert_float(row[fail_rate_col] if fail_rate_col < len(row) else '')
                
                date_data[cloak] = {
                    'meta': meta,
                    'ga4': ga4, 
                    'failRate': round(fail_rate, 2)
                }
            
            # JW系列: jtw01-jtw13 
            # AO欄開始，A=0,B=1,...,AO=40，但需要跳過JW產品標題欄
            jtw_cloaks = ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13']
            for i, cloak in enumerate(jtw_cloaks):
                base_col = 41 + i * 3  # AO欄是JW標題，實際數據從AP開始 (索引41)
                meta_col = base_col
                ga4_col = base_col + 1
                fail_rate_col = base_col + 2
                
                meta = safe_convert_int(row[meta_col] if meta_col < len(row) else '')
                ga4 = safe_convert_int(row[ga4_col] if ga4_col < len(row) else '')
                fail_rate = safe_convert_float(row[fail_rate_col] if fail_rate_col < len(row) else '')
                
                date_data[cloak] = {
                    'meta': meta,
                    'ga4': ga4,
                    'failRate': round(fail_rate, 2)
                }
            
            # JG系列: jtg01-jtg13 
            # CD欄開始，CD=80是JG標題，實際數據從CE開始=81
            jtg_cloaks = ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13']
            for i, cloak in enumerate(jtg_cloaks):
                base_col = 81 + i * 3  # CE欄開始 (索引81)，跳過CD欄的JG標題
                meta_col = base_col
                ga4_col = base_col + 1
                fail_rate_col = base_col + 2
                
                meta = safe_convert_int(row[meta_col] if meta_col < len(row) else '')
                ga4 = safe_convert_int(row[ga4_col] if ga4_col < len(row) else '')
                fail_rate = safe_convert_float(row[fail_rate_col] if fail_rate_col < len(row) else '')
                
                date_data[cloak] = {
                    'meta': meta,
                    'ga4': ga4,
                    'failRate': round(fail_rate, 2)
                }
            
            result_data.append(date_data)
        
        logger.info(f"成功解析 {len(result_data)} 個日期的數據")
        if result_data:
            logger.info(f"返回數據: {len(result_data)} 個日期，第一個日期有 {len(result_data[0])-1} 個斗篷")
        
        return result_data
        
    except Exception as e:
        logger.error(f"解析Google Sheets數據時發生錯誤: {e}")
        return []

@app.route('/api/data', methods=['GET'])
def get_data():
    """獲取失敗率數據"""
    try:
        # 獲取Google Sheets數據
        csv_content = get_google_sheets_data()
        if not csv_content:
            return jsonify({'success': False, 'error': '無法獲取Google Sheets數據'})
        
        # 解析數據
        data = parse_google_sheets_data(csv_content)
        
        response = jsonify({
            'success': True,
            'data': data,
            'lastUpdate': datetime.now().isoformat()
        })
        
        # 添加CORS headers
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        
        return response
        
    except Exception as e:
        logger.error(f"獲取數據時發生錯誤: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康檢查端點"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    logger.info("正在啟動Flask服務器...")
    app.run(debug=True, port=5003, host='0.0.0.0')
