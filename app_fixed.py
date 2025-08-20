from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import pandas as pd
import io
import json
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app, origins=['http://localhost:8001', 'http://127.0.0.1:8001'], supports_credentials=True)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/147oXFJ07Hmrc1GoUKlq4dSrvKXYJ6u4to_LiJ7GC_Mg/edit?gid=599397897#gid=599397897"

def get_google_sheets_data():
    try:
        # 將Google Sheets URL轉換為CSV導出URL
        if '/edit' in GOOGLE_SHEETS_URL:
            csv_url = GOOGLE_SHEETS_URL.replace('/edit#gid=', '/export?format=csv&gid=')
            csv_url = csv_url.replace('/edit?gid=', '/export?format=csv&gid=')
        else:
            csv_url = GOOGLE_SHEETS_URL
        
        csv_url = csv_url.replace('#gid=', '&gid=') if '#gid=' in csv_url else csv_url
        
        logger.info(f"正在獲取Google Sheets數據: {csv_url}")
        
        response = requests.get(csv_url, timeout=10)
        response.raise_for_status()
        
        # 將CSV數據轉換為DataFrame
        df = pd.read_csv(io.StringIO(response.text))
        logger.info(f"成功獲取數據，共 {len(df)} 行")
        
        return df
    except Exception as e:
        logger.error(f"獲取Google Sheets數據失敗: {str(e)}")
        return None

def parse_google_sheets_data(df):
    """解析Google Sheets數據，基於正確的欄位結構"""
    try:
        logger.info(f"開始解析Google Sheets數據，原始形狀: {df.shape}")
        logger.info(f"前5行數據:\n{df.head()}")
        
        # 根據您提供的結構：
        # A欄: 日期 (A3:A33 = 8/1到8/31)
        # B-AN欄: JB系列 (JB + jt01-jt13，每個斗篷3欄：meta, GA4, fail rate)
        # AO-CB欄: JW系列 (JW + jtw01-jtw13，每個斗篷3欄：meta, GA4, fail rate)  
        # CD-DP欄: JG系列 (JG + jtg01-jtg13，每個斗篷3欄：meta, GA4, fail rate)
        
        result_data = []
        
        # 定義所有系列的斗篷和他們的起始欄位  
        # 根據您的說明：JB、JW、JG是產品名稱，實際斗篷是 jt01-jt13, jtw01-jtw13, jtg01-jtg13
        series_config = {
            'jb': {
                'cloaks': ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13'],
                'start_col': 4  # 跳過JB產品名稱，從實際斗篷開始
            },
            'jw': {
                'cloaks': ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13'],
                'start_col': 43  # AO欄開始，跳過JW產品名稱
            },
            'jg': {
                'cloaks': ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13'],
                'start_col': 84  # CD欄開始，跳過JG產品名稱  
            }
        }
        
        # 從第3行開始處理數據 (索引2，因為pandas是0基礎)
        for index in range(2, min(len(df), 33)):  # A3:A33
            row = df.iloc[index]
            
            # 獲取日期 (A欄)
            date_value = row.iloc[0] if len(row) > 0 else None
            if pd.isna(date_value) or str(date_value).strip() == '':
                continue
                
            date_str = str(date_value)
            logger.info(f"處理日期: {date_str}")
            
            date_data = {'date': date_str}
            
            # 處理所有系列
            for series_name, config in series_config.items():
                col_index = config['start_col']
                
                for cloak in config['cloaks']:
                    if col_index + 2 < len(row):  # 確保有足夠的欄位
                        try:
                            # 讀取 meta, GA4, fail rate
                            meta_value = row.iloc[col_index]
                            ga4_value = row.iloc[col_index + 1]
                            fail_rate_value = row.iloc[col_index + 2]
                            
                            # 轉換為數字
                            meta = float(meta_value) if pd.notna(meta_value) and str(meta_value).strip() != '' else 0
                            ga4 = float(ga4_value) if pd.notna(ga4_value) and str(ga4_value).strip() != '' else 0
                            
                            # 處理 fail rate（可能包含%符號）
                            if pd.notna(fail_rate_value) and str(fail_rate_value).strip() != '':
                                fail_rate_str = str(fail_rate_value).replace('%', '').strip()
                                # 確保不是日期字符串
                                if '/' not in fail_rate_str:
                                    try:
                                        fail_rate = float(fail_rate_str) if fail_rate_str else 0
                                    except ValueError:
                                        fail_rate = 0
                                else:
                                    fail_rate = 0
                            else:
                                fail_rate = 0
                            
                            date_data[cloak] = {
                                'meta': int(meta),
                                'ga4': int(ga4),
                                'failRate': round(fail_rate, 2)
                            }
                            
                            # 只在有數據時記錄
                            if meta > 0 or ga4 > 0 or fail_rate > 0:
                                logger.info(f"  {cloak}: meta={meta}, ga4={ga4}, failRate={fail_rate}")
                            
                        except (ValueError, TypeError) as e:
                            logger.warning(f"轉換數據失敗 {cloak} 在第 {index+1} 行: {e}")
                            date_data[cloak] = {'meta': 0, 'ga4': 0, 'failRate': 0.00}
                    else:
                        # 如果欄位不足，設為0
                        date_data[cloak] = {'meta': 0, 'ga4': 0, 'failRate': 0.00}
                    
                    col_index += 3  # 移到下一個斗篷（跳過3欄）
            
            result_data.append(date_data)
        
        logger.info(f"成功解析 {len(result_data)} 個日期的數據")
        return result_data
        
    except Exception as e:
        logger.error(f"解析Google Sheets數據失敗: {str(e)}")
        return None

def create_test_data():
    """創建基於Google Sheets結構的測試數據"""
    # 嘗試從Google Sheets獲取真實數據
    df = get_google_sheets_data()
    if df is not None:
        parsed_data = parse_google_sheets_data(df)
        if parsed_data:
            return parsed_data
    
    # 如果獲取失敗，使用備用測試數據
    logger.warning("使用備用測試數據")
    
    test_data = []
    
    # 基於您提供的Google Sheets第3行數據 (8/1)
    date_data_1 = {
        'date': '8/1',
        'jb': {'meta': 29, 'ga4': 24, 'failRate': 82.76},
        'jt01': {'meta': 719, 'ga4': 241, 'failRate': 33.52},
        'jt02': {'meta': 691, 'ga4': 327, 'failRate': 47.32},
        'jt03': {'meta': 200, 'ga4': 122, 'failRate': 61.00},
        'jt04': {'meta': 220, 'ga4': 128, 'failRate': 58.18},
        'jt05': {'meta': 303, 'ga4': 82, 'failRate': 27.06},
        'jt06': {'meta': 992, 'ga4': 502, 'failRate': 50.60},
        'jt07': {'meta': 246, 'ga4': 104, 'failRate': 42.28},
        'jt08': {'meta': 0, 'ga4': 0, 'failRate': 0.00},
        'jt09': {'meta': 0, 'ga4': 0, 'failRate': 0.00},
        'jt10': {'meta': 0, 'ga4': 0, 'failRate': 0.00},
        'jt11': {'meta': 0, 'ga4': 0, 'failRate': 0.00},
        'jt12': {'meta': 0, 'ga4': 0, 'failRate': 0.00},
        'jt13': {'meta': 0, 'ga4': 0, 'failRate': 0.00}
    }
    
    # 添加其他系列為0值
    other_cloaks = ['jw', 'jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13',
                   'jg', 'jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07']
    
    for cloak in other_cloaks:
        date_data_1[cloak] = {'meta': 0, 'ga4': 0, 'failRate': 0.00}
    
    test_data.append(date_data_1)
    
    # 生成剩餘日期的空數據
    all_cloaks = ['jb', 'jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13'] + other_cloaks
    
    for day in range(2, 32):
        date_str = f"8/{day}"
        date_data = {'date': date_str}
        
        for cloak in all_cloaks:
            date_data[cloak] = {'meta': 0, 'ga4': 0, 'failRate': 0.00}
        
        test_data.append(date_data)
    
    return test_data

@app.route('/api/data', methods=['GET'])
def get_data():
    try:
        # 暫時使用測試數據
        data = create_test_data()
        
        # 添加CORS標頭
        response = jsonify({
            'success': True,
            'data': data,
            'timestamp': datetime.now().isoformat()
        })
        
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
        
        logger.info(f"返回數據: {len(data)} 個日期，第一個日期有 {len(data[0])-1} 個斗篷")
        
        return response
        
    except Exception as e:
        logger.error(f"處理請求失敗: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
