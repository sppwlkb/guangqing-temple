<template>
  <div class="cloud-sync">
    <!-- 同步狀態指示器 -->
    <div class="sync-status" :class="syncStatusClass">
      <el-icon class="status-icon">
        <Loading v-if="isSyncing" />
        <Connection v-else-if="isOnline && isAuthenticated" />
        <Warning v-else-if="!isOnline" />
        <Lock v-else />
      </el-icon>
      <span class="status-text">{{ syncStatusText }}</span>
      <span class="last-sync" v-if="lastSyncText">{{ lastSyncText }}</span>
    </div>

    <!-- 同步進度條 -->
    <el-progress 
      v-if="isSyncing" 
      :percentage="syncProgress" 
      :show-text="false"
      :stroke-width="2"
      class="sync-progress"
    />

    <!-- 同步控制按鈕 -->
    <div class="sync-controls">
      <el-button 
        v-if="!isAuthenticated"
        type="primary" 
        size="small"
        @click="showLoginDialog = true"
      >
        <el-icon><User /></el-icon>
        登入雲端
      </el-button>
      
      <template v-else>
        <el-button 
          size="small"
          @click="manualSync"
          :loading="isSyncing"
          :disabled="!isOnline"
        >
          <el-icon><Refresh /></el-icon>
          {{ isSyncing ? '同步中' : '手動同步' }}
        </el-button>
        
        <el-dropdown @command="handleCommand">
          <el-button size="small">
            <el-icon><Setting /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="download">從雲端下載</el-dropdown-item>
              <el-dropdown-item command="upload">上傳到雲端</el-dropdown-item>
              <el-dropdown-item divided command="logout">登出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </div>

    <!-- 登入對話框 -->
    <el-dialog v-model="showLoginDialog" title="雲端同步登入" width="400px">
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="80px">
        <el-form-item label="帳號" prop="email">
          <el-input v-model="loginForm.email" type="email" placeholder="請輸入電子郵件" />
        </el-form-item>
        <el-form-item label="密碼" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="請輸入密碼"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showLoginDialog = false">取消</el-button>
          <el-button type="primary" @click="handleLogin" :loading="loginLoading">
            登入
          </el-button>
          <el-button type="success" @click="showRegisterDialog = true">
            註冊新帳號
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 註冊對話框 -->
    <el-dialog v-model="showRegisterDialog" title="註冊新帳號" width="400px">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="80px">
        <el-form-item label="顯示名稱" prop="displayName">
          <el-input v-model="registerForm.displayName" placeholder="請輸入顯示名稱" />
        </el-form-item>
        <el-form-item label="電子郵件" prop="email">
          <el-input v-model="registerForm.email" type="email" placeholder="請輸入電子郵件" />
        </el-form-item>
        <el-form-item label="密碼" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="請輸入密碼"
            show-password
          />
        </el-form-item>
        <el-form-item label="確認密碼" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="請再次輸入密碼"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRegisterDialog = false">取消</el-button>
          <el-button type="primary" @click="handleRegister" :loading="registerLoading">
            註冊
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 錯誤提示 -->
    <el-alert
      v-if="syncError"
      :title="syncError"
      type="error"
      :closable="true"
      @close="syncError = null"
      class="sync-error"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Loading, Connection, Warning, Lock, User, Refresh, Setting 
} from '@element-plus/icons-vue'
import { useSyncStore } from '@/stores/sync'

const syncStore = useSyncStore()

// 響應式數據
const showLoginDialog = ref(false)
const showRegisterDialog = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginFormRef = ref()
const registerFormRef = ref()

// 表單數據
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// 表單驗證規則
const loginRules = {
  email: [
    { required: true, message: '請輸入電子郵件', trigger: 'blur' },
    { type: 'email', message: '請輸入正確的電子郵件格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於6位', trigger: 'blur' }
  ]
}

const registerRules = {
  displayName: [
    { required: true, message: '請輸入顯示名稱', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '請輸入電子郵件', trigger: 'blur' },
    { type: 'email', message: '請輸入正確的電子郵件格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '請輸入密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '請確認密碼', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('兩次輸入的密碼不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 計算屬性
const { 
  isOnline, 
  isSyncing, 
  syncProgress, 
  syncStatusText, 
  lastSyncText, 
  isAuthenticated,
  syncError,
  currentUser
} = syncStore

const syncStatusClass = computed(() => {
  if (isSyncing.value) return 'syncing'
  if (!isOnline.value) return 'offline'
  if (!isAuthenticated.value) return 'unauthenticated'
  return 'online'
})

// 方法
const manualSync = async () => {
  try {
    const result = await syncStore.syncToCloud()
    if (result.success) {
      ElMessage.success('同步完成')
    } else {
      ElMessage.error(result.error || '同步失敗')
    }
  } catch (error) {
    ElMessage.error('同步過程中發生錯誤')
  }
}

const handleCommand = async (command) => {
  switch (command) {
    case 'download':
      try {
        const result = await syncStore.syncFromCloud()
        if (result.success) {
          ElMessage.success('從雲端下載完成')
        } else {
          ElMessage.error(result.error || '下載失敗')
        }
      } catch (error) {
        ElMessage.error('下載過程中發生錯誤')
      }
      break
      
    case 'upload':
      await manualSync()
      break
      
    case 'logout':
      try {
        await ElMessageBox.confirm('確定要登出雲端同步嗎？', '確認登出', {
          confirmButtonText: '確定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const result = await syncStore.signOut()
        if (result.success) {
          ElMessage.success('已登出')
        } else {
          ElMessage.error(result.error || '登出失敗')
        }
      } catch (error) {
        // 用戶取消
      }
      break
  }
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    loginLoading.value = true
    
    const result = await syncStore.signIn(loginForm.value.email, loginForm.value.password)
    
    if (result.success) {
      ElMessage.success('登入成功')
      showLoginDialog.value = false
      loginForm.value = { email: '', password: '' }
    } else {
      ElMessage.error(result.error || '登入失敗')
    }
  } catch (error) {
    // 表單驗證失敗
  } finally {
    loginLoading.value = false
  }
}

const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    registerLoading.value = true
    
    const result = await syncStore.signUp(
      registerForm.value.email, 
      registerForm.value.password,
      registerForm.value.displayName
    )
    
    if (result.success) {
      ElMessage.success('註冊成功')
      showRegisterDialog.value = false
      showLoginDialog.value = false
      registerForm.value = { displayName: '', email: '', password: '', confirmPassword: '' }
    } else {
      ElMessage.error(result.error || '註冊失敗')
    }
  } catch (error) {
    // 表單驗證失敗
  } finally {
    registerLoading.value = false
  }
}

// 生命週期
let unsubscribeAuth = null

onMounted(() => {
  unsubscribeAuth = syncStore.initialize()
})

onUnmounted(() => {
  if (unsubscribeAuth) {
    unsubscribeAuth()
  }
})
</script>

<style scoped>
.cloud-sync {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.sync-status.online {
  background-color: #f0f9ff;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.sync-status.syncing {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.sync-status.offline {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.sync-status.unauthenticated {
  background-color: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.status-icon {
  font-size: 16px;
}

.status-text {
  font-weight: 500;
}

.last-sync {
  font-size: 12px;
  opacity: 0.7;
  margin-left: auto;
}

.sync-progress {
  margin: 4px 0;
}

.sync-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sync-error {
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .sync-status {
    font-size: 12px;
    padding: 6px 10px;
  }
  
  .sync-controls {
    flex-wrap: wrap;
  }
  
  .sync-controls .el-button {
    font-size: 12px;
  }
}
</style>
