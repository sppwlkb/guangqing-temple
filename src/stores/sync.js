import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseService from '@/services/firebase'
import { useAccountingStore } from './accounting'
import { useIncomeStore } from './income'
import { useExpenseStore } from './expense'

export const useSyncStore = defineStore('sync', () => {
  // 狀態
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const lastSyncTime = ref(null)
  const syncProgress = ref(0)
  const syncStatus = ref('idle') // idle, syncing, success, error
  const syncError = ref(null)
  const pendingChanges = ref(0)
  const currentUser = ref(null)
  const isAuthenticated = ref(false)

  // 計算屬性
  const syncStatusText = computed(() => {
    switch (syncStatus.value) {
      case 'idle':
        return isOnline.value ? '已連線' : '離線模式'
      case 'syncing':
        return '同步中...'
      case 'success':
        return '同步完成'
      case 'error':
        return '同步失敗'
      default:
        return '未知狀態'
    }
  })

  const lastSyncText = computed(() => {
    if (!lastSyncTime.value) return '從未同步'
    
    const now = new Date()
    const lastSync = new Date(lastSyncTime.value)
    const diffMinutes = Math.floor((now - lastSync) / (1000 * 60))
    
    if (diffMinutes < 1) return '剛剛同步'
    if (diffMinutes < 60) return `${diffMinutes} 分鐘前`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} 小時前`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} 天前`
  })

  // 監聽網路狀態
  const setupNetworkListeners = () => {
    window.addEventListener('online', () => {
      isOnline.value = true
      autoSync()
    })

    window.addEventListener('offline', () => {
      isOnline.value = false
      syncStatus.value = 'idle'
    })
  }

  // 身份驗證相關
  const initAuth = () => {
    return firebaseService.onAuthStateChange((user) => {
      currentUser.value = user
      isAuthenticated.value = !!user
      
      if (user) {
        // 用戶登入後自動同步
        autoSync()
      }
    })
  }

  const signIn = async (email, password) => {
    try {
      const result = await firebaseService.signIn(email, password)
      if (result.success) {
        currentUser.value = result.user
        isAuthenticated.value = true
        await autoSync()
      }
      return result
    } catch (error) {
      console.error('登入失敗:', error)
      return { success: false, error: error.message }
    }
  }

  const signUp = async (email, password, displayName) => {
    try {
      const result = await firebaseService.signUp(email, password, displayName)
      if (result.success) {
        currentUser.value = result.user
        isAuthenticated.value = true
      }
      return result
    } catch (error) {
      console.error('註冊失敗:', error)
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const result = await firebaseService.signOut()
      if (result.success) {
        currentUser.value = null
        isAuthenticated.value = false
        lastSyncTime.value = null
      }
      return result
    } catch (error) {
      console.error('登出失敗:', error)
      return { success: false, error: error.message }
    }
  }

  // 同步功能
  const syncToCloud = async () => {
    if (!isAuthenticated.value || !isOnline.value || isSyncing.value) {
      return { success: false, error: '無法同步：未登入、離線或正在同步中' }
    }

    isSyncing.value = true
    syncStatus.value = 'syncing'
    syncProgress.value = 0
    syncError.value = null

    try {
      const accountingStore = useAccountingStore()
      const incomeStore = useIncomeStore()
      const expenseStore = useExpenseStore()

      // 同步收入記錄
      syncProgress.value = 20
      await syncIncomes(incomeStore.incomes)

      // 同步支出記錄
      syncProgress.value = 40
      await syncExpenses(expenseStore.expenses)

      // 同步會計科目
      syncProgress.value = 60
      await syncAccountingSubjects(accountingStore.subjects)

      // 同步提醒事項
      syncProgress.value = 80
      await syncReminders()

      // 同步設定
      syncProgress.value = 90
      await syncSettings()

      syncProgress.value = 100
      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'
      pendingChanges.value = 0

      // 儲存同步時間到本地
      localStorage.setItem('last-sync-time', lastSyncTime.value)

      return { success: true }
    } catch (error) {
      console.error('同步失敗:', error)
      syncStatus.value = 'error'
      syncError.value = error.message
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
      setTimeout(() => {
        if (syncStatus.value === 'success') {
          syncStatus.value = 'idle'
        }
      }, 3000)
    }
  }

  const syncFromCloud = async () => {
    if (!isAuthenticated.value || !isOnline.value) {
      return { success: false, error: '無法同步：未登入或離線' }
    }

    try {
      isSyncing.value = true
      syncStatus.value = 'syncing'

      // 從雲端載入收入資料
      const incomesResult = await firebaseService.getCollection('incomes', {
        where: [['userId', '==', currentUser.value.uid]],
        orderBy: [['createdAt', 'desc']]
      })

      if (incomesResult.success) {
        const incomeStore = useIncomeStore()
        incomeStore.incomes = incomesResult.data
        await incomeStore.saveIncomes()
      }

      // 載入支出資料
      const expensesResult = await firebaseService.getCollection('expenses', {
        where: [['userId', '==', currentUser.value.uid]],
        orderBy: [['createdAt', 'desc']]
      })

      if (expensesResult.success) {
        const expenseStore = useExpenseStore()
        expenseStore.expenses = expensesResult.data
        await expenseStore.saveExpenses()
      }

      // 載入會計科目
      const subjectsResult = await firebaseService.getCollection('accounting-subjects', {
        where: [['userId', '==', currentUser.value.uid]]
      })

      if (subjectsResult.success) {
        const accountingStore = useAccountingStore()
        accountingStore.subjects = subjectsResult.data.filter(s => !s.isDefault)
        await accountingStore.saveSubjects()
      }

      lastSyncTime.value = new Date().toISOString()
      syncStatus.value = 'success'

      return { success: true }
    } catch (error) {
      console.error('從雲端同步失敗:', error)
      syncStatus.value = 'error'
      syncError.value = error.message
      return { success: false, error: error.message }
    } finally {
      isSyncing.value = false
    }
  }

  // 自動同步
  const autoSync = async () => {
    if (!isAuthenticated.value || !isOnline.value) return

    // 檢查是否需要同步
    const lastSync = localStorage.getItem('last-sync-time')
    if (lastSync) {
      const timeDiff = Date.now() - new Date(lastSync).getTime()
      const fiveMinutes = 5 * 60 * 1000
      
      if (timeDiff < fiveMinutes) {
        return // 5分鐘內已同步過，跳過
      }
    }

    await syncToCloud()
  }

  // 輔助同步函數
  const syncIncomes = async (incomes) => {
    const batch = []

    for (const income of incomes) {
      if (income.needsSync !== false) {
        batch.push({
          type: income.id.toString().startsWith('temp_') ? 'add' : 'set',
          collectionName: 'incomes',
          docId: income.id.toString().startsWith('temp_') ? null : income.id.toString(),
          data: {
            ...income,
            userId: currentUser.value.uid,
            syncedAt: new Date().toISOString()
          }
        })
      }
    }

    if (batch.length > 0) {
      await firebaseService.batchWrite(batch)
    }
  }

  const syncExpenses = async (expenses) => {
    const batch = []

    for (const expense of expenses) {
      if (expense.needsSync !== false) {
        batch.push({
          type: expense.id.toString().startsWith('temp_') ? 'add' : 'set',
          collectionName: 'expenses',
          docId: expense.id.toString().startsWith('temp_') ? null : expense.id.toString(),
          data: {
            ...expense,
            userId: currentUser.value.uid,
            syncedAt: new Date().toISOString()
          }
        })
      }
    }

    if (batch.length > 0) {
      await firebaseService.batchWrite(batch)
    }
  }

  const syncAccountingSubjects = async (subjects) => {
    const batch = []
    
    for (const subject of subjects) {
      if (!subject.isDefault) { // 只同步自定義科目
        batch.push({
          type: 'set',
          collectionName: 'accounting-subjects',
          docId: subject.id,
          data: {
            ...subject,
            userId: currentUser.value.uid
          }
        })
      }
    }

    if (batch.length > 0) {
      await firebaseService.batchWrite(batch)
    }
  }

  const syncReminders = async () => {
    // 實現提醒事項同步
    const reminders = JSON.parse(localStorage.getItem('temple-reminders') || '[]')
    
    for (const reminder of reminders) {
      await firebaseService.addDocument('reminders', {
        ...reminder,
        userId: currentUser.value.uid
      })
    }
  }

  const syncSettings = async () => {
    // 實現設定同步
    const settings = {
      theme: localStorage.getItem('theme') || 'light',
      language: localStorage.getItem('language') || 'zh-TW',
      autoSync: localStorage.getItem('auto-sync') !== 'false'
    }

    await firebaseService.updateDocument('user-settings', currentUser.value.uid, settings)
  }

  // 衝突解決
  const resolveConflict = async (localData, cloudData, resolution = 'cloud') => {
    try {
      if (resolution === 'cloud') {
        // 使用雲端資料
        return cloudData
      } else if (resolution === 'local') {
        // 使用本地資料
        await firebaseService.updateDocument(cloudData.collection, cloudData.id, localData)
        return localData
      } else if (resolution === 'merge') {
        // 合併資料（以最新時間為準）
        const merged = {
          ...cloudData,
          ...localData,
          updatedAt: Math.max(
            new Date(localData.updatedAt).getTime(),
            new Date(cloudData.updatedAt).getTime()
          )
        }
        await firebaseService.updateDocument(cloudData.collection, cloudData.id, merged)
        return merged
      }
    } catch (error) {
      console.error('衝突解決失敗:', error)
      throw error
    }
  }

  // 初始化
  const initialize = () => {
    setupNetworkListeners()
    
    // 載入上次同步時間
    const lastSync = localStorage.getItem('last-sync-time')
    if (lastSync) {
      lastSyncTime.value = lastSync
    }

    // 初始化身份驗證
    return initAuth()
  }

  return {
    // 狀態
    isOnline,
    isSyncing,
    lastSyncTime,
    syncProgress,
    syncStatus,
    syncError,
    pendingChanges,
    currentUser,
    isAuthenticated,

    // 計算屬性
    syncStatusText,
    lastSyncText,

    // 方法
    initialize,
    signIn,
    signUp,
    signOut,
    syncToCloud,
    syncFromCloud,
    autoSync,
    resolveConflict
  }
})
