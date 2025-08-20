// 動態數據存儲
let rawData = [];
let currentData = [];
let chart;
let isLoading = false;
let lastUpdateTime = null;
let showDataLabels = false;
let oldAFaceActive = false;
let newAFaceActive = false;

// Google Sheets數據URL
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/147oXFJ07Hmrc1GoUKlq4dSrvKXYJ6u4to_LiJ7GC_Mg/export?format=csv&gid=599397897';

// 顯示載入狀態
function showLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<div class="loading">載入中...</div>';
}

// 隱藏載入狀態並重新初始化圖表
function hideLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<canvas id="failRateChart"></canvas>';
    initializeChart();
}

// 從Google Sheets獲取數據
async function fetchDataFromGoogleSheets() {
    try {
        console.log('開始從Google Sheets獲取數據...');
        
        const response = await fetch(GOOGLE_SHEETS_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV數據獲取成功');
        
        const parsedData = parseCSVData(csvText);
        rawData = parsedData;
        lastUpdateTime = new Date().toISOString();
        
        console.log('數據解析完成，共', rawData.length, '天的數據');
        return { success: true, data: rawData };
    } catch (error) {
        console.error('獲取數據失敗:', error);
        return { success: false, error: error.message };
    }
}

// 解析CSV數據
function parseCSVData(csvText) {
    const lines = csvText.split('\n');
    const result = [];
    
    console.log('CSV總行數:', lines.length);
    
    // 跳過前2行標題，從第3行開始處理數據
    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = parseCSVRow(line);
        if (row.length === 0 || !row[0].trim()) continue;
        
        const dateStr = row[0].trim();
        console.log('處理日期:', dateStr);
        
        const dateData = { date: dateStr };
        
        // JB系列: jt01-jt13 (C欄開始，索引2)
        const jt_cloaks = ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13'];
        for (let j = 0; j < jt_cloaks.length; j++) {
            const cloak = jt_cloaks[j];
            const base_col = 2 + j * 3;
            const ga4_col = base_col;
            const fail_rate_col = base_col + 1;
            const meta_col = base_col + 2;
            
            const meta = safeConvertInt(row[meta_col] || '');
            const ga4 = safeConvertInt(row[ga4_col] || '');
            const fail_rate = safeConvertFloat(row[fail_rate_col] || '');
            
            dateData[cloak] = {
                meta: meta,
                ga4: ga4,
                failRate: Math.round(fail_rate * 100) / 100
            };
        }
        
        // JW系列: jtw01-jtw13 (AP欄開始，索引41)
        const jtw_cloaks = ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13'];
        for (let j = 0; j < jtw_cloaks.length; j++) {
            const cloak = jtw_cloaks[j];
            const base_col = 41 + j * 3;
            const meta_col = base_col;
            const ga4_col = base_col + 1;
            const fail_rate_col = base_col + 2;
            
            const meta = safeConvertInt(row[meta_col] || '');
            const ga4 = safeConvertInt(row[ga4_col] || '');
            const fail_rate = safeConvertFloat(row[fail_rate_col] || '');
            
            dateData[cloak] = {
                meta: meta,
                ga4: ga4,
                failRate: Math.round(fail_rate * 100) / 100
            };
        }
        
        // JG系列: jtg01-jtg13 (CE欄開始，索引81)
        const jtg_cloaks = ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13'];
        for (let j = 0; j < jtg_cloaks.length; j++) {
            const cloak = jtg_cloaks[j];
            const base_col = 81 + j * 3;
            const meta_col = base_col;
            const ga4_col = base_col + 1;
            const fail_rate_col = base_col + 2;
            
            const meta = safeConvertInt(row[meta_col] || '');
            const ga4 = safeConvertInt(row[ga4_col] || '');
            const fail_rate = safeConvertFloat(row[fail_rate_col] || '');
            
            dateData[cloak] = {
                meta: meta,
                ga4: ga4,
                failRate: Math.round(fail_rate * 100) / 100
            };
        }
        
        result.push(dateData);
    }
    
    console.log('成功解析', result.length, '個日期的數據');
    return result;
}

// 解析CSV行（處理引號內的逗號）
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// 安全轉換為整數
function safeConvertInt(value) {
    if (!value || value === '') return 0;
    const cleaned = value.toString().replace(/[,%]/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
}

// 安全轉換為浮點數
function safeConvertFloat(value) {
    if (!value || value === '') return 0;
    const cleaned = value.toString().replace(/[,%]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadData();
    
    // 初始化時檢查預設選項
    handleCloakFilterChange();
});

// 載入數據
async function loadData() {
    showLoading();
    const result = await fetchDataFromGoogleSheets();
    if (result.success) {
        hideLoading();
        filterData();
    } else {
        const chartContainer = document.querySelector('.chart-container');
        chartContainer.innerHTML = '<div class="error">載入數據失敗: ' + result.error + '</div>';
    }
}

// 設置事件監聽器
function setupEventListeners() {
    document.getElementById('cloakFilter').addEventListener('change', handleCloakFilterChange);
    
    // 分析按鈕已使用onclick屬性，無需額外的事件監聽器
    
    // 為所有checkbox添加事件監聽器
    setupSubCloakListeners();
}

// 為子斗篷選項添加事件監聽器
function setupSubCloakListeners() {
    const checkboxes = document.querySelectorAll('.sub-cloak-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            filterData();
        });
    });
}

// 處理主斗篷篩選變更
function handleCloakFilterChange() {
    const cloakFilter = document.getElementById('cloakFilter').value;
    
    // 隱藏所有子選項
    ['jb', 'jw', 'jg'].forEach(series => {
        const subOptions = document.getElementById(`${series}SubOptions`);
        if (subOptions) {
            subOptions.style.display = 'none';
        }
    });
    
    // 顯示對應的子選項
    const subOptions = document.getElementById(`${cloakFilter}SubOptions`);
    if (subOptions) {
        subOptions.style.display = 'block';
    }
    
    filterData();
}

// 全選/全不選斗篷
window.toggleAllCloaks = function(series, checked) {
    const container = document.getElementById(`${series}SubOptions`);
    if (container) {
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        filterData();
    }
}

// 獲取選中的斗篷列表
function getSelectedCloaks(series) {
    const container = document.getElementById(`${series}SubOptions`);
    if (!container) return [];
    
    const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// 數據篩選
function filterData() {
    console.log('filterData被調用，rawData長度:', rawData.length);
    const cloakFilter = document.getElementById('cloakFilter').value;
    console.log('斗篷篩選:', cloakFilter);
    
    // 使用所有數據，不進行日期篩選
    currentData = [...rawData];
    console.log('最終數據長度:', currentData.length);
    console.log('最終前3個數據項:', currentData.slice(0, 3));
    
    // 確保圖表已初始化後再更新
    if (chart) {
        updateChart();
        updateStats();
        updateTable();
    }
}

// 初始化圖表
function initializeChart() {
    const ctx = document.getElementById('failRateChart').getContext('2d');
    
    // 如果已經有圖表實例，先銷毀它
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                datalabels: {
                    display: false,
                    align: 'top',
                    offset: 4,
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    formatter: function(value, context) {
                        if (value !== null && value > 0) {
                            return value.toFixed(1) + '%';
                        }
                        return '';
                    },
                    color: function(context) {
                        return context.dataset.borderColor;
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: '#667eea',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return `日期: ${context[0].label}`;
                        },
                        afterTitle: function(context) {
                            return `斗篷: ${context[0].dataset.label}`;
                        },
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const date = context.label;
                            
                            // 檢查是否是新舊A面聚合數據
                            if (datasetLabel.includes('(01-08)') || datasetLabel.includes('(09-13)')) {
                                // 從聚合數據中查找
                                const hasAnalysisMode = oldAFaceActive || newAFaceActive;
                                if (hasAnalysisMode) {
                                    const aggregatedData = calculateAggregatedData();
                                    const dataItem = aggregatedData.find(item => item.date === date);
                                    
                                    if (dataItem) {
                                        // 根據標籤找到對應的數據鍵
                                        let dataKey = null;
                                        if (datasetLabel.includes('JB系列(01-08)')) dataKey = 'jb_old';
                                        else if (datasetLabel.includes('JW系列(01-08)')) dataKey = 'jw_old';
                                        else if (datasetLabel.includes('JG系列(01-08)')) dataKey = 'jg_old';
                                        else if (datasetLabel.includes('JB系列(09-13)')) dataKey = 'jb_new';
                                        else if (datasetLabel.includes('JW系列(09-13)')) dataKey = 'jw_new';
                                        else if (datasetLabel.includes('JG系列(09-13)')) dataKey = 'jg_new';
                                        
                                        if (dataKey && dataItem[dataKey]) {
                                            const cloakData = dataItem[dataKey];
                                            return [
                                                `Meta Click: ${cloakData.meta?.toLocaleString() || 0}`,
                                                `GA4 Session: ${cloakData.ga4?.toLocaleString() || 0}`,
                                                `Fail Rate: ${cloakData.failRate?.toFixed(2) || 0}%`
                                            ];
                                        }
                                    }
                                }
                            } else {
                                // 個別斗篷數據，從currentData中查找
                                const dataItem = currentData.find(item => item.date === date);
                                if (dataItem && dataItem[datasetLabel]) {
                                    const cloakData = dataItem[datasetLabel];
                                    return [
                                        `Meta Click: ${cloakData.meta?.toLocaleString() || 0}`,
                                        `GA4 Session: ${cloakData.ga4?.toLocaleString() || 0}`,
                                        `Fail Rate: ${cloakData.failRate?.toFixed(2) || 0}%`
                                    ];
                                }
                            }
                            
                            return [`${context.dataset.label}: ${context.formattedValue}`];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Fail Rate (%)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    beginAtZero: true,
                    min: 0,
                    max: 100
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 更新圖表
function updateChart() {
    // 檢查圖表是否已初始化
    if (!chart) {
        console.warn('圖表尚未初始化，跳過更新');
        return;
    }
    
    const metricType = 'failrate'; // 固定為fail rate
    const cloakFilter = document.getElementById('cloakFilter').value;
    console.log('updateChart - metricType:', metricType, 'cloakFilter:', cloakFilter);
    console.log('updateChart - currentData長度:', currentData.length);
    console.log('舊A面:', oldAFaceActive, '新A面:', newAFaceActive);
    
    // 檢查是否有分析模式啟用
    const hasAnalysisMode = oldAFaceActive || newAFaceActive;
    let dataToUse = currentData;
    let aggregatedData = null;
    
    if (hasAnalysisMode) {
        aggregatedData = calculateAggregatedData();
        dataToUse = aggregatedData;
        console.log('使用聚合數據，長度:', dataToUse.length);
    }
    
    const labels = dataToUse.map(item => item.date);
    const datasets = [];
    console.log('labels:', labels);
    console.log('dataToUse sample:', dataToUse.slice(0, 3));
    
    // 定義斗篷系列和顏色
    const cloakSeries = {
        jb: { name: 'JB系列', color: '#FF6384', cloaks: ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13'] },
        jw: { name: 'JW系列', color: '#36A2EB', cloaks: ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13'] },
        jg: { name: 'JG系列', color: '#FFCE56', cloaks: ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13'] }
    };
    
    // 現在總是顯示選中系列的數據
    if (false) { // 移除"全部斗篷"邏輯
        // 這段代碼不會執行
    } else {
        // 選擇了特定系列
        const series = cloakSeries[cloakFilter];
        if (series) {
            if (hasAnalysisMode) {
                // 分析模式下：顯示該系列的聚合數據
                if (oldAFaceActive) {
                    const dataKey = `${cloakFilter}_old`;
                    
                    const data = dataToUse.map(item => {
                        if (item[dataKey] && (item[dataKey].meta > 0 || item[dataKey].ga4 > 0 || item[dataKey].failRate > 0)) {
                            const failRate = item[dataKey].failRate;
                            return (failRate >= 0 && failRate <= 100) ? failRate : null;
                        }
                        return null;
                    });
                    
                    if (data.some(d => d !== null && d > 0)) {
                        datasets.push({
                            label: `${series.name}(01-08)`,
                            data: data,
                            borderColor: series.color,
                            backgroundColor: series.color + '20',
                            borderWidth: 3,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        });
                        console.log(`添加${series.name}(01-08)到圖表`);
                    }
                }
                
                if (newAFaceActive) {
                    const dataKey = `${cloakFilter}_new`;
                    
                    const data = dataToUse.map(item => {
                        if (item[dataKey] && (item[dataKey].meta > 0 || item[dataKey].ga4 > 0 || item[dataKey].failRate > 0)) {
                            const failRate = item[dataKey].failRate;
                            return (failRate >= 0 && failRate <= 100) ? failRate : null;
                        }
                        return null;
                    });
                    
                    if (data.some(d => d !== null && d > 0)) {
                        datasets.push({
                            label: `${series.name}(09-13)`,
                            data: data,
                            borderColor: series.color,
                            backgroundColor: series.color + '40',
                            borderWidth: 3,
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        });
                        console.log(`添加${series.name}(09-13)到圖表`);
                    }
                }
            } else {
                // 正常模式：只顯示選中系列的選中斗篷
                const selectedCloaks = getSelectedCloaks(cloakFilter);
                console.log(`${series.name}選中的斗篷:`, selectedCloaks);
                
                selectedCloaks.forEach(cloak => {
                    const data = dataToUse.map(item => {
                        if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                            const failRate = item[cloak].failRate;
                            // 只顯示0-100%範圍內的數據
                            return (failRate >= 0 && failRate <= 100) ? failRate : null;
                        }
                        return null;
                    });
                    
                    // 只添加有數據的斗篷
                    if (data.some(d => d !== null && d > 0)) {
                        datasets.push({
                            label: cloak,
                            data: data,
                            borderColor: series.color,
                            backgroundColor: series.color + '20',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            pointRadius: 3,
                            pointHoverRadius: 5
                        });
                        console.log(`添加${cloak}到${series.name}圖表，數據點:`, data.filter(d => d !== null && d > 0).length);
                    }
                });
            }
        }
    }
    
    console.log('最終datasets:', datasets);
    console.log('最終labels:', labels);
    
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    
    // 更新Y軸標題
    chart.options.scales.y.title.text = 'Fail Rate (%)';
    
    // 設置數據標籤顯示
    if (showDataLabels) {
        chart.options.plugins.datalabels.display = true;
    } else {
        chart.options.plugins.datalabels.display = false;
    }
    
    console.log('調用chart.update()');
    chart.update();
}

// 更新統計數據
function updateStats() {
    const cloakFilter = document.getElementById('cloakFilter').value;
    
    let failRates = [];
    let totalVolume = 0;
    
    currentData.forEach(item => {
        // 根據選中的斗篷篩選
        const selectedCloaks = getSelectedCloaks(cloakFilter);
        selectedCloaks.forEach(cloak => {
            if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                failRates.push(item[cloak].failRate);
                totalVolume += item[cloak].meta;
            }
        });
    });
    
    const avgFailRate = failRates.length > 0 ? (failRates.reduce((a, b) => a + b, 0) / failRates.length).toFixed(2) : '0.00';
    const maxFailRate = failRates.length > 0 ? Math.max(...failRates).toFixed(2) : '0.00';
    const minFailRate = failRates.length > 0 ? Math.min(...failRates).toFixed(2) : '0.00';
    
    document.getElementById('avgFailRate').textContent = avgFailRate + '%';
    document.getElementById('maxFailRate').textContent = maxFailRate + '%';
    document.getElementById('minFailRate').textContent = minFailRate + '%';
    document.getElementById('totalVolume').textContent = totalVolume.toLocaleString();
}

// 更新數據表格
function updateTable() {
    const tableBody = document.getElementById('tableBody');
    const cloakFilter = document.getElementById('cloakFilter').value;
    
    tableBody.innerHTML = '';
    
    console.log('updateTable調用，cloakFilter:', cloakFilter);
    
    // 只顯示選中的斗篷
    const selectedCloaks = getSelectedCloaks(cloakFilter);
    console.log('選中的斗篷:', selectedCloaks);
    
    currentData.forEach(item => {
        selectedCloaks.forEach(cloak => {
            if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                const row = createTableRow(item.date, cloak.toUpperCase(), item[cloak].meta, item[cloak].ga4, item[cloak].failRate);
                tableBody.appendChild(row);
            }
        });
    });
    
    console.log('表格更新完成，行數:', tableBody.children.length);
}

// 創建表格行
function createTableRow(date, cloak, meta, ga4, failRate) {
    const row = document.createElement('tr');
    
    const failRateClass = failRate > 60 ? 'fail-rate-high' : 
                         failRate > 30 ? 'fail-rate-medium' : 'fail-rate-low';
    
    row.innerHTML = `
        <td>${date}</td>
        <td>${cloak}</td>
        <td>${meta.toLocaleString()}</td>
        <td>${ga4.toLocaleString()}</td>
        <td class="${failRateClass}">${failRate.toFixed(2)}%</td>
    `;
    
    return row;
}

// 處理分析模式（舊A面/新A面）
function handleAnalysisMode(mode) {
    if (mode === 'oldAFace') {
        oldAFaceActive = !oldAFaceActive;
        // 更新所有舊A面按鈕的狀態
        document.querySelectorAll('.analysis-btn').forEach(btn => {
            if (btn.textContent.includes('舊A面')) {
                if (oldAFaceActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
        console.log(`舊A面模式: ${oldAFaceActive ? '啟用' : '關閉'}`);
    } else if (mode === 'newAFace') {
        newAFaceActive = !newAFaceActive;
        // 更新所有新A面按鈕的狀態
        document.querySelectorAll('.analysis-btn').forEach(btn => {
            if (btn.textContent.includes('新A面')) {
                if (newAFaceActive) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
        console.log(`新A面模式: ${newAFaceActive ? '啟用' : '關閉'}`);
    }
    
    // 如果啟用了任何分析模式，取消勾選所有個別斗篷
    if (oldAFaceActive || newAFaceActive) {
        uncheckAllCloaks();
    }
    
    // 重新更新圖表和數據
    filterData();
}

// 取消勾選所有個別斗篷
function uncheckAllCloaks() {
    const checkboxes = document.querySelectorAll('#jbSubOptions input[type="checkbox"], #jwSubOptions input[type="checkbox"], #jgSubOptions input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    console.log('已取消勾選所有個別斗篷');
}

// 切換數據標籤顯示
function toggleDataLabels() {
    showDataLabels = !showDataLabels;
    
    // 更新所有數據標籤按鈕的狀態
    document.querySelectorAll('.analysis-btn').forEach(btn => {
        if (btn.textContent.includes('顯示資料標籤')) {
            if (showDataLabels) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
    
    if (showDataLabels) {
        console.log('啟用數據標籤顯示');
    } else {
        console.log('關閉數據標籤顯示');
    }
    
    // 重新更新圖表
    updateChart();
}

// 計算聚合數據
function calculateAggregatedData() {
    const cloakRanges = {
        oldAFace: {
            jb: ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08'],
            jw: ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08'],
            jg: ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08']
        },
        newAFace: {
            jb: ['jt09', 'jt10', 'jt11', 'jt12', 'jt13'],
            jw: ['jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13'],
            jg: ['jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13']
        }
    };
    
    const aggregatedData = [];
    
    currentData.forEach(item => {
        const dateData = { date: item.date };
        
        // 計算舊A面聚合數據
        if (oldAFaceActive) {
            Object.keys(cloakRanges.oldAFace).forEach(series => {
                const cloaks = cloakRanges.oldAFace[series];
                let totalMeta = 0;
                let totalGA4 = 0;
                
                cloaks.forEach(cloak => {
                    if (item[cloak]) {
                        totalMeta += item[cloak].meta || 0;
                        totalGA4 += item[cloak].ga4 || 0;
                    }
                });
                
                // 計算fail rate: 1 - (GA4總和 ÷ Meta總和)
                const conversionRate = totalMeta > 0 ? totalGA4 / totalMeta : 0;
                const avgFailRate = (1 - conversionRate) * 100; // 轉換為百分比
                
                dateData[`${series}_old`] = {
                    meta: totalMeta,
                    ga4: totalGA4,
                    failRate: avgFailRate
                };
            });
        }
        
        // 計算新A面聚合數據
        if (newAFaceActive) {
            Object.keys(cloakRanges.newAFace).forEach(series => {
                const cloaks = cloakRanges.newAFace[series];
                let totalMeta = 0;
                let totalGA4 = 0;
                
                cloaks.forEach(cloak => {
                    if (item[cloak]) {
                        totalMeta += item[cloak].meta || 0;
                        totalGA4 += item[cloak].ga4 || 0;
                    }
                });
                
                // 計算fail rate: 1 - (GA4總和 ÷ Meta總和)
                const conversionRate = totalMeta > 0 ? totalGA4 / totalMeta : 0;
                const avgFailRate = (1 - conversionRate) * 100; // 轉換為百分比
                
                dateData[`${series}_new`] = {
                    meta: totalMeta,
                    ga4: totalGA4,
                    failRate: avgFailRate
                };
            });
        }
        
        aggregatedData.push(dateData);
    });
    
    console.log('聚合數據:', aggregatedData.slice(0, 3));
    return aggregatedData;
}
