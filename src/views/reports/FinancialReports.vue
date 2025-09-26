<template>
  <div class="financial-reports">
    <div class="reports-header">
      <h1>財務報表</h1>
      <div class="period-selector">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="開始日期"
          end-placeholder="結束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handlePeriodChange"
        />
        <el-button-group class="period-buttons">
          <el-button @click="setQuickPeriod('thisMonth')">本月</el-button>
          <el-button @click="setQuickPeriod('thisQuarter')">本季</el-button>
          <el-button @click="setQuickPeriod('thisYear')">本年</el-button>
          <el-button @click="setQuickPeriod('lastYear')">去年</el-button>
        </el-button-group>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="reports-tabs">
      <!-- 資產負債表 -->
      <el-tab-pane label="資產負債表" name="balance-sheet">
        <div class="report-container">
          <div class="report-header">
            <h2>資產負債表</h2>
            <div class="report-actions">
              <el-button @click="exportReport('balance-sheet', 'json')">
                <el-icon><Download /></el-icon>
                匯出 JSON
              </el-button>
              <el-button @click="exportReport('balance-sheet', 'csv')">
                <el-icon><Document /></el-icon>
                匯出 CSV
              </el-button>
            </div>
          </div>
          
          <div class="balance-sheet">
            <div class="assets-section">
              <h3>資產</h3>
              <div class="asset-category">
                <h4>流動資產</h4>
                <el-table :data="balanceSheet.assets.current" stripe>
                  <el-table-column prop="code" label="科目代碼" width="120" />
                  <el-table-column prop="name" label="科目名稱" />
                  <el-table-column prop="balance" label="金額" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.balance) }}
                    </template>
                  </el-table-column>
                </el-table>
                <div class="subtotal">
                  流動資產合計：{{ formatCurrency(balanceSheet.assets.currentTotal) }}
                </div>
              </div>

              <div class="asset-category">
                <h4>固定資產</h4>
                <el-table :data="balanceSheet.assets.fixed" stripe>
                  <el-table-column prop="code" label="科目代碼" width="120" />
                  <el-table-column prop="name" label="科目名稱" />
                  <el-table-column prop="balance" label="金額" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.balance) }}
                    </template>
                  </el-table-column>
                </el-table>
                <div class="subtotal">
                  固定資產合計：{{ formatCurrency(balanceSheet.assets.fixedTotal) }}
                </div>
              </div>

              <div class="total">
                資產總計：{{ formatCurrency(balanceSheet.assets.total) }}
              </div>
            </div>

            <div class="liabilities-equity-section">
              <h3>負債及淨資產</h3>
              
              <div class="liability-category">
                <h4>流動負債</h4>
                <el-table :data="balanceSheet.liabilities.current" stripe>
                  <el-table-column prop="code" label="科目代碼" width="120" />
                  <el-table-column prop="name" label="科目名稱" />
                  <el-table-column prop="balance" label="金額" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.balance) }}
                    </template>
                  </el-table-column>
                </el-table>
                <div class="subtotal">
                  流動負債合計：{{ formatCurrency(balanceSheet.liabilities.currentTotal) }}
                </div>
              </div>

              <div class="liability-category">
                <h4>長期負債</h4>
                <el-table :data="balanceSheet.liabilities.longTerm" stripe>
                  <el-table-column prop="code" label="科目代碼" width="120" />
                  <el-table-column prop="name" label="科目名稱" />
                  <el-table-column prop="balance" label="金額" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.balance) }}
                    </template>
                  </el-table-column>
                </el-table>
                <div class="subtotal">
                  長期負債合計：{{ formatCurrency(balanceSheet.liabilities.longTermTotal) }}
                </div>
              </div>

              <div class="equity-category">
                <h4>淨資產</h4>
                <el-table :data="balanceSheet.equity.items" stripe>
                  <el-table-column prop="code" label="科目代碼" width="120" />
                  <el-table-column prop="name" label="科目名稱" />
                  <el-table-column prop="balance" label="金額" align="right">
                    <template #default="{ row }">
                      {{ formatCurrency(row.balance) }}
                    </template>
                  </el-table-column>
                </el-table>
                <div class="subtotal">
                  淨資產合計：{{ formatCurrency(balanceSheet.equity.total) }}
                </div>
              </div>

              <div class="total">
                負債及淨資產總計：{{ formatCurrency(balanceSheet.totalLiabilitiesAndEquity) }}
              </div>

              <div class="balance-check" :class="{ 'balanced': balanceSheet.isBalanced, 'unbalanced': !balanceSheet.isBalanced }">
                <el-icon v-if="balanceSheet.isBalanced"><Check /></el-icon>
                <el-icon v-else><Warning /></el-icon>
                {{ balanceSheet.isBalanced ? '資產負債平衡' : '資產負債不平衡' }}
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 損益表 -->
      <el-tab-pane label="損益表" name="income-statement">
        <div class="report-container">
          <div class="report-header">
            <h2>損益表</h2>
            <div class="report-actions">
              <el-button @click="exportReport('income-statement', 'json')">
                <el-icon><Download /></el-icon>
                匯出 JSON
              </el-button>
              <el-button @click="exportReport('income-statement', 'csv')">
                <el-icon><Document /></el-icon>
                匯出 CSV
              </el-button>
            </div>
          </div>

          <div class="income-statement">
            <div class="revenue-section">
              <h3>收入</h3>
              <el-table :data="incomeStatement.revenues.items" stripe>
                <el-table-column prop="code" label="科目代碼" width="120" />
                <el-table-column prop="name" label="科目名稱" />
                <el-table-column prop="amount" label="金額" align="right">
                  <template #default="{ row }">
                    {{ formatCurrency(row.amount) }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="subtotal">
                收入合計：{{ formatCurrency(incomeStatement.revenues.total) }}
              </div>
            </div>

            <div class="expense-section">
              <h3>支出</h3>
              <el-table :data="incomeStatement.expenses.items" stripe>
                <el-table-column prop="code" label="科目代碼" width="120" />
                <el-table-column prop="name" label="科目名稱" />
                <el-table-column prop="amount" label="金額" align="right">
                  <template #default="{ row }">
                    {{ formatCurrency(row.amount) }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="subtotal">
                支出合計：{{ formatCurrency(incomeStatement.expenses.total) }}
              </div>
            </div>

            <div class="net-income-section">
              <div class="net-income" :class="{ 'profit': incomeStatement.netIncome > 0, 'loss': incomeStatement.netIncome < 0 }">
                <h3>本期損益：{{ formatCurrency(incomeStatement.netIncome) }}</h3>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 現金流量表 -->
      <el-tab-pane label="現金流量表" name="cash-flow">
        <div class="report-container">
          <div class="report-header">
            <h2>現金流量表</h2>
            <div class="report-actions">
              <el-button @click="exportReport('cash-flow', 'json')">
                <el-icon><Download /></el-icon>
                匯出 JSON
              </el-button>
              <el-button @click="exportReport('cash-flow', 'csv')">
                <el-icon><Document /></el-icon>
                匯出 CSV
              </el-button>
            </div>
          </div>

          <div class="cash-flow-statement">
            <div class="operating-section">
              <h3>營業活動現金流量</h3>
              <div class="cash-flow-item">
                <span>本期淨利</span>
                <span>{{ formatCurrency(cashFlowStatement.operating.netIncome) }}</span>
              </div>
              <div class="cash-flow-item">
                <span>折舊攤銷</span>
                <span>{{ formatCurrency(cashFlowStatement.operating.depreciation) }}</span>
              </div>
              <div class="cash-flow-item">
                <span>營運資金變動</span>
                <span>{{ formatCurrency(cashFlowStatement.operating.workingCapitalChange) }}</span>
              </div>
              <div class="subtotal">
                營業活動現金流量：{{ formatCurrency(cashFlowStatement.operating.total) }}
              </div>
            </div>

            <div class="investing-section">
              <h3>投資活動現金流量</h3>
              <div class="cash-flow-item">
                <span>資產購置</span>
                <span>{{ formatCurrency(-cashFlowStatement.investing.assetPurchases) }}</span>
              </div>
              <div class="cash-flow-item">
                <span>資產處分</span>
                <span>{{ formatCurrency(cashFlowStatement.investing.assetSales) }}</span>
              </div>
              <div class="subtotal">
                投資活動現金流量：{{ formatCurrency(cashFlowStatement.investing.total) }}
              </div>
            </div>

            <div class="financing-section">
              <h3>融資活動現金流量</h3>
              <div class="cash-flow-item">
                <span>借款增加</span>
                <span>{{ formatCurrency(cashFlowStatement.financing.borrowings) }}</span>
              </div>
              <div class="cash-flow-item">
                <span>借款償還</span>
                <span>{{ formatCurrency(-cashFlowStatement.financing.repayments) }}</span>
              </div>
              <div class="cash-flow-item">
                <span>捐款收入</span>
                <span>{{ formatCurrency(cashFlowStatement.financing.donations) }}</span>
              </div>
              <div class="subtotal">
                融資活動現金流量：{{ formatCurrency(cashFlowStatement.financing.total) }}
              </div>
            </div>

            <div class="net-cash-flow">
              <h3>現金及約當現金淨增加：{{ formatCurrency(cashFlowStatement.netCashFlow) }}</h3>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 財務比率分析 -->
      <el-tab-pane label="財務比率分析" name="financial-ratios">

      <!-- 進階分析 -->
      <el-tab-pane label="進階分析" name="advanced-analytics">
        <div class="report-container">
          <div class="report-header">
            <h2>財務比率分析</h2>
            <div class="report-actions">
              <el-button @click="exportReport('financial-ratios', 'json')">
                <el-icon><Download /></el-icon>
                匯出 JSON
              </el-button>
            </div>
          </div>

          <div class="financial-ratios">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="ratio-card">
                  <template #header>
                    <h3>流動性比率</h3>
                  </template>
                  <div class="ratio-item">
                    <span>流動比率</span>
                    <span>{{ formatRatio(financialRatios.liquidity.currentRatio) }}</span>
                  </div>
                  <div class="ratio-item">
                    <span>速動比率</span>
                    <span>{{ formatRatio(financialRatios.liquidity.quickRatio) }}</span>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="ratio-card">
                  <template #header>
                    <h3>效率比率</h3>
                  </template>
                  <div class="ratio-item">
                    <span>資產週轉率</span>
                    <span>{{ formatRatio(financialRatios.efficiency.assetTurnover) }}</span>
                  </div>
                  <div class="ratio-item">
                    <span>應收帳款週轉率</span>
                    <span>{{ formatRatio(financialRatios.efficiency.receivablesTurnover) }}</span>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="ratio-card">
                  <template #header>
                    <h3>獲利能力比率</h3>
                  </template>
                  <div class="ratio-item">
                    <span>淨利率</span>
                    <span>{{ formatPercentage(financialRatios.profitability.netProfitMargin) }}</span>
                  </div>
                  <div class="ratio-item">
                    <span>資產報酬率</span>
                    <span>{{ formatPercentage(financialRatios.profitability.returnOnAssets) }}</span>
                  </div>
                  <div class="ratio-item">
                    <span>淨資產報酬率</span>
                    <span>{{ formatPercentage(financialRatios.profitability.returnOnEquity) }}</span>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="ratio-card">
                  <template #header>
                    <h3>槓桿比率</h3>
                  </template>
                  <div class="ratio-item">
                    <span>負債比率</span>
                    <span>{{ formatPercentage(financialRatios.leverage.debtRatio) }}</span>
                  </div>
                  <div class="ratio-item">
                    <span>權益比率</span>
                    <span>{{ formatPercentage(financialRatios.leverage.equityRatio) }}</span>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Document, Check, Warning } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useReportsStore } from '@/stores/reports'

const reportsStore = useReportsStore()

// 響應式數據
const activeTab = ref('balance-sheet')
const dateRange = ref([
  dayjs().startOf('year').format('YYYY-MM-DD'),
  dayjs().endOf('year').format('YYYY-MM-DD')
])

// 計算屬性
const balanceSheet = computed(() => reportsStore.balanceSheet)
const incomeStatement = computed(() => reportsStore.incomeStatement)
const cashFlowStatement = computed(() => reportsStore.cashFlowStatement)
const financialRatios = computed(() => reportsStore.financialRatios)

// 方法
const handlePeriodChange = (dates) => {
  if (dates && dates.length === 2) {
    reportsStore.setReportPeriod(dates[0], dates[1])
  }
}

const setQuickPeriod = (period) => {
  let startDate, endDate
  
  switch (period) {
    case 'thisMonth':
      startDate = dayjs().startOf('month')
      endDate = dayjs().endOf('month')
      break
    case 'thisQuarter':
      startDate = dayjs().startOf('quarter')
      endDate = dayjs().endOf('quarter')
      break
    case 'thisYear':
      startDate = dayjs().startOf('year')
      endDate = dayjs().endOf('year')
      break
    case 'lastYear':
      startDate = dayjs().subtract(1, 'year').startOf('year')
      endDate = dayjs().subtract(1, 'year').endOf('year')
      break
  }
  
  dateRange.value = [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')]
  reportsStore.setReportPeriod(startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'))
}

const exportReport = (reportType, format) => {
  try {
    const reportData = reportsStore.exportReport(reportType, format)
    
    // 創建下載連結
    const blob = new Blob([reportData], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${reportType}-${dayjs().format('YYYY-MM-DD')}.${format}`
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('報表匯出成功')
  } catch (error) {
    console.error('匯出報表失敗:', error)
    ElMessage.error('匯出報表失敗')
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

const formatRatio = (ratio) => {
  return (ratio || 0).toFixed(2)
}

const formatPercentage = (ratio) => {
  return ((ratio || 0) * 100).toFixed(2) + '%'
}

// 生命週期
onMounted(() => {
  reportsStore.setReportPeriod(dateRange.value[0], dateRange.value[1])
})
</script>

<style scoped>
.financial-reports {
  padding: 20px;
}

.reports-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.period-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.period-buttons .el-button {
  font-size: 12px;
}

.reports-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.report-container {
  max-width: 100%;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.report-actions {
  display: flex;
  gap: 8px;
}

.balance-sheet {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

.asset-category,
.liability-category,
.equity-category {
  margin-bottom: 24px;
}

.asset-category h4,
.liability-category h4,
.equity-category h4 {
  margin: 16px 0 8px 0;
  color: #303133;
  font-weight: 600;
}

.subtotal {
  text-align: right;
  font-weight: 600;
  margin: 8px 0;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total {
  text-align: right;
  font-weight: bold;
  font-size: 18px;
  margin: 16px 0;
  padding: 12px;
  background-color: #e6f7ff;
  border-radius: 4px;
  color: #1890ff;
}

.balance-check {
  text-align: center;
  padding: 12px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 16px;
}

.balance-check.balanced {
  background-color: #f6ffed;
  color: #52c41a;
}

.balance-check.unbalanced {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.income-statement {
  max-width: 800px;
}

.revenue-section,
.expense-section {
  margin-bottom: 32px;
}

.net-income-section {
  text-align: center;
  margin-top: 32px;
}

.net-income {
  padding: 16px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: bold;
}

.net-income.profit {
  background-color: #f6ffed;
  color: #52c41a;
}

.net-income.loss {
  background-color: #fff2f0;
  color: #ff4d4f;
}

.cash-flow-statement {
  max-width: 600px;
}

.operating-section,
.investing-section,
.financing-section {
  margin-bottom: 32px;
}

.cash-flow-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.net-cash-flow {
  text-align: center;
  margin-top: 32px;
  padding: 16px;
  background-color: #e6f7ff;
  border-radius: 8px;
  color: #1890ff;
}

.financial-ratios {
  margin-top: 20px;
}

.ratio-card {
  margin-bottom: 20px;
}

.ratio-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ratio-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .balance-sheet {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .reports-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .period-selector {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
