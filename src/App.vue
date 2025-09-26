<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 頂部導航 -->
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo-section">
            <img src="/assets/temple-icon.svg" alt="廣清宮" class="logo" />
            <h1 class="app-title">廣清宮快速記帳軟體</h1>
          </div>
          <div class="header-actions">
            <el-button type="primary" @click="showQuickAdd = true">
              <el-icon><Plus /></el-icon>
              快速記帳
            </el-button>
            <el-button @click="syncData" :loading="syncing">
              <el-icon><Refresh /></el-icon>
              {{ syncing ? '同步中...' : '同步資料' }}
            </el-button>
            <el-dropdown @command="handleUserAction">
              <el-button circle>
                <el-icon><User /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">個人設定</el-dropdown-item>
                  <el-dropdown-item command="backup">資料備份</el-dropdown-item>
                  <el-dropdown-item command="about">關於軟體</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 側邊導航 -->
        <el-aside width="250px" class="app-sidebar">
          <el-menu
            :default-active="$route.path"
            router
            class="sidebar-menu"
            background-color="#f5f7fa"
            text-color="#303133"
            active-text-color="#409eff"
          >
            <el-menu-item index="/dashboard">
              <el-icon><Odometer /></el-icon>
              <span>總覽儀表板</span>
            </el-menu-item>
            
            <el-sub-menu index="income">
              <template #title>
                <el-icon><Money /></el-icon>
                <span>收入管理</span>
              </template>
              <el-menu-item index="/income/list">收入記錄</el-menu-item>
              <el-menu-item index="/income/add">新增收入</el-menu-item>
              <el-menu-item index="/income/categories">收入類別</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="expense">
              <template #title>
                <el-icon><Wallet /></el-icon>
                <span>支出管理</span>
              </template>
              <el-menu-item index="/expense/list">支出記錄</el-menu-item>
              <el-menu-item index="/expense/add">新增支出</el-menu-item>
              <el-menu-item index="/expense/categories">支出類別</el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/balance">
              <el-icon><Scale /></el-icon>
              <span>結餘管理</span>
            </el-menu-item>

            <el-sub-menu index="reports">
              <template #title>
                <el-icon><Document /></el-icon>
                <span>財務報表</span>
              </template>
              <el-menu-item index="/reports/financial">標準財務報表</el-menu-item>
              <el-menu-item index="/reports/analytics">進階財務分析</el-menu-item>
              <el-menu-item index="/reports/summary">收支總表</el-menu-item>
              <el-menu-item index="/reports/analysis">財務分析</el-menu-item>
              <el-menu-item index="/reports/trends">趨勢分析</el-menu-item>
              <el-menu-item index="/reports/export">匯出報表</el-menu-item>
            </el-sub-menu>

            <el-sub-menu index="accounting">
              <template #title>
                <el-icon><Odometer /></el-icon>
                <span>會計管理</span>
              </template>
              <el-menu-item index="/accounting/subjects">會計科目</el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/believers">
              <el-icon><User /></el-icon>
              <span>信眾管理</span>
            </el-menu-item>

            <el-sub-menu index="admin" v-if="isAdmin">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系統管理</span>
              </template>
              <el-menu-item index="/admin/security">安全性管理</el-menu-item>
            </el-sub-menu>

            <el-menu-item index="/reminders">
              <el-icon><Bell /></el-icon>
              <span>提醒通知</span>
            </el-menu-item>

            <el-sub-menu index="settings">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>系統設定</span>
              </template>
              <el-menu-item index="/settings/ui">界面設定</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </el-aside>

        <!-- 主要內容區域 -->
        <el-main class="app-main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <!-- 快速記帳對話框 -->
    <QuickAddDialog v-model="showQuickAdd" />

    <!-- 用戶反饋收集 -->
    <FeedbackCollector v-if="isDevelopment" />

    <!-- 狀態列 -->
    <div class="status-bar">
      <CloudSync />
      <span class="status-item">
        版本: v1.0.0
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from './stores/app'
import { useAuthStore } from './stores/auth'
import { useUIStore } from './stores/ui'
import {
  Plus, Refresh, User, Odometer, Money, Wallet,
  Scale, Document, Bell, Setting, Connection
} from '@element-plus/icons-vue'
import QuickAddDialog from './components/QuickAddDialog.vue'
import FeedbackCollector from './components/common/FeedbackCollector.vue'
import CloudSync from './components/CloudSync.vue'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

const showQuickAdd = ref(false)
const syncing = ref(false)
const isDevelopment = import.meta.env.DEV

const connectionStatus = computed(() => {
  return appStore.isOnline ? '已連線' : '離線模式'
})

const lastSyncTime = computed(() => {
  return appStore.lastSyncTime || '從未同步'
})

const isAdmin = computed(() => authStore.isAdmin)

const syncData = async () => {
  syncing.value = true
  try {
    await appStore.syncData()
    ElMessage.success('資料同步完成')
  } catch (error) {
    ElMessage.error('同步失敗: ' + error.message)
  } finally {
    syncing.value = false
  }
}

const handleUserAction = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'backup':
      appStore.createBackup()
      break
    case 'about':
      ElMessageBox.alert(
        '廣清宮快速記帳軟體 v1.0.0\n專為宮廟設計的記帳管理系統\n\n© 2024 廣清宮開發團隊',
        '關於軟體',
        { type: 'info' }
      )
      break
  }
}

onMounted(() => {
  // 初始化應用程式
  appStore.initialize()

  // 初始化身份驗證
  authStore.initialize()

  // 初始化 UI 設定
  uiStore.initialize()
  
  // 監聽 Electron 選單事件
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.on('menu-action', (event, action) => {
      switch (action) {
        case 'new-income':
          router.push('/income/add')
          break
        case 'new-expense':
          router.push('/expense/add')
          break
        case 'export-report':
          router.push('/reports/export')
          break
      }
    })
  }
})
</script>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 40px;
  height: 40px;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-sidebar {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.app-main {
  padding: 20px;
  background-color: #ffffff;
  overflow-y: auto;
}

.status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  background-color: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 12px;
  color: #909399;
  z-index: 1000;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>