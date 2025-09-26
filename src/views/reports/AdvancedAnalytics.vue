<template>
  <div class="advanced-analytics">
    <div class="analytics-header">
      <h1>進階財務分析</h1>
      <div class="refresh-controls">
        <el-button @click="refreshAnalysis" :loading="loading">
          <el-icon><Refresh /></el-icon>
          重新分析
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="analytics-overview">
      <!-- 財務健康度 -->
      <el-col :span="8">
        <el-card class="health-card">
          <template #header>
            <h3>財務健康度</h3>
          </template>
          <div class="health-score">
            <div class="score-circle" :class="healthLevelClass">
              <span class="score-number">{{ financialHealth.score }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="health-info">
              <div class="health-level">{{ healthLevelText }}</div>
              <div class="health-summary">{{ financialHealth.summary }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 異常檢測 -->
      <el-col :span="8">
        <el-card class="anomaly-card">
          <template #header>
            <h3>異常檢測</h3>
          </template>
          <div class="anomaly-summary">
            <div class="anomaly-count">
              <span class="count-number">{{ anomalyDetection.total }}</span>
              <span class="count-label">個異常</span>
            </div>
            <div class="anomaly-breakdown">
              <div class="anomaly-item">
                <span>收入異常：{{ anomalyDetection.income.length }}</span>
              </div>
              <div class="anomaly-item">
                <span>支出異常：{{ anomalyDetection.expense.length }}</span>
              </div>
              <div class="anomaly-item">
                <span>結餘異常：{{ anomalyDetection.balance.length }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 預測信心度 -->
      <el-col :span="8">
        <el-card class="forecast-card">
          <template #header>
            <h3>預測分析</h3>
          </template>
          <div class="forecast-summary">
            <div class="confidence-level">
              <span class="confidence-text">預測信心度</span>
              <el-tag :type="confidenceTagType">{{ confidenceText }}</el-tag>
            </div>
            <div class="forecast-trends">
              <div class="trend-item">
                <span>收入趨勢：</span>
                <el-tag :type="forecastAnalysis.income.trend === 'increasing' ? 'success' : 'warning'">
                  {{ forecastAnalysis.income.trend === 'increasing' ? '上升' : '下降' }}
                </el-tag>
              </div>
              <div class="trend-item">
                <span>支出趨勢：</span>
                <el-tag :type="forecastAnalysis.expense.trend === 'increasing' ? 'warning' : 'success'">
                  {{ forecastAnalysis.expense.trend === 'increasing' ? '上升' : '下降' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="analytics-tabs">
      <!-- 趨勢分析 -->
      <el-tab-pane label="趨勢分析" name="trends">
        <div class="trends-container">
          <div class="chart-controls">
            <el-radio-group v-model="trendPeriod" @change="updateTrendChart">
              <el-radio-button label="monthly">月度</el-radio-button>
              <el-radio-button label="quarterly">季度</el-radio-button>
              <el-radio-button label="yearly">年度</el-radio-button>
            </el-radio-group>
          </div>
          
          <div class="trend-charts">
            <el-card class="chart-card">
              <template #header>
                <h4>收支趨勢圖</h4>
              </template>
              <div ref="trendChart" class="chart-container"></div>
            </el-card>
            
            <el-card class="chart-card">
              <template #header>
                <h4>成長率分析</h4>
              </template>
              <div ref="growthChart" class="chart-container"></div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 異常檢測 -->
      <el-tab-pane label="異常檢測" name="anomalies">
        <div class="anomalies-container">
          <el-alert
            v-if="anomalyDetection.total === 0"
            title="未檢測到異常"
            type="success"
            description="您的財務數據看起來很正常，沒有發現明顯的異常情況。"
            :closable="false"
          />
          
          <div v-else class="anomaly-list">
            <el-card 
              v-for="anomaly in allAnomalies" 
              :key="anomaly.id"
              class="anomaly-item"
              :class="anomaly.severity"
            >
              <div class="anomaly-header">
                <el-tag :type="anomaly.severity === 'high' ? 'danger' : 'warning'">
                  {{ anomaly.severity === 'high' ? '高風險' : '中風險' }}
                </el-tag>
                <span class="anomaly-period">{{ anomaly.period }}</span>
              </div>
              <div class="anomaly-content">
                <h4>{{ anomaly.description }}</h4>
                <div class="anomaly-details">
                  <span>實際值：{{ formatCurrency(anomaly.value) }}</span>
                  <span v-if="anomaly.expected">預期值：{{ formatCurrency(anomaly.expected) }}</span>
                  <span v-if="anomaly.deviation">偏差度：{{ anomaly.deviation.toFixed(2) }}σ</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 預測分析 -->
      <el-tab-pane label="預測分析" name="forecasts">
        <div class="forecasts-container">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card class="forecast-card">
                <template #header>
                  <h4>收入預測</h4>
                </template>
                <div class="forecast-chart">
                  <div ref="incomeForecastChart" class="chart-container"></div>
                </div>
                <div class="forecast-summary">
                  <p>趨勢：{{ forecastAnalysis.income.trend === 'increasing' ? '預期上升' : '預期下降' }}</p>
                  <p>信心度：{{ confidenceText }}</p>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="12">
              <el-card class="forecast-card">
                <template #header>
                  <h4>支出預測</h4>
                </template>
                <div class="forecast-chart">
                  <div ref="expenseForecastChart" class="chart-container"></div>
                </div>
                <div class="forecast-summary">
                  <p>趨勢：{{ forecastAnalysis.expense.trend === 'increasing' ? '預期上升' : '預期下降' }}</p>
                  <p>信心度：{{ confidenceText }}</p>
                </div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-card class="balance-forecast-card">
            <template #header>
              <h4>結餘預測</h4>
            </template>
            <div ref="balanceForecastChart" class="chart-container"></div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 智能建議 -->
      <el-tab-pane label="智能建議" name="recommendations">
        <div class="recommendations-container">
          <el-row :gutter="20">
            <!-- 優化建議 -->
            <el-col :span="12">
              <el-card class="recommendations-card">
                <template #header>
                  <h4>優化建議</h4>
                </template>
                <div class="recommendation-list">
                  <div 
                    v-for="suggestion in intelligentRecommendations.optimization" 
                    :key="suggestion.title"
                    class="recommendation-item"
                    :class="suggestion.priority"
                  >
                    <div class="recommendation-header">
                      <el-tag :type="getPriorityTagType(suggestion.priority)">
                        {{ getPriorityText(suggestion.priority) }}
                      </el-tag>
                      <h5>{{ suggestion.title }}</h5>
                    </div>
                    <p>{{ suggestion.description }}</p>
                    <div class="recommendation-impact">
                      影響程度：{{ getImpactText(suggestion.impact) }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <!-- 風險警告 -->
            <el-col :span="12">
              <el-card class="risks-card">
                <template #header>
                  <h4>風險警告</h4>
                </template>
                <div class="risk-list">
                  <div 
                    v-for="risk in intelligentRecommendations.risks" 
                    :key="risk.title"
                    class="risk-item"
                    :class="risk.severity"
                  >
                    <div class="risk-header">
                      <el-tag :type="risk.severity === 'high' ? 'danger' : 'warning'">
                        {{ risk.severity === 'high' ? '高風險' : '中風險' }}
                      </el-tag>
                      <h5>{{ risk.title }}</h5>
                    </div>
                    <p>{{ risk.description }}</p>
                    <div class="risk-recommendation">
                      <strong>建議：</strong>{{ risk.recommendation }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAnalyticsStore } from '@/stores/analytics'

const analyticsStore = useAnalyticsStore()

// 響應式數據
const loading = ref(false)
const activeTab = ref('trends')
const trendPeriod = ref('monthly')

// 圖表引用
const trendChart = ref()
const growthChart = ref()
const incomeForecastChart = ref()
const expenseForecastChart = ref()
const balanceForecastChart = ref()

// 計算屬性
const trendAnalysis = computed(() => analyticsStore.trendAnalysis)
const anomalyDetection = computed(() => analyticsStore.anomalyDetection)
const forecastAnalysis = computed(() => analyticsStore.forecastAnalysis)
const intelligentRecommendations = computed(() => analyticsStore.intelligentRecommendations)
const financialHealth = computed(() => intelligentRecommendations.value.health)

const healthLevelClass = computed(() => {
  const level = financialHealth.value.level
  return {
    'excellent': 'health-excellent',
    'good': 'health-good',
    'fair': 'health-fair',
    'poor': 'health-poor'
  }[level] || 'health-fair'
})

const healthLevelText = computed(() => {
  const level = financialHealth.value.level
  return {
    'excellent': '優秀',
    'good': '良好',
    'fair': '一般',
    'poor': '需改善'
  }[level] || '一般'
})

const confidenceText = computed(() => {
  const confidence = forecastAnalysis.value.confidence
  return {
    'high': '高',
    'medium': '中',
    'low': '低'
  }[confidence] || '低'
})

const confidenceTagType = computed(() => {
  const confidence = forecastAnalysis.value.confidence
  return {
    'high': 'success',
    'medium': 'warning',
    'low': 'danger'
  }[confidence] || 'danger'
})

const allAnomalies = computed(() => {
  const anomalies = []
  
  anomalyDetection.value.income.forEach((anomaly, index) => {
    anomalies.push({ ...anomaly, id: `income-${index}` })
  })
  
  anomalyDetection.value.expense.forEach((anomaly, index) => {
    anomalies.push({ ...anomaly, id: `expense-${index}` })
  })
  
  anomalyDetection.value.balance.forEach((anomaly, index) => {
    anomalies.push({ ...anomaly, id: `balance-${index}` })
  })
  
  return anomalies.sort((a, b) => {
    const severityOrder = { high: 2, medium: 1, low: 0 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
})

// 方法
const refreshAnalysis = async () => {
  loading.value = true
  try {
    // 重新計算分析數據
    await nextTick()
    updateAllCharts()
  } finally {
    loading.value = false
  }
}

const updateTrendChart = () => {
  nextTick(() => {
    renderTrendChart()
    renderGrowthChart()
  })
}

const updateAllCharts = () => {
  nextTick(() => {
    renderTrendChart()
    renderGrowthChart()
    renderForecastCharts()
  })
}

const renderTrendChart = () => {
  if (!trendChart.value) return
  
  const chart = echarts.init(trendChart.value)
  const data = trendAnalysis.value[trendPeriod.value] || []
  
  const option = {
    title: {
      text: '收支趨勢分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          result += `${param.seriesName}: ${formatCurrency(param.value)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['收入', '支出', '結餘'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.period)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value) => formatCurrency(value)
      }
    },
    series: [
      {
        name: '收入',
        type: 'line',
        data: data.map(d => d.income),
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '支出',
        type: 'line',
        data: data.map(d => d.expense),
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '結餘',
        type: 'line',
        data: data.map(d => d.balance),
        itemStyle: { color: '#409EFF' }
      }
    ]
  }
  
  chart.setOption(option)
}

const renderGrowthChart = () => {
  if (!growthChart.value) return
  
  const chart = echarts.init(growthChart.value)
  const growth = trendAnalysis.value.growth || { income: [], expense: [], balance: [] }
  
  const option = {
    title: {
      text: '成長率分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['收入成長率', '支出成長率', '結餘成長率'],
      bottom: 0
    },
    xAxis: {
      type: 'category',
      data: growth.income.map(g => g.period)
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '收入成長率',
        type: 'bar',
        data: growth.income.map(g => g.rate),
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '支出成長率',
        type: 'bar',
        data: growth.expense.map(g => g.rate),
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '結餘成長率',
        type: 'bar',
        data: growth.balance.map(g => g.rate),
        itemStyle: { color: '#409EFF' }
      }
    ]
  }
  
  chart.setOption(option)
}

const renderForecastCharts = () => {
  // 收入預測圖表
  if (incomeForecastChart.value) {
    const chart = echarts.init(incomeForecastChart.value)
    const predictions = forecastAnalysis.value.income.predictions || []
    
    const option = {
      title: {
        text: '收入預測',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: predictions.map(p => p.period)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '預測收入',
        type: 'line',
        data: predictions.map(p => p.value),
        itemStyle: { color: '#67C23A' }
      }]
    }
    
    chart.setOption(option)
  }
  
  // 支出預測圖表
  if (expenseForecastChart.value) {
    const chart = echarts.init(expenseForecastChart.value)
    const predictions = forecastAnalysis.value.expense.predictions || []
    
    const option = {
      title: {
        text: '支出預測',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: predictions.map(p => p.period)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '預測支出',
        type: 'line',
        data: predictions.map(p => p.value),
        itemStyle: { color: '#F56C6C' }
      }]
    }
    
    chart.setOption(option)
  }
  
  // 結餘預測圖表
  if (balanceForecastChart.value) {
    const chart = echarts.init(balanceForecastChart.value)
    const predictions = forecastAnalysis.value.balance.predictions || []
    
    const option = {
      title: {
        text: '結餘預測',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: predictions.map(p => p.period)
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '預測結餘',
        type: 'line',
        data: predictions.map(p => p.value),
        itemStyle: { color: '#409EFF' }
      }]
    }
    
    chart.setOption(option)
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

const getPriorityTagType = (priority) => {
  return {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }[priority] || 'info'
}

const getPriorityText = (priority) => {
  return {
    'high': '高優先級',
    'medium': '中優先級',
    'low': '低優先級'
  }[priority] || '一般'
}

const getImpactText = (impact) => {
  return {
    'high': '高',
    'medium': '中',
    'low': '低'
  }[impact] || '一般'
}

// 生命週期
onMounted(() => {
  nextTick(() => {
    updateAllCharts()
  })
})
</script>

<style scoped>
.advanced-analytics {
  padding: 20px;
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analytics-overview {
  margin-bottom: 30px;
}

.health-card,
.anomaly-card,
.forecast-card {
  height: 200px;
}

.health-score {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.health-excellent {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  color: white;
}

.health-good {
  background: linear-gradient(135deg, #409EFF, #66B1FF);
  color: white;
}

.health-fair {
  background: linear-gradient(135deg, #E6A23C, #EEBE77);
  color: white;
}

.health-poor {
  background: linear-gradient(135deg, #F56C6C, #F78989);
  color: white;
}

.score-number {
  font-size: 24px;
}

.score-label {
  font-size: 12px;
}

.health-info {
  flex: 1;
}

.health-level {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

.health-summary {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.anomaly-summary,
.forecast-summary {
  text-align: center;
}

.anomaly-count,
.count-number {
  font-size: 32px;
  font-weight: bold;
  color: #F56C6C;
}

.count-label {
  font-size: 14px;
  color: #666;
}

.anomaly-breakdown {
  margin-top: 16px;
}

.anomaly-item {
  margin: 8px 0;
  font-size: 14px;
}

.confidence-level {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.forecast-trends {
  text-align: left;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0;
}

.analytics-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.chart-controls {
  margin-bottom: 20px;
  text-align: center;
}

.trend-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.anomaly-list {
  display: grid;
  gap: 16px;
}

.anomaly-item {
  border-left: 4px solid #E6A23C;
}

.anomaly-item.high {
  border-left-color: #F56C6C;
}

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.anomaly-period {
  font-weight: bold;
  color: #303133;
}

.anomaly-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.anomaly-details {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #666;
}

.forecasts-container {
  display: grid;
  gap: 20px;
}

.balance-forecast-card {
  margin-top: 20px;
}

.recommendations-container {
  display: grid;
  gap: 20px;
}

.recommendation-list,
.risk-list {
  display: grid;
  gap: 16px;
}

.recommendation-item,
.risk-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.recommendation-item.high,
.risk-item.high {
  border-left: 4px solid #F56C6C;
}

.recommendation-item.medium,
.risk-item.medium {
  border-left: 4px solid #E6A23C;
}

.recommendation-header,
.risk-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.recommendation-header h5,
.risk-header h5 {
  margin: 0;
  color: #303133;
}

.recommendation-impact,
.risk-recommendation {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .analytics-overview {
    display: block;
  }
  
  .analytics-overview .el-col {
    margin-bottom: 16px;
  }
  
  .trend-charts {
    grid-template-columns: 1fr;
  }
  
  .health-score {
    flex-direction: column;
    text-align: center;
  }
}
</style>
