import { createRouter, createWebHistory } from 'vue-router'

// 頁面組件
import Dashboard from '../views/Dashboard.vue'
import IncomeList from '../views/income/IncomeList.vue'
import IncomeAdd from '../views/income/IncomeAdd.vue'
import IncomeCategories from '../views/income/IncomeCategories.vue'
import ExpenseList from '../views/expense/ExpenseList.vue'
import ExpenseAdd from '../views/expense/ExpenseAdd.vue'
import ExpenseCategories from '../views/expense/ExpenseCategories.vue'
import Balance from '../views/Balance.vue'
import ReportsSummary from '../views/reports/ReportsSummary.vue'
import ReportsAnalysis from '../views/reports/ReportsAnalysis.vue'
import ReportsTrends from '../views/reports/ReportsTrends.vue'
import ReportsExport from '../views/reports/ReportsExport.vue'
import Reminders from '../views/Reminders.vue'
import Settings from '../views/Settings.vue'
import Profile from '../views/Profile.vue'
import SubjectManagement from '../views/accounting/SubjectManagement.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '總覽儀表板' }
  },
  {
    path: '/income/list',
    name: 'IncomeList',
    component: IncomeList,
    meta: { title: '收入記錄' }
  },
  {
    path: '/income/add',
    name: 'IncomeAdd',
    component: IncomeAdd,
    meta: { title: '新增收入' }
  },
  {
    path: '/income/categories',
    name: 'IncomeCategories',
    component: IncomeCategories,
    meta: { title: '收入類別管理' }
  },
  {
    path: '/expense/list',
    name: 'ExpenseList',
    component: ExpenseList,
    meta: { title: '支出記錄' }
  },
  {
    path: '/expense/add',
    name: 'ExpenseAdd',
    component: ExpenseAdd,
    meta: { title: '新增支出' }
  },
  {
    path: '/expense/categories',
    name: 'ExpenseCategories',
    component: ExpenseCategories,
    meta: { title: '支出類別管理' }
  },
  {
    path: '/balance',
    name: 'Balance',
    component: Balance,
    meta: { title: '結餘管理' }
  },
  {
    path: '/reports/summary',
    name: 'ReportsSummary',
    component: ReportsSummary,
    meta: { title: '收支總表' }
  },
  {
    path: '/reports/analysis',
    name: 'ReportsAnalysis',
    component: ReportsAnalysis,
    meta: { title: '財務分析' }
  },
  {
    path: '/reports/trends',
    name: 'ReportsTrends',
    component: ReportsTrends,
    meta: { title: '趨勢分析' }
  },
  {
    path: '/reports/export',
    name: 'ReportsExport',
    component: ReportsExport,
    meta: { title: '匯出報表' }
  },
  {
    path: '/reminders',
    name: 'Reminders',
    component: Reminders,
    meta: { title: '提醒通知' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '系統設定' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: '個人設定' }
  },
  {
    path: '/accounting/subjects',
    name: 'SubjectManagement',
    component: SubjectManagement,
    meta: { title: '會計科目管理' }
  },
  {
    path: '/reports/financial',
    name: 'FinancialReports',
    component: () => import('../views/reports/FinancialReports.vue'),
    meta: { title: '標準財務報表' }
  },
  {
    path: '/reports/analytics',
    name: 'AdvancedAnalytics',
    component: () => import('../views/reports/AdvancedAnalytics.vue'),
    meta: { title: '進階財務分析' }
  },
  {
    path: '/believers',
    name: 'BelieversManagement',
    component: () => import('../views/believers/BelieversManagement.vue'),
    meta: { title: '信眾管理' }
  },
  {
    path: '/admin/security',
    name: 'SecurityManagement',
    component: () => import('../views/admin/SecurityManagement.vue'),
    meta: { title: '安全性管理', requiresAuth: true, requiresPermission: 'system_settings' }
  },
  {
    path: '/settings/ui',
    name: 'UISettings',
    component: () => import('../views/settings/UISettings.vue'),
    meta: { title: '界面設定' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守衛
router.beforeEach((to, from, next) => {
  // 設定頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - 廣清宮快速記帳軟體`
  }
  next()
})

export default router