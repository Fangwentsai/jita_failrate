// 動態數據存儲
let rawData = [];
let currentData = [];
let chart;
let isLoading = false;
let lastUpdateTime = null;
let showDataLabels = false;
let oldAFaceActive = false;
let newAFaceActive = false;

// API配置
const API_BASE_URL = 'http://localhost:5003/api';

// 顯示載入狀態
function showLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<div class="loading"></div>';
}

// 隱藏載入狀態
function hideLoading() {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = '<canvas id="failRateChart"></canvas>';
    // 重新初始化圖表
    initializeChart();
}

// 從API獲取數據
async function fetchDataFromAPI() {
    try {
        isLoading = true;
        showLoading();
        
        console.log('開始獲取數據...');
        const response = await fetch(`${API_BASE_URL}/data`);
        console.log('Response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('API響應:', result);
        
        if (result.success) {
            rawData = result.data;
            lastUpdateTime = result.timestamp;
            console.log('成功獲取數據:', rawData.length, '個日期');
            console.log('前5個數據項:', rawData.slice(0, 5));
            
            // 更新最後更新時間顯示
            updateLastUpdateTime();
            
            // 隱藏載入狀態並初始化圖表
            hideLoading();
            
            // 更新統計數據和表格
            updateStats();
            updateTable();
        } else {
            throw new Error(result.error || '獲取數據失敗');
        }
        
    } catch (error) {
        console.error('獲取數據失敗:', error);
        showError('無法從Google Sheets獲取數據，請檢查網絡連接或稍後再試');
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// 顯示錯誤信息
function showError(message) {
    const chartContainer = document.querySelector('.chart-container');
    chartContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #dc3545;">
            <h3>數據載入失敗</h3>
            <p>${message}</p>
            <button onclick="fetchDataFromAPI()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                重新載入
            </button>
        </div>
    `;
}

// 更新最後更新時間顯示
function updateLastUpdateTime() {
    if (lastUpdateTime) {
        const header = document.querySelector('header p');
        const updateTime = new Date(lastUpdateTime).toLocaleString('zh-TW');
        header.textContent = `基於Google Sheets數據的互動式分析 - 最後更新: ${updateTime}`;
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    fetchDataFromAPI();
    
    // 初始化時檢查預設選項
    handleCloakFilterChange();
});

// 設置事件監聽器
function setupEventListeners() {
    document.getElementById('cloakFilter').addEventListener('change', handleCloakFilterChange);
    
    // 分析按鈕已使用onclick屬性，無需額外的事件監聽器
    
    // 為所有checkbox添加事件監聽器
    setupSubCloakListeners();
}

// 設置子斗篷選項的事件監聽器
function setupSubCloakListeners() {
    ['jb', 'jw', 'jg'].forEach(series => {
        const container = document.getElementById(`${series}SubOptions`);
        if (container) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', filterData);
            });
        }
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

// 處理日期範圍選擇變化
function handleDateRangeChange() {
    const dateRange = document.getElementById('dateRange').value;
    const customDateRange = document.getElementById('customDateRange');
    const customDateRangeEnd = document.getElementById('customDateRangeEnd');
    
    if (dateRange === 'custom') {
        customDateRange.style.display = 'flex';
        customDateRangeEnd.style.display = 'flex';
        
        // 設置默認日期範圍（8/1-8/31）
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (!startDate.value) {
            startDate.value = '2024-08-01';
        }
        if (!endDate.value) {
            endDate.value = '2024-08-31';
        }
    } else {
        customDateRange.style.display = 'none';
        customDateRangeEnd.style.display = 'none';
    }
    
    // 只有在有數據時才篩選
    if (rawData && rawData.length > 0) {
        filterData();
    }
}

// 篩選數據
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
        console.log('圖表已初始化，調用updateChart');
        updateChart();
    } else {
        console.log('圖表未初始化');
    }
    updateStats();
    updateTable();
}

// 初始化圖表
function initializeChart() {
    const canvas = document.getElementById('failRateChart');
    if (!canvas) {
        console.error('找不到canvas元素');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('無法獲取canvas context');
        return;
    }
    
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
                    display: false, // 默認不顯示，通過updateChart動態控制
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
    
    // 只有在有數據時才更新圖表
    if (rawData && rawData.length > 0) {
        updateChart();
    }
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
    
    if (cloakFilter === 'all') {
        if (hasAnalysisMode) {
            // 分析模式：顯示聚合數據線
            if (oldAFaceActive) {
                ['jb', 'jw', 'jg'].forEach(seriesKey => {
                    const series = cloakSeries[seriesKey];
                    const dataKey = `${seriesKey}_old`;
                    
                    const data = dataToUse.map(item => {
                        if (item[dataKey] && (item[dataKey].meta > 0 || item[dataKey].ga4 > 0 || item[dataKey].failRate > 0)) {
                            if (metricType === 'failrate') {
                                const failRate = item[dataKey].failRate;
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[dataKey].ga4;
                            } else {
                                return item[dataKey].meta;
                            }
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
                });
            }
            
            if (newAFaceActive) {
                ['jb', 'jw', 'jg'].forEach(seriesKey => {
                    const series = cloakSeries[seriesKey];
                    const dataKey = `${seriesKey}_new`;
                    
                    const data = dataToUse.map(item => {
                        if (item[dataKey] && (item[dataKey].meta > 0 || item[dataKey].ga4 > 0 || item[dataKey].failRate > 0)) {
                            if (metricType === 'failrate') {
                                const failRate = item[dataKey].failRate;
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[dataKey].ga4;
                            } else {
                                return item[dataKey].meta;
                            }
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
                            borderDash: [5, 5], // 虛線以區分新舊A面
                            fill: false,
                            tension: 0.4,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        });
                        console.log(`添加${series.name}(09-13)到圖表`);
                    }
                });
            }
        } else {
            // 正常模式：顯示所有系列的斗篷
            Object.keys(cloakSeries).forEach(seriesKey => {
                const series = cloakSeries[seriesKey];
                
                series.cloaks.forEach(cloak => {
                    const data = dataToUse.map(item => {
                        if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                            if (metricType === 'failrate') {
                                const failRate = item[cloak].failRate;
                                // 只顯示0-100%範圍內的數據
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[cloak].ga4;
                            } else {
                                return item[cloak].meta;
                            }
                        }
                        return 0;
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
                        console.log(`添加${cloak}到圖表，數據點:`, data.filter(d => d > 0).length);
                    }
                });
            });
        }
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
                            if (metricType === 'failrate') {
                                const failRate = item[dataKey].failRate;
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[dataKey].ga4;
                            } else {
                                return item[dataKey].meta;
                            }
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
                            if (metricType === 'failrate') {
                                const failRate = item[dataKey].failRate;
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[dataKey].ga4;
                            } else {
                                return item[dataKey].meta;
                            }
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
                            if (metricType === 'failrate') {
                                const failRate = item[cloak].failRate;
                                // 只顯示0-100%範圍內的數據
                                return (failRate >= 0 && failRate <= 100) ? failRate : null;
                            } else if (metricType === 'ga4') {
                                return item[cloak].ga4;
                            } else {
                                return item[cloak].meta;
                            }
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
        if (cloakFilter === 'all') {
            // 統計所有有數據的斗篷
            const allCloaks = ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13',
                              'jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13',
                              'jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13'];
            allCloaks.forEach(cloak => {
                if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                    failRates.push(item[cloak].failRate);
                    totalVolume += item[cloak].meta;
                }
            });
        } else {
            // 根據選中的斗篷篩選
            const selectedCloaks = getSelectedCloaks(cloakFilter);
            selectedCloaks.forEach(cloak => {
                if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                    failRates.push(item[cloak].failRate);
                    totalVolume += item[cloak].meta;
                }
            });
        }
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
    
    if (cloakFilter === 'all') {
        // 顯示所有有數據的斗篷
        const cloakSeries = {
            jb: { name: 'JB系列', color: '#FF6384', cloaks: ['jt01', 'jt02', 'jt03', 'jt04', 'jt05', 'jt06', 'jt07', 'jt08', 'jt09', 'jt10', 'jt11', 'jt12', 'jt13'] },
            jw: { name: 'JW系列', color: '#36A2EB', cloaks: ['jtw01', 'jtw02', 'jtw03', 'jtw04', 'jtw05', 'jtw06', 'jtw07', 'jtw08', 'jtw09', 'jtw10', 'jtw11', 'jtw12', 'jtw13'] },
            jg: { name: 'JG系列', color: '#FFCE56', cloaks: ['jtg01', 'jtg02', 'jtg03', 'jtg04', 'jtg05', 'jtg06', 'jtg07', 'jtg08', 'jtg09', 'jtg10', 'jtg11', 'jtg12', 'jtg13'] }
        };
        
        currentData.forEach(item => {
            Object.values(cloakSeries).forEach(series => {
                series.cloaks.forEach(cloak => {
                    if (item[cloak] && (item[cloak].meta > 0 || item[cloak].ga4 > 0 || item[cloak].failRate > 0)) {
                        const row = createTableRow(item.date, cloak.toUpperCase(), item[cloak].meta, item[cloak].ga4, item[cloak].failRate);
                        tableBody.appendChild(row);
                    }
                });
            });
        });
    } else {
        // 只顯示選中的斗篷
        const selectedCloaks = getSelectedCloaks(cloakFilter);
        console.log('選中的斗篷:', selectedCloaks);
        
        currentData.forEach(item => {
            selectedCloaks.forEach(cloak => {
                if (item[cloak] && item[cloak].meta > 0) {
                    const row = createTableRow(item.date, cloak.toUpperCase(), item[cloak].meta, item[cloak].ga4, item[cloak].failRate);
                    tableBody.appendChild(row);
                }
            });
        });
    }
    
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
