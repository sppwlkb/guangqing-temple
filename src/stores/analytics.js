import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useIncomeStore } from './income'
import { useExpenseStore } from './expense'
import { useReportsStore } from './reports'

export const useAnalyticsStore = defineStore('analytics', () => {
  // 狀態
  const loading = ref(false)
  const error = ref(null)
  const analysisResults = ref({})
  const anomalies = ref([])
  const predictions = ref({})
  const recommendations = ref([])

  // 獲取其他 stores
  const incomeStore = useIncomeStore()
  const expenseStore = useExpenseStore()
  const reportsStore = useReportsStore()

  // 計算屬性 - 趨勢分析
  const trendAnalysis = computed(() => {
    const monthlyData = calculateMonthlyTrends()
    const quarterlyData = calculateQuarterlyTrends()
    const yearlyData = calculateYearlyTrends()
    
    return {
      monthly: monthlyData,
      quarterly: quarterlyData,
      yearly: yearlyData,
      growth: calculateGrowthRates(monthlyData)
    }
  })

  // 計算屬性 - 異常檢測結果
  const anomalyDetection = computed(() => {
    const incomeAnomalies = detectIncomeAnomalies()
    const expenseAnomalies = detectExpenseAnomalies()
    const balanceAnomalies = detectBalanceAnomalies()
    
    return {
      income: incomeAnomalies,
      expense: expenseAnomalies,
      balance: balanceAnomalies,
      total: incomeAnomalies.length + expenseAnomalies.length + balanceAnomalies.length
    }
  })

  // 計算屬性 - 預測分析
  const forecastAnalysis = computed(() => {
    const incomeForecast = predictIncome()
    const expenseForecast = predictExpense()
    const balanceForecast = predictBalance()
    
    return {
      income: incomeForecast,
      expense: expenseForecast,
      balance: balanceForecast,
      confidence: calculateForecastConfidence()
    }
  })

  // 計算屬性 - 智能建議
  const intelligentRecommendations = computed(() => {
    const financialHealth = analyzeFinancialHealth()
    const optimizationSuggestions = generateOptimizationSuggestions()
    const riskWarnings = identifyRisks()
    
    return {
      health: financialHealth,
      optimization: optimizationSuggestions,
      risks: riskWarnings,
      priority: prioritizeRecommendations([...optimizationSuggestions, ...riskWarnings])
    }
  })

  // 方法 - 計算月度趨勢
  function calculateMonthlyTrends() {
    const months = []
    const currentDate = dayjs()
    
    for (let i = 11; i >= 0; i--) {
      const month = currentDate.subtract(i, 'month')
      const startDate = month.startOf('month')
      const endDate = month.endOf('month')
      
      const monthlyIncome = incomeStore.getIncomesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, income) => sum + income.amount, 0)
      
      const monthlyExpense = expenseStore.getExpensesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, expense) => sum + expense.amount, 0)
      
      months.push({
        period: month.format('YYYY-MM'),
        income: monthlyIncome,
        expense: monthlyExpense,
        balance: monthlyIncome - monthlyExpense,
        date: month.toDate()
      })
    }
    
    return months
  }

  // 方法 - 計算季度趨勢
  function calculateQuarterlyTrends() {
    const quarters = []
    const currentDate = dayjs()
    
    for (let i = 7; i >= 0; i--) {
      const quarter = currentDate.subtract(i, 'quarter')
      const startDate = quarter.startOf('quarter')
      const endDate = quarter.endOf('quarter')
      
      const quarterlyIncome = incomeStore.getIncomesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, income) => sum + income.amount, 0)
      
      const quarterlyExpense = expenseStore.getExpensesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, expense) => sum + expense.amount, 0)
      
      quarters.push({
        period: `${quarter.year()}Q${quarter.quarter()}`,
        income: quarterlyIncome,
        expense: quarterlyExpense,
        balance: quarterlyIncome - quarterlyExpense,
        date: quarter.toDate()
      })
    }
    
    return quarters
  }

  // 方法 - 計算年度趨勢
  function calculateYearlyTrends() {
    const years = []
    const currentDate = dayjs()
    
    for (let i = 4; i >= 0; i--) {
      const year = currentDate.subtract(i, 'year')
      const startDate = year.startOf('year')
      const endDate = year.endOf('year')
      
      const yearlyIncome = incomeStore.getIncomesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, income) => sum + income.amount, 0)
      
      const yearlyExpense = expenseStore.getExpensesByDateRange(
        startDate.format('YYYY-MM-DD'),
        endDate.format('YYYY-MM-DD')
      ).reduce((sum, expense) => sum + expense.amount, 0)
      
      years.push({
        period: year.format('YYYY'),
        income: yearlyIncome,
        expense: yearlyExpense,
        balance: yearlyIncome - yearlyExpense,
        date: year.toDate()
      })
    }
    
    return years
  }

  // 方法 - 計算成長率
  function calculateGrowthRates(data) {
    const growth = {
      income: [],
      expense: [],
      balance: []
    }
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i]
      const previous = data[i - 1]
      
      growth.income.push({
        period: current.period,
        rate: previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : 0
      })
      
      growth.expense.push({
        period: current.period,
        rate: previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 0
      })
      
      growth.balance.push({
        period: current.period,
        rate: previous.balance !== 0 ? ((current.balance - previous.balance) / Math.abs(previous.balance)) * 100 : 0
      })
    }
    
    return growth
  }

  // 方法 - 檢測收入異常
  function detectIncomeAnomalies() {
    const anomalies = []
    const monthlyData = calculateMonthlyTrends()
    
    if (monthlyData.length < 3) return anomalies
    
    // 計算平均值和標準差
    const incomes = monthlyData.map(d => d.income)
    const mean = incomes.reduce((sum, val) => sum + val, 0) / incomes.length
    const variance = incomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / incomes.length
    const stdDev = Math.sqrt(variance)
    
    // 檢測異常值（超過2個標準差）
    monthlyData.forEach(data => {
      const zScore = Math.abs(data.income - mean) / stdDev
      if (zScore > 2) {
        anomalies.push({
          type: 'income',
          period: data.period,
          value: data.income,
          expected: mean,
          deviation: zScore,
          severity: zScore > 3 ? 'high' : 'medium',
          description: `收入異常：${data.period} 的收入 ${data.income > mean ? '顯著高於' : '顯著低於'} 平均水準`
        })
      }
    })
    
    return anomalies
  }

  // 方法 - 檢測支出異常
  function detectExpenseAnomalies() {
    const anomalies = []
    const monthlyData = calculateMonthlyTrends()
    
    if (monthlyData.length < 3) return anomalies
    
    // 計算平均值和標準差
    const expenses = monthlyData.map(d => d.expense)
    const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length
    const variance = expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / expenses.length
    const stdDev = Math.sqrt(variance)
    
    // 檢測異常值
    monthlyData.forEach(data => {
      const zScore = Math.abs(data.expense - mean) / stdDev
      if (zScore > 2) {
        anomalies.push({
          type: 'expense',
          period: data.period,
          value: data.expense,
          expected: mean,
          deviation: zScore,
          severity: zScore > 3 ? 'high' : 'medium',
          description: `支出異常：${data.period} 的支出 ${data.expense > mean ? '顯著高於' : '顯著低於'} 平均水準`
        })
      }
    })
    
    return anomalies
  }

  // 方法 - 檢測結餘異常
  function detectBalanceAnomalies() {
    const anomalies = []
    const monthlyData = calculateMonthlyTrends()
    
    // 檢測連續虧損
    let consecutiveLosses = 0
    monthlyData.forEach((data, index) => {
      if (data.balance < 0) {
        consecutiveLosses++
      } else {
        if (consecutiveLosses >= 3) {
          anomalies.push({
            type: 'balance',
            period: `${monthlyData[index - consecutiveLosses].period} - ${monthlyData[index - 1].period}`,
            value: consecutiveLosses,
            severity: 'high',
            description: `連續 ${consecutiveLosses} 個月出現虧損，需要關注財務狀況`
          })
        }
        consecutiveLosses = 0
      }
    })
    
    // 檢查最後的連續虧損
    if (consecutiveLosses >= 3) {
      anomalies.push({
        type: 'balance',
        period: `${monthlyData[monthlyData.length - consecutiveLosses].period} - ${monthlyData[monthlyData.length - 1].period}`,
        value: consecutiveLosses,
        severity: 'high',
        description: `連續 ${consecutiveLosses} 個月出現虧損，需要關注財務狀況`
      })
    }
    
    return anomalies
  }

  // 方法 - 預測收入
  function predictIncome() {
    const monthlyData = calculateMonthlyTrends()
    if (monthlyData.length < 6) return { predictions: [], confidence: 'low' }
    
    // 簡單線性回歸預測
    const predictions = []
    const incomes = monthlyData.map(d => d.income)
    const trend = calculateLinearTrend(incomes)
    
    for (let i = 1; i <= 6; i++) {
      const futureMonth = dayjs().add(i, 'month')
      const predictedValue = trend.slope * (monthlyData.length + i) + trend.intercept
      
      predictions.push({
        period: futureMonth.format('YYYY-MM'),
        value: Math.max(0, predictedValue),
        confidence: calculatePredictionConfidence(incomes, i)
      })
    }
    
    return { predictions, trend: trend.slope > 0 ? 'increasing' : 'decreasing' }
  }

  // 方法 - 預測支出
  function predictExpense() {
    const monthlyData = calculateMonthlyTrends()
    if (monthlyData.length < 6) return { predictions: [], confidence: 'low' }
    
    const predictions = []
    const expenses = monthlyData.map(d => d.expense)
    const trend = calculateLinearTrend(expenses)
    
    for (let i = 1; i <= 6; i++) {
      const futureMonth = dayjs().add(i, 'month')
      const predictedValue = trend.slope * (monthlyData.length + i) + trend.intercept
      
      predictions.push({
        period: futureMonth.format('YYYY-MM'),
        value: Math.max(0, predictedValue),
        confidence: calculatePredictionConfidence(expenses, i)
      })
    }
    
    return { predictions, trend: trend.slope > 0 ? 'increasing' : 'decreasing' }
  }

  // 方法 - 預測結餘
  function predictBalance() {
    const incomeForecast = predictIncome()
    const expenseForecast = predictExpense()
    
    const predictions = []
    
    for (let i = 0; i < Math.min(incomeForecast.predictions.length, expenseForecast.predictions.length); i++) {
      const income = incomeForecast.predictions[i]
      const expense = expenseForecast.predictions[i]
      
      predictions.push({
        period: income.period,
        value: income.value - expense.value,
        confidence: Math.min(income.confidence, expense.confidence)
      })
    }
    
    return { predictions }
  }

  // 工具方法 - 計算線性趨勢
  function calculateLinearTrend(data) {
    const n = data.length
    const sumX = (n * (n + 1)) / 2
    const sumY = data.reduce((sum, val) => sum + val, 0)
    const sumXY = data.reduce((sum, val, index) => sum + val * (index + 1), 0)
    const sumXX = (n * (n + 1) * (2 * n + 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return { slope, intercept }
  }

  // 工具方法 - 計算預測信心度
  function calculatePredictionConfidence(data, monthsAhead) {
    const variance = data.reduce((sum, val, index, arr) => {
      const mean = arr.reduce((s, v) => s + v, 0) / arr.length
      return sum + Math.pow(val - mean, 2)
    }, 0) / data.length
    
    const baseConfidence = Math.max(0.3, 1 - variance / 1000000)
    const timeDecay = Math.pow(0.9, monthsAhead - 1)
    
    return Math.round(baseConfidence * timeDecay * 100) / 100
  }

  // 方法 - 計算預測整體信心度
  function calculateForecastConfidence() {
    const monthlyData = calculateMonthlyTrends()
    
    if (monthlyData.length < 6) return 'low'
    if (monthlyData.length < 12) return 'medium'
    return 'high'
  }

  // 方法 - 分析財務健康度
  function analyzeFinancialHealth() {
    const monthlyData = calculateMonthlyTrends()
    const recentData = monthlyData.slice(-6) // 最近6個月
    
    const avgIncome = recentData.reduce((sum, d) => sum + d.income, 0) / recentData.length
    const avgExpense = recentData.reduce((sum, d) => sum + d.expense, 0) / recentData.length
    const avgBalance = recentData.reduce((sum, d) => sum + d.balance, 0) / recentData.length
    
    const profitMargin = avgIncome > 0 ? (avgBalance / avgIncome) * 100 : 0
    const expenseRatio = avgIncome > 0 ? (avgExpense / avgIncome) * 100 : 100
    
    let healthScore = 100
    let healthLevel = 'excellent'
    let issues = []
    
    // 評估利潤率
    if (profitMargin < 0) {
      healthScore -= 40
      issues.push('持續虧損狀態')
    } else if (profitMargin < 10) {
      healthScore -= 20
      issues.push('利潤率偏低')
    }
    
    // 評估支出比例
    if (expenseRatio > 90) {
      healthScore -= 30
      issues.push('支出比例過高')
    } else if (expenseRatio > 80) {
      healthScore -= 15
      issues.push('支出比例偏高')
    }
    
    // 評估收入穩定性
    const incomeVariance = calculateVariance(recentData.map(d => d.income))
    if (incomeVariance > avgIncome * 0.3) {
      healthScore -= 15
      issues.push('收入波動較大')
    }
    
    // 確定健康等級
    if (healthScore >= 80) healthLevel = 'excellent'
    else if (healthScore >= 60) healthLevel = 'good'
    else if (healthScore >= 40) healthLevel = 'fair'
    else healthLevel = 'poor'
    
    return {
      score: Math.max(0, healthScore),
      level: healthLevel,
      profitMargin,
      expenseRatio,
      issues,
      summary: generateHealthSummary(healthLevel, issues)
    }
  }

  // 方法 - 生成優化建議
  function generateOptimizationSuggestions() {
    const suggestions = []
    const monthlyData = calculateMonthlyTrends()
    const recentData = monthlyData.slice(-3)
    
    const avgIncome = recentData.reduce((sum, d) => sum + d.income, 0) / recentData.length
    const avgExpense = recentData.reduce((sum, d) => sum + d.expense, 0) / recentData.length
    
    // 收入優化建議
    if (avgIncome < 50000) {
      suggestions.push({
        type: 'income',
        priority: 'high',
        title: '增加收入來源',
        description: '考慮開發新的收入管道，如增加服務項目或提高現有服務品質',
        impact: 'high'
      })
    }
    
    // 支出優化建議
    if (avgExpense > avgIncome * 0.8) {
      suggestions.push({
        type: 'expense',
        priority: 'high',
        title: '控制支出成本',
        description: '檢視並優化支出結構，減少非必要開支',
        impact: 'high'
      })
    }
    
    // 分析支出類別
    const expenseCategories = expenseStore.expenseByCategory
    const totalExpense = Object.values(expenseCategories).reduce((sum, val) => sum + val, 0)
    
    Object.entries(expenseCategories).forEach(([category, amount]) => {
      const percentage = (amount / totalExpense) * 100
      if (percentage > 30) {
        suggestions.push({
          type: 'expense',
          priority: 'medium',
          title: `優化 ${category} 支出`,
          description: `${category} 佔總支出的 ${percentage.toFixed(1)}%，建議檢視是否有優化空間`,
          impact: 'medium'
        })
      }
    })
    
    return suggestions
  }

  // 方法 - 識別風險
  function identifyRisks() {
    const risks = []
    const monthlyData = calculateMonthlyTrends()
    const recentData = monthlyData.slice(-3)
    
    // 現金流風險
    const negativeCashFlow = recentData.filter(d => d.balance < 0).length
    if (negativeCashFlow >= 2) {
      risks.push({
        type: 'cashflow',
        severity: 'high',
        title: '現金流風險',
        description: '近期多個月份出現負現金流，需要密切關注資金狀況',
        recommendation: '建立應急資金，優化收支結構'
      })
    }
    
    // 收入下降風險
    const incomeDecline = calculateGrowthRates(recentData).income
    const negativeGrowth = incomeDecline.filter(g => g.rate < -10).length
    if (negativeGrowth >= 2) {
      risks.push({
        type: 'income',
        severity: 'medium',
        title: '收入下降趨勢',
        description: '收入呈現下降趨勢，可能影響長期財務穩定',
        recommendation: '分析收入下降原因，制定收入增長策略'
      })
    }
    
    return risks
  }

  // 方法 - 優先排序建議
  function prioritizeRecommendations(recommendations) {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    
    return recommendations.sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 0
      const bPriority = priorityOrder[b.priority] || 0
      return bPriority - aPriority
    })
  }

  // 工具方法
  function calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  }

  function generateHealthSummary(level, issues) {
    const levelDescriptions = {
      excellent: '財務狀況優良，繼續保持良好的收支管理',
      good: '財務狀況良好，有一些小問題需要關注',
      fair: '財務狀況一般，需要改善收支結構',
      poor: '財務狀況需要立即改善，建議尋求專業建議'
    }
    
    let summary = levelDescriptions[level]
    if (issues.length > 0) {
      summary += `。主要問題：${issues.join('、')}`
    }
    
    return summary
  }

  return {
    // 狀態
    loading,
    error,
    analysisResults,
    anomalies,
    predictions,
    recommendations,

    // 計算屬性
    trendAnalysis,
    anomalyDetection,
    forecastAnalysis,
    intelligentRecommendations,

    // 方法
    calculateMonthlyTrends,
    calculateQuarterlyTrends,
    calculateYearlyTrends,
    detectIncomeAnomalies,
    detectExpenseAnomalies,
    predictIncome,
    predictExpense,
    analyzeFinancialHealth
  }
})
