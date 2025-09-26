<template>
  <div class="security-management">
    <div class="management-header">
      <h1>安全性管理</h1>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          重新整理
        </el-button>
        <el-button type="primary" @click="exportAuditLogs">
          <el-icon><Download /></el-icon>
          匯出日誌
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="security-tabs">
      <!-- 用戶權限管理 -->
      <el-tab-pane label="用戶權限" name="permissions">
        <div class="permissions-container">
          <el-card class="current-user-card">
            <template #header>
              <h3>當前用戶資訊</h3>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用戶名">{{ currentUser?.username }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ currentUser?.name }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag :type="getRoleTagType(currentUser?.role)">
                  {{ getRoleText(currentUser?.role) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="信箱">{{ currentUser?.email }}</el-descriptions-item>
              <el-descriptions-item label="最後登入">{{ formatDate(currentUser?.lastLogin) }}</el-descriptions-item>
              <el-descriptions-item label="狀態">
                <el-tag type="success">活躍</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="permissions-card">
            <template #header>
              <h3>權限列表</h3>
            </template>
            <div class="permissions-grid">
              <div 
                v-for="permission in allPermissions" 
                :key="permission.key"
                class="permission-item"
                :class="{ 'has-permission': hasPermission(permission.key) }"
              >
                <div class="permission-icon">
                  <el-icon v-if="hasPermission(permission.key)"><Check /></el-icon>
                  <el-icon v-else><Close /></el-icon>
                </div>
                <div class="permission-info">
                  <h4>{{ permission.name }}</h4>
                  <p>{{ permission.description }}</p>
                </div>
              </div>
            </div>
          </el-card>

          <el-card class="role-comparison-card">
            <template #header>
              <h3>角色權限對比</h3>
            </template>
            <el-table :data="roleComparisonData" stripe>
              <el-table-column prop="permission" label="權限" width="200" />
              <el-table-column 
                v-for="role in Object.keys(roles)" 
                :key="role"
                :label="roles[role].name"
                align="center"
                width="120"
              >
                <template #default="{ row }">
                  <el-icon v-if="row[role]" class="permission-check"><Check /></el-icon>
                  <el-icon v-else class="permission-cross"><Close /></el-icon>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 審計日誌 -->
      <el-tab-pane label="審計日誌" name="audit">
        <div class="audit-container">
          <el-card class="audit-filters-card">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-date-picker
                  v-model="auditFilters.dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="開始時間"
                  end-placeholder="結束時間"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                />
              </el-col>
              <el-col :span="4">
                <el-select v-model="auditFilters.severity" placeholder="嚴重程度" clearable>
                  <el-option label="全部" value="" />
                  <el-option label="高風險" value="high" />
                  <el-option label="中風險" value="medium" />
                  <el-option label="低風險" value="low" />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-input v-model="auditFilters.action" placeholder="操作類型" clearable />
              </el-col>
              <el-col :span="4">
                <el-input v-model="auditFilters.userId" placeholder="用戶ID" clearable />
              </el-col>
              <el-col :span="6">
                <el-button @click="filterAuditLogs">篩選</el-button>
                <el-button @click="resetAuditFilters">重置</el-button>
              </el-col>
            </el-row>
          </el-card>

          <el-card class="audit-logs-card">
            <template #header>
              <div class="audit-header">
                <h3>審計日誌</h3>
                <div class="audit-stats">
                  <el-tag>總計: {{ filteredAuditLogs.length }}</el-tag>
                  <el-tag type="danger">高風險: {{ highRiskCount }}</el-tag>
                  <el-tag type="warning">中風險: {{ mediumRiskCount }}</el-tag>
                </div>
              </div>
            </template>
            
            <el-table :data="paginatedAuditLogs" stripe>
              <el-table-column prop="timestamp" label="時間" width="180">
                <template #default="{ row }">
                  {{ formatDateTime(row.timestamp) }}
                </template>
              </el-table-column>
              
              <el-table-column prop="severity" label="嚴重程度" width="100">
                <template #default="{ row }">
                  <el-tag :type="getSeverityTagType(row.severity)">
                    {{ getSeverityText(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="action" label="操作" width="150" />
              <el-table-column prop="description" label="描述" />
              <el-table-column prop="username" label="用戶" width="120" />
              
              <el-table-column label="詳情" width="100">
                <template #default="{ row }">
                  <el-button size="small" @click="viewAuditDetail(row)">
                    <el-icon><View /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="audit-pagination">
              <el-pagination
                v-model:current-page="auditCurrentPage"
                v-model:page-size="auditPageSize"
                :page-sizes="[20, 50, 100]"
                :total="filteredAuditLogs.length"
                layout="total, sizes, prev, pager, next, jumper"
              />
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- 安全性監控 -->
      <el-tab-pane label="安全監控" name="monitoring">
        <div class="monitoring-container">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-card class="security-status-card">
                <template #header>
                  <h3>安全狀態</h3>
                </template>
                <div class="security-status">
                  <div class="status-item">
                    <el-icon class="status-icon success"><Check /></el-icon>
                    <span>系統安全</span>
                  </div>
                  <div class="status-item">
                    <el-icon class="status-icon warning"><Warning /></el-icon>
                    <span>{{ suspiciousActivities.length }} 個可疑活動</span>
                  </div>
                  <div class="status-item">
                    <el-icon class="status-icon info"><InfoFilled /></el-icon>
                    <span>最後檢查: {{ formatDateTime(new Date()) }}</span>
                  </div>
                </div>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="password-policy-card">
                <template #header>
                  <h3>密碼政策</h3>
                </template>
                <div class="password-policy">
                  <div class="policy-item">
                    <el-icon><Check /></el-icon>
                    <span>最少8個字符</span>
                  </div>
                  <div class="policy-item">
                    <el-icon><Check /></el-icon>
                    <span>包含大小寫字母</span>
                  </div>
                  <div class="policy-item">
                    <el-icon><Check /></el-icon>
                    <span>包含數字</span>
                  </div>
                  <div class="policy-item">
                    <el-icon><Check /></el-icon>
                    <span>包含特殊字符</span>
                  </div>
                </div>
                <el-button type="primary" @click="showChangePasswordDialog = true">
                  變更密碼
                </el-button>
              </el-card>
            </el-col>
            
            <el-col :span="8">
              <el-card class="session-info-card">
                <template #header>
                  <h3>會話資訊</h3>
                </template>
                <div class="session-info">
                  <div class="info-item">
                    <span class="label">會話超時:</span>
                    <span class="value">30分鐘</span>
                  </div>
                  <div class="info-item">
                    <span class="label">IP地址:</span>
                    <span class="value">127.0.0.1</span>
                  </div>
                  <div class="info-item">
                    <span class="label">瀏覽器:</span>
                    <span class="value">{{ getBrowserInfo() }}</span>
                  </div>
                </div>
                <el-button @click="refreshSession">刷新會話</el-button>
              </el-card>
            </el-col>
          </el-row>

          <el-card v-if="suspiciousActivities.length > 0" class="suspicious-activities-card">
            <template #header>
              <h3>可疑活動警告</h3>
            </template>
            <div class="suspicious-list">
              <div 
                v-for="activity in suspiciousActivities" 
                :key="activity.type"
                class="suspicious-item"
                :class="activity.severity"
              >
                <div class="suspicious-header">
                  <el-tag :type="activity.severity === 'high' ? 'danger' : 'warning'">
                    {{ activity.severity === 'high' ? '高風險' : '中風險' }}
                  </el-tag>
                  <h4>{{ activity.description }}</h4>
                </div>
                <p>檢測到 {{ activity.count }} 次相關活動</p>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 變更密碼對話框 -->
    <el-dialog v-model="showChangePasswordDialog" title="變更密碼" width="400px">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="舊密碼" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密碼" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
          <div class="password-strength">
            <span>密碼強度: </span>
            <el-tag :type="getPasswordStrengthType(passwordStrength.strength)">
              {{ getPasswordStrengthText(passwordStrength.strength) }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="確認密碼" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showChangePasswordDialog = false">取消</el-button>
          <el-button type="primary" @click="changePassword" :loading="changingPassword">
            變更密碼
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 審計日誌詳情對話框 -->
    <el-dialog v-model="showAuditDetailDialog" title="審計日誌詳情" width="600px">
      <div v-if="selectedAuditLog" class="audit-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="時間">{{ formatDateTime(selectedAuditLog.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="操作">{{ selectedAuditLog.action }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ selectedAuditLog.description }}</el-descriptions-item>
          <el-descriptions-item label="用戶">{{ selectedAuditLog.username }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ selectedAuditLog.userRole }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ selectedAuditLog.ipAddress }}</el-descriptions-item>
          <el-descriptions-item label="瀏覽器">{{ selectedAuditLog.userAgent }}</el-descriptions-item>
          <el-descriptions-item label="嚴重程度">
            <el-tag :type="getSeverityTagType(selectedAuditLog.severity)">
              {{ getSeverityText(selectedAuditLog.severity) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedAuditLog.details && Object.keys(selectedAuditLog.details).length > 0" class="audit-details">
          <h4>詳細資訊</h4>
          <pre>{{ JSON.stringify(selectedAuditLog.details, null, 2) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Refresh, Download, Check, Close, Warning, InfoFilled, View 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 響應式數據
const activeTab = ref('permissions')
const showChangePasswordDialog = ref(false)
const showAuditDetailDialog = ref(false)
const changingPassword = ref(false)
const selectedAuditLog = ref(null)
const passwordFormRef = ref()

// 審計日誌篩選
const auditFilters = ref({
  dateRange: [],
  severity: '',
  action: '',
  userId: ''
})
const auditCurrentPage = ref(1)
const auditPageSize = ref(20)

// 密碼變更表單
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '請輸入舊密碼', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    { min: 8, message: '密碼長度不能少於8位', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '請確認密碼', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 計算屬性
const currentUser = computed(() => authStore.currentUser)
const roles = computed(() => authStore.roles)
const userPermissions = computed(() => authStore.userPermissions)

const allPermissions = computed(() => [
  { key: 'user_management', name: '用戶管理', description: '管理系統用戶和權限' },
  { key: 'system_settings', name: '系統設定', description: '修改系統配置和參數' },
  { key: 'data_export', name: '資料匯出', description: '匯出系統資料' },
  { key: 'audit_logs', name: '審計日誌', description: '查看系統審計日誌' },
  { key: 'financial_reports', name: '財務報表', description: '查看和生成財務報表' },
  { key: 'believers_management', name: '信眾管理', description: '管理信眾資料' },
  { key: 'income_management', name: '收入管理', description: '管理收入記錄' },
  { key: 'expense_management', name: '支出管理', description: '管理支出記錄' },
  { key: 'accounting_management', name: '會計管理', description: '管理會計科目' }
])

const roleComparisonData = computed(() => {
  return allPermissions.value.map(permission => {
    const row = { permission: permission.name }
    Object.keys(roles.value).forEach(roleKey => {
      row[roleKey] = roles.value[roleKey].permissions.includes(permission.key)
    })
    return row
  })
})

const filteredAuditLogs = computed(() => {
  let logs = authStore.auditLogs
  
  if (auditFilters.value.dateRange && auditFilters.value.dateRange.length === 2) {
    logs = logs.filter(log => {
      const logTime = new Date(log.timestamp)
      return logTime >= new Date(auditFilters.value.dateRange[0]) && 
             logTime <= new Date(auditFilters.value.dateRange[1])
    })
  }
  
  if (auditFilters.value.severity) {
    logs = logs.filter(log => log.severity === auditFilters.value.severity)
  }
  
  if (auditFilters.value.action) {
    logs = logs.filter(log => log.action.includes(auditFilters.value.action))
  }
  
  if (auditFilters.value.userId) {
    logs = logs.filter(log => log.userId.includes(auditFilters.value.userId))
  }
  
  return logs
})

const paginatedAuditLogs = computed(() => {
  const start = (auditCurrentPage.value - 1) * auditPageSize.value
  const end = start + auditPageSize.value
  return filteredAuditLogs.value.slice(start, end)
})

const highRiskCount = computed(() => 
  filteredAuditLogs.value.filter(log => log.severity === 'high').length
)

const mediumRiskCount = computed(() => 
  filteredAuditLogs.value.filter(log => log.severity === 'medium').length
)

const suspiciousActivities = computed(() => authStore.detectSuspiciousActivity())

const passwordStrength = computed(() => 
  authStore.validatePasswordStrength(passwordForm.value.newPassword)
)

// 方法
const hasPermission = (permission) => authStore.hasPermission(permission)

const refreshData = () => {
  authStore.refreshSession()
  ElMessage.success('資料已刷新')
}

const exportAuditLogs = () => {
  const data = JSON.stringify(filteredAuditLogs.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('審計日誌已匯出')
}

const filterAuditLogs = () => {
  auditCurrentPage.value = 1
}

const resetAuditFilters = () => {
  auditFilters.value = {
    dateRange: [],
    severity: '',
    action: '',
    userId: ''
  }
  auditCurrentPage.value = 1
}

const viewAuditDetail = (log) => {
  selectedAuditLog.value = log
  showAuditDetailDialog.value = true
}

const changePassword = async () => {
  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true
    
    const result = await authStore.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )
    
    if (result.success) {
      ElMessage.success('密碼已變更')
      showChangePasswordDialog.value = false
      resetPasswordForm()
    } else {
      ElMessage.error(result.error || '密碼變更失敗')
    }
  } catch (error) {
    // 表單驗證失敗
  } finally {
    changingPassword.value = false
  }
}

const refreshSession = () => {
  authStore.refreshSession()
  ElMessage.success('會話已刷新')
}

const resetPasswordForm = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

// 驗證函數
function validateNewPassword(rule, value, callback) {
  const strength = authStore.validatePasswordStrength(value)
  if (!strength.isValid) {
    callback(new Error('密碼強度不足'))
  } else {
    callback()
  }
}

function validateConfirmPassword(rule, value, callback) {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('兩次輸入的密碼不一致'))
  } else {
    callback()
  }
}

// 工具函數
const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD') : '無'
}

const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getRoleText = (role) => {
  return roles.value[role]?.name || '未知'
}

const getRoleTagType = (role) => {
  const typeMap = { admin: 'danger', manager: 'warning', accountant: 'success', staff: 'info', viewer: '' }
  return typeMap[role] || 'info'
}

const getSeverityText = (severity) => {
  const textMap = { high: '高風險', medium: '中風險', low: '低風險' }
  return textMap[severity] || '未知'
}

const getSeverityTagType = (severity) => {
  const typeMap = { high: 'danger', medium: 'warning', low: 'info' }
  return typeMap[severity] || 'info'
}

const getPasswordStrengthText = (strength) => {
  const textMap = { weak: '弱', medium: '中', strong: '強' }
  return textMap[strength] || '未知'
}

const getPasswordStrengthType = (strength) => {
  const typeMap = { weak: 'danger', medium: 'warning', strong: 'success' }
  return typeMap[strength] || 'info'
}

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return '未知'
}

// 生命週期
onMounted(() => {
  // 記錄訪問安全管理頁面
  authStore.logAuditEvent('security_page_access', '訪問安全管理頁面')
})
</script>

<style scoped>
.security-management {
  padding: 20px;
}

.management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.security-tabs {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.permissions-container,
.audit-container,
.monitoring-container {
  display: grid;
  gap: 20px;
}

.current-user-card,
.permissions-card,
.role-comparison-card {
  margin-bottom: 20px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.permission-item.has-permission {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.permission-icon {
  font-size: 24px;
}

.permission-item.has-permission .permission-icon {
  color: #67c23a;
}

.permission-item:not(.has-permission) .permission-icon {
  color: #f56c6c;
}

.permission-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.permission-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.permission-check {
  color: #67c23a;
  font-size: 18px;
}

.permission-cross {
  color: #f56c6c;
  font-size: 18px;
}

.audit-filters-card {
  margin-bottom: 20px;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.audit-stats {
  display: flex;
  gap: 8px;
}

.audit-pagination {
  margin-top: 16px;
  text-align: right;
}

.security-status {
  display: grid;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 20px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.warning {
  color: #e6a23c;
}

.status-icon.info {
  color: #409eff;
}

.password-policy {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.policy-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67c23a;
}

.session-info {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.label {
  color: #666;
}

.value {
  font-weight: 500;
}

.suspicious-list {
  display: grid;
  gap: 16px;
}

.suspicious-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.suspicious-item.high {
  border-left: 4px solid #f56c6c;
}

.suspicious-item.medium {
  border-left: 4px solid #e6a23c;
}

.suspicious-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.suspicious-header h4 {
  margin: 0;
  color: #303133;
}

.password-strength {
  margin-top: 8px;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.audit-detail {
  margin-bottom: 20px;
}

.audit-details {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.audit-details h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.audit-details pre {
  margin: 0;
  color: #666;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .permissions-grid {
    grid-template-columns: 1fr;
  }
  
  .audit-filters-card .el-row .el-col {
    margin-bottom: 12px;
  }
}
</style>
