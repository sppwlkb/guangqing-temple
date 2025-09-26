import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import CryptoJS from 'crypto-js'

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const currentUser = ref(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const sessionTimeout = ref(null)
  const auditLogs = ref([])

  // 用戶角色定義
  const roles = {
    admin: {
      name: '系統管理員',
      permissions: [
        'user_management',
        'system_settings',
        'data_export',
        'audit_logs',
        'financial_reports',
        'believers_management',
        'income_management',
        'expense_management',
        'accounting_management'
      ]
    },
    manager: {
      name: '主管',
      permissions: [
        'financial_reports',
        'believers_management',
        'income_management',
        'expense_management',
        'data_export'
      ]
    },
    accountant: {
      name: '會計',
      permissions: [
        'financial_reports',
        'income_management',
        'expense_management',
        'accounting_management'
      ]
    },
    staff: {
      name: '一般職員',
      permissions: [
        'income_management',
        'expense_management',
        'believers_management'
      ]
    },
    viewer: {
      name: '查看者',
      permissions: [
        'financial_reports'
      ]
    }
  }

  // 計算屬性
  const userRole = computed(() => {
    return currentUser.value?.role || 'viewer'
  })

  const userPermissions = computed(() => {
    return roles[userRole.value]?.permissions || []
  })

  const isAdmin = computed(() => userRole.value === 'admin')
  const isManager = computed(() => userRole.value === 'manager')

  // 方法 - 身份驗證
  async function login(credentials) {
    loading.value = true
    error.value = null
    
    try {
      // 模擬登入驗證
      const user = await validateCredentials(credentials)
      
      if (user) {
        currentUser.value = user
        isAuthenticated.value = true
        
        // 設定會話超時
        setSessionTimeout()
        
        // 記錄登入日誌
        logAuditEvent('login', '用戶登入', { userId: user.id, username: user.username })
        
        // 儲存到本地（加密）
        saveUserSession(user)
        
        return { success: true, user }
      } else {
        throw new Error('帳號或密碼錯誤')
      }
    } catch (err) {
      error.value = err.message
      logAuditEvent('login_failed', '登入失敗', { username: credentials.username, error: err.message })
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      // 記錄登出日誌
      if (currentUser.value) {
        logAuditEvent('logout', '用戶登出', { userId: currentUser.value.id, username: currentUser.value.username })
      }
      
      // 清除會話
      clearSession()
      
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function changePassword(oldPassword, newPassword) {
    try {
      if (!currentUser.value) {
        throw new Error('用戶未登入')
      }
      
      // 驗證舊密碼
      const isValidOldPassword = await verifyPassword(currentUser.value.id, oldPassword)
      if (!isValidOldPassword) {
        throw new Error('舊密碼錯誤')
      }
      
      // 更新密碼
      const hashedPassword = hashPassword(newPassword)
      await updateUserPassword(currentUser.value.id, hashedPassword)
      
      // 記錄密碼變更日誌
      logAuditEvent('password_change', '密碼變更', { userId: currentUser.value.id })
      
      return { success: true }
    } catch (err) {
      logAuditEvent('password_change_failed', '密碼變更失敗', { 
        userId: currentUser.value?.id, 
        error: err.message 
      })
      return { success: false, error: err.message }
    }
  }

  // 方法 - 權限檢查
  function hasPermission(permission) {
    return userPermissions.value.includes(permission)
  }

  function hasAnyPermission(permissions) {
    return permissions.some(permission => hasPermission(permission))
  }

  function hasAllPermissions(permissions) {
    return permissions.every(permission => hasPermission(permission))
  }

  function requirePermission(permission) {
    if (!hasPermission(permission)) {
      throw new Error(`需要 ${permission} 權限`)
    }
  }

  // 方法 - 會話管理
  function setSessionTimeout() {
    // 清除現有超時
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
    }
    
    // 設定30分鐘超時
    sessionTimeout.value = setTimeout(() => {
      logAuditEvent('session_timeout', '會話超時', { userId: currentUser.value?.id })
      clearSession()
    }, 30 * 60 * 1000)
  }

  function refreshSession() {
    if (isAuthenticated.value) {
      setSessionTimeout()
      logAuditEvent('session_refresh', '會話刷新', { userId: currentUser.value?.id })
    }
  }

  function clearSession() {
    currentUser.value = null
    isAuthenticated.value = false
    
    if (sessionTimeout.value) {
      clearTimeout(sessionTimeout.value)
      sessionTimeout.value = null
    }
    
    // 清除本地儲存
    localStorage.removeItem('temple-user-session')
    sessionStorage.clear()
  }

  // 方法 - 資料加密
  function encryptData(data, key = 'temple-secret-key') {
    try {
      return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
    } catch (err) {
      console.error('資料加密失敗:', err)
      return null
    }
  }

  function decryptData(encryptedData, key = 'temple-secret-key') {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key)
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
    } catch (err) {
      console.error('資料解密失敗:', err)
      return null
    }
  }

  // 方法 - 審計日誌
  function logAuditEvent(action, description, details = {}) {
    const auditEvent = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      action,
      description,
      userId: currentUser.value?.id || 'anonymous',
      username: currentUser.value?.username || 'anonymous',
      userRole: currentUser.value?.role || 'unknown',
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      details,
      severity: getSeverityLevel(action)
    }
    
    auditLogs.value.unshift(auditEvent)
    
    // 保持最近1000條記錄
    if (auditLogs.value.length > 1000) {
      auditLogs.value = auditLogs.value.slice(0, 1000)
    }
    
    // 儲存到本地
    saveAuditLogs()
    
    // 高風險操作立即上報
    if (auditEvent.severity === 'high') {
      reportSecurityEvent(auditEvent)
    }
  }

  function getAuditLogs(filters = {}) {
    let logs = [...auditLogs.value]
    
    // 時間範圍篩選
    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate)
    }
    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate)
    }
    
    // 用戶篩選
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId)
    }
    
    // 操作類型篩選
    if (filters.action) {
      logs = logs.filter(log => log.action.includes(filters.action))
    }
    
    // 嚴重程度篩選
    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity)
    }
    
    return logs
  }

  // 方法 - 安全性檢查
  function validatePasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    const score = Object.values(checks).filter(Boolean).length
    
    return {
      score,
      strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong',
      checks,
      isValid: score >= 3
    }
  }

  function detectSuspiciousActivity() {
    const recentLogs = auditLogs.value.slice(0, 100)
    const suspiciousPatterns = []
    
    // 檢測多次登入失敗
    const failedLogins = recentLogs.filter(log => 
      log.action === 'login_failed' && 
      Date.now() - new Date(log.timestamp).getTime() < 15 * 60 * 1000
    )
    
    if (failedLogins.length >= 5) {
      suspiciousPatterns.push({
        type: 'multiple_failed_logins',
        description: '15分鐘內多次登入失敗',
        count: failedLogins.length,
        severity: 'high'
      })
    }
    
    // 檢測異常時間登入
    const nightLogins = recentLogs.filter(log => {
      const hour = new Date(log.timestamp).getHours()
      return log.action === 'login' && (hour < 6 || hour > 22)
    })
    
    if (nightLogins.length > 0) {
      suspiciousPatterns.push({
        type: 'unusual_time_login',
        description: '非正常時間登入',
        count: nightLogins.length,
        severity: 'medium'
      })
    }
    
    return suspiciousPatterns
  }

  // 輔助函數
  async function validateCredentials(credentials) {
    // 模擬用戶資料庫
    const users = [
      {
        id: 'admin_001',
        username: 'admin',
        password: hashPassword('admin123'),
        role: 'admin',
        name: '系統管理員',
        email: 'admin@temple.com',
        isActive: true,
        lastLogin: null
      },
      {
        id: 'manager_001',
        username: 'manager',
        password: hashPassword('manager123'),
        role: 'manager',
        name: '主管',
        email: 'manager@temple.com',
        isActive: true,
        lastLogin: null
      },
      {
        id: 'staff_001',
        username: 'staff',
        password: hashPassword('staff123'),
        role: 'staff',
        name: '職員',
        email: 'staff@temple.com',
        isActive: true,
        lastLogin: null
      }
    ]
    
    const user = users.find(u => u.username === credentials.username)
    if (!user || !user.isActive) {
      return null
    }
    
    const isValidPassword = user.password === hashPassword(credentials.password)
    if (!isValidPassword) {
      return null
    }
    
    // 更新最後登入時間
    user.lastLogin = new Date().toISOString()
    
    // 移除密碼後返回
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  function hashPassword(password) {
    return CryptoJS.SHA256(password + 'temple-salt').toString()
  }

  async function verifyPassword(userId, password) {
    // 模擬密碼驗證
    return true
  }

  async function updateUserPassword(userId, hashedPassword) {
    // 模擬密碼更新
    return true
  }

  function saveUserSession(user) {
    const sessionData = encryptData({
      user,
      timestamp: Date.now()
    })
    
    if (sessionData) {
      localStorage.setItem('temple-user-session', sessionData)
    }
  }

  function loadUserSession() {
    try {
      const sessionData = localStorage.getItem('temple-user-session')
      if (!sessionData) return false
      
      const decrypted = decryptData(sessionData)
      if (!decrypted) return false
      
      // 檢查會話是否過期（24小時）
      const sessionAge = Date.now() - decrypted.timestamp
      if (sessionAge > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('temple-user-session')
        return false
      }
      
      currentUser.value = decrypted.user
      isAuthenticated.value = true
      setSessionTimeout()
      
      return true
    } catch (err) {
      console.error('載入用戶會話失敗:', err)
      return false
    }
  }

  function saveAuditLogs() {
    try {
      const encryptedLogs = encryptData(auditLogs.value)
      if (encryptedLogs) {
        localStorage.setItem('temple-audit-logs', encryptedLogs)
      }
    } catch (err) {
      console.error('儲存審計日誌失敗:', err)
    }
  }

  function loadAuditLogs() {
    try {
      const encryptedLogs = localStorage.getItem('temple-audit-logs')
      if (encryptedLogs) {
        const decrypted = decryptData(encryptedLogs)
        if (decrypted && Array.isArray(decrypted)) {
          auditLogs.value = decrypted
        }
      }
    } catch (err) {
      console.error('載入審計日誌失敗:', err)
    }
  }

  function generateAuditId() {
    return 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  function getSeverityLevel(action) {
    const highRiskActions = ['login_failed', 'password_change_failed', 'unauthorized_access', 'data_export']
    const mediumRiskActions = ['login', 'logout', 'password_change', 'user_create', 'user_delete']
    
    if (highRiskActions.includes(action)) return 'high'
    if (mediumRiskActions.includes(action)) return 'medium'
    return 'low'
  }

  function getClientIP() {
    // 在實際應用中，這需要從伺服器端獲取
    return '127.0.0.1'
  }

  function reportSecurityEvent(event) {
    // 在實際應用中，這裡會發送到安全監控系統
    console.warn('安全事件:', event)
  }

  // 初始化
  function initialize() {
    loadAuditLogs()
    const sessionLoaded = loadUserSession()
    
    if (sessionLoaded) {
      logAuditEvent('session_restore', '會話恢復', { userId: currentUser.value?.id })
    }
    
    return sessionLoaded
  }

  return {
    // 狀態
    currentUser,
    isAuthenticated,
    loading,
    error,
    auditLogs,

    // 計算屬性
    userRole,
    userPermissions,
    isAdmin,
    isManager,

    // 方法
    login,
    logout,
    changePassword,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
    refreshSession,
    encryptData,
    decryptData,
    logAuditEvent,
    getAuditLogs,
    validatePasswordStrength,
    detectSuspiciousActivity,
    initialize,

    // 常數
    roles
  }
})
