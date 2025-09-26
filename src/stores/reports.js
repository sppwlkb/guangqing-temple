import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useAccountingStore } from './accounting'
import { useIncomeStore } from './income'
import { useExpenseStore } from './expense'

export const useReportsStore = defineStore('reports', () => {
  // 狀態
  const loading = ref(false)
  const error = ref(null)
  const reportPeriod = ref({
    startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('year').format('YYYY-MM-DD')
  })

  // 獲取其他 stores
  const accountingStore = useAccountingStore()
  const incomeStore = useIncomeStore()
  const expenseStore = useExpenseStore()

  // 計算屬性 - 資產負債表
  const balanceSheet = computed(() => {
    const assets = calculateAssets()
    const liabilities = calculateLiabilities()
    const equity = calculateEquity()
    
    return {
      assets,
      liabilities,
      equity,
      totalAssets: assets.total,
      totalLiabilitiesAndEquity: liabilities.total + equity.total,
      isBalanced: Math.abs(assets.total - (liabilities.total + equity.total)) < 0.01
    }
  })

  // 計算屬性 - 損益表
  const incomeStatement = computed(() => {
    const revenues = calculateRevenues()
    const expenses = calculateExpenses()
    const netIncome = revenues.total - expenses.total
    
    return {
      revenues,
      expenses,
      netIncome,
      grossProfit: revenues.total,
      operatingIncome: revenues.total - expenses.total,
      period: reportPeriod.value
    }
  })

  // 計算屬性 - 現金流量表
  const cashFlowStatement = computed(() => {
    const operating = calculateOperatingCashFlow()
    const investing = calculateInvestingCashFlow()
    const financing = calculateFinancingCashFlow()
    
    return {
      operating,
      investing,
      financing,
      netCashFlow: operating.total + investing.total + financing.total,
      period: reportPeriod.value
    }
  })

  // 計算屬性 - 財務比率分析
  const financialRatios = computed(() => {
    const bs = balanceSheet.value
    const is = incomeStatement.value
    
    return {
      liquidity: {
        currentRatio: bs.liabilities.current > 0 ? bs.assets.current / bs.liabilities.current : 0,
        quickRatio: bs.liabilities.current > 0 ? (bs.assets.current - bs.assets.inventory) / bs.liabilities.current : 0
      },
      efficiency: {
        assetTurnover: bs.totalAssets > 0 ? is.revenues.total / bs.totalAssets : 0,
        receivablesTurnover: bs.assets.receivables > 0 ? is.revenues.total / bs.assets.receivables : 0
      },
      profitability: {
        netProfitMargin: is.revenues.total > 0 ? is.netIncome / is.revenues.total : 0,
        returnOnAssets: bs.totalAssets > 0 ? is.netIncome / bs.totalAssets : 0,
        returnOnEquity: bs.equity.total > 0 ? is.netIncome / bs.equity.total : 0
      },
      leverage: {
        debtRatio: bs.totalAssets > 0 ? bs.liabilities.total / bs.totalAssets : 0,
        equityRatio: bs.totalAssets > 0 ? bs.equity.total / bs.totalAssets : 0
      }
    }
  })

  // 方法 - 計算資產
  function calculateAssets() {
    const assetSubjects = accountingStore.subjectsByType.asset || []
    const currentAssets = []
    const fixedAssets = []
    const otherAssets = []

    assetSubjects.forEach(subject => {
      const balance = calculateSubjectBalance(subject.id)
      const assetItem = {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        balance,
        level: subject.level
      }

      // 根據科目代碼分類
      if (subject.code.startsWith('11')) {
        currentAssets.push(assetItem)
      } else if (subject.code.startsWith('12')) {
        fixedAssets.push(assetItem)
      } else {
        otherAssets.push(assetItem)
      }
    })

    return {
      current: currentAssets,
      fixed: fixedAssets,
      other: otherAssets,
      currentTotal: currentAssets.reduce((sum, item) => sum + item.balance, 0),
      fixedTotal: fixedAssets.reduce((sum, item) => sum + item.balance, 0),
      otherTotal: otherAssets.reduce((sum, item) => sum + item.balance, 0),
      total: [...currentAssets, ...fixedAssets, ...otherAssets].reduce((sum, item) => sum + item.balance, 0)
    }
  }

  // 方法 - 計算負債
  function calculateLiabilities() {
    const liabilitySubjects = accountingStore.subjectsByType.liability || []
    const currentLiabilities = []
    const longTermLiabilities = []

    liabilitySubjects.forEach(subject => {
      const balance = calculateSubjectBalance(subject.id)
      const liabilityItem = {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        balance,
        level: subject.level
      }

      // 根據科目代碼分類
      if (subject.code.startsWith('21')) {
        currentLiabilities.push(liabilityItem)
      } else {
        longTermLiabilities.push(liabilityItem)
      }
    })

    return {
      current: currentLiabilities,
      longTerm: longTermLiabilities,
      currentTotal: currentLiabilities.reduce((sum, item) => sum + item.balance, 0),
      longTermTotal: longTermLiabilities.reduce((sum, item) => sum + item.balance, 0),
      total: [...currentLiabilities, ...longTermLiabilities].reduce((sum, item) => sum + item.balance, 0)
    }
  }

  // 方法 - 計算淨資產
  function calculateEquity() {
    const equitySubjects = accountingStore.subjectsByType.equity || []
    const equityItems = []

    equitySubjects.forEach(subject => {
      const balance = calculateSubjectBalance(subject.id)
      equityItems.push({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        balance,
        level: subject.level
      })
    })

    // 加入本期損益
    const currentPeriodIncome = incomeStatement.value.netIncome
    equityItems.push({
      id: 'current_income',
      code: '3999',
      name: '本期損益',
      balance: currentPeriodIncome,
      level: 3
    })

    return {
      items: equityItems,
      total: equityItems.reduce((sum, item) => sum + item.balance, 0)
    }
  }

  // 方法 - 計算收入
  function calculateRevenues() {
    const revenueSubjects = accountingStore.subjectsByType.income || []
    const revenueItems = []

    revenueSubjects.forEach(subject => {
      const amount = calculateSubjectAmount(subject.id, 'income')
      if (amount > 0) {
        revenueItems.push({
          id: subject.id,
          code: subject.code,
          name: subject.name,
          amount,
          level: subject.level
        })
      }
    })

    return {
      items: revenueItems,
      total: revenueItems.reduce((sum, item) => sum + item.amount, 0)
    }
  }

  // 方法 - 計算支出
  function calculateExpenses() {
    const expenseSubjects = accountingStore.subjectsByType.expense || []
    const expenseItems = []

    expenseSubjects.forEach(subject => {
      const amount = calculateSubjectAmount(subject.id, 'expense')
      if (amount > 0) {
        expenseItems.push({
          id: subject.id,
          code: subject.code,
          name: subject.name,
          amount,
          level: subject.level
        })
      }
    })

    return {
      items: expenseItems,
      total: expenseItems.reduce((sum, item) => sum + item.amount, 0)
    }
  }

  // 方法 - 計算營業現金流
  function calculateOperatingCashFlow() {
    const netIncome = incomeStatement.value.netIncome
    
    // 簡化計算：淨收入 + 非現金項目調整
    const depreciation = 0 // 暫時設為0，後續可從固定資產計算
    const workingCapitalChange = 0 // 暫時設為0，後續可從資產負債變化計算
    
    return {
      netIncome,
      depreciation,
      workingCapitalChange,
      total: netIncome + depreciation - workingCapitalChange
    }
  }

  // 方法 - 計算投資現金流
  function calculateInvestingCashFlow() {
    // 暫時簡化，後續可從固定資產變化計算
    return {
      assetPurchases: 0,
      assetSales: 0,
      total: 0
    }
  }

  // 方法 - 計算融資現金流
  function calculateFinancingCashFlow() {
    // 暫時簡化，後續可從負債和權益變化計算
    return {
      borrowings: 0,
      repayments: 0,
      donations: 0,
      total: 0
    }
  }

  // 工具方法 - 計算科目餘額
  function calculateSubjectBalance(subjectId) {
    // 這裡需要根據實際的記帳記錄計算餘額
    // 暫時返回0，後續需要實現完整的餘額計算邏輯
    return 0
  }

  // 工具方法 - 計算科目金額
  function calculateSubjectAmount(subjectId, type) {
    const subject = accountingStore.getSubjectById(subjectId)
    if (!subject) return 0

    let total = 0
    const startDate = dayjs(reportPeriod.value.startDate)
    const endDate = dayjs(reportPeriod.value.endDate)

    if (type === 'income') {
      // 根據科目代碼匹配收入記錄
      const matchingIncomes = incomeStore.incomes.filter(income => {
        const incomeDate = dayjs(income.date)
        return incomeDate.isAfter(startDate.subtract(1, 'day')) && 
               incomeDate.isBefore(endDate.add(1, 'day')) &&
               isIncomeMatchingSubject(income, subject)
      })
      total = matchingIncomes.reduce((sum, income) => sum + income.amount, 0)
    } else if (type === 'expense') {
      // 根據科目代碼匹配支出記錄
      const matchingExpenses = expenseStore.expenses.filter(expense => {
        const expenseDate = dayjs(expense.date)
        return expenseDate.isAfter(startDate.subtract(1, 'day')) && 
               expenseDate.isBefore(endDate.add(1, 'day')) &&
               isExpenseMatchingSubject(expense, subject)
      })
      total = matchingExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    }

    return total
  }

  // 工具方法 - 判斷收入是否匹配科目
  function isIncomeMatchingSubject(income, subject) {
    const category = incomeStore.getCategoryById(income.categoryId)
    if (!category) return false

    // 根據類別名稱匹配科目
    const categorySubjectMap = {
      '香油錢': '4101',
      '點光明燈': '4102',
      '屬名紅包': '4103',
      '未屬名紅包': '4104',
      '祝壽': '4105',
      '感謝神尊': '4106',
      '看風水': '4201',
      '停車費': '4202',
      '其他': '4301'
    }

    return categorySubjectMap[category.name] === subject.code
  }

  // 工具方法 - 判斷支出是否匹配科目
  function isExpenseMatchingSubject(expense, subject) {
    const category = expenseStore.getCategoryById(expense.categoryId)
    if (!category) return false

    // 根據類別名稱匹配科目
    const categorySubjectMap = {
      '人員薪水': '5101',
      '房租': '5102',
      '水電費': '5103',
      '管理費': '5104',
      '參訪金': '5201',
      '修繕費': '5301',
      '雜項開支': '5401',
      '其他': '5401'
    }

    return categorySubjectMap[category.name] === subject.code
  }

  // 方法 - 設定報表期間
  function setReportPeriod(startDate, endDate) {
    reportPeriod.value = {
      startDate: dayjs(startDate).format('YYYY-MM-DD'),
      endDate: dayjs(endDate).format('YYYY-MM-DD')
    }
  }

  // 方法 - 匯出報表
  function exportReport(reportType, format = 'json') {
    let reportData = {}
    
    switch (reportType) {
      case 'balance-sheet':
        reportData = balanceSheet.value
        break
      case 'income-statement':
        reportData = incomeStatement.value
        break
      case 'cash-flow':
        reportData = cashFlowStatement.value
        break
      case 'financial-ratios':
        reportData = financialRatios.value
        break
      default:
        throw new Error('不支援的報表類型')
    }

    if (format === 'json') {
      return JSON.stringify(reportData, null, 2)
    } else if (format === 'csv') {
      // 實現 CSV 匯出邏輯
      return convertToCSV(reportData)
    }
    
    return reportData
  }

  // 工具方法 - 轉換為 CSV
  function convertToCSV(data) {
    // 簡化的 CSV 轉換，實際實現需要更複雜的邏輯
    return JSON.stringify(data)
  }

  return {
    // 狀態
    loading,
    error,
    reportPeriod,

    // 計算屬性
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    financialRatios,

    // 方法
    setReportPeriod,
    exportReport
  }
})
