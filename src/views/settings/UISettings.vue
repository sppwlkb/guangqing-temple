<template>
  <div class="ui-settings">
    <div class="settings-header">
      <h1>界面設定</h1>
      <div class="header-actions">
        <el-button @click="resetToDefaults">
          <el-icon><RefreshLeft /></el-icon>
          重置為預設值
        </el-button>
        <el-button type="primary" @click="saveSettings">
          <el-icon><Check /></el-icon>
          儲存設定
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="settings-content">
          <!-- 主題設定 -->
          <el-card class="settings-card">
            <template #header>
              <h3>主題設定</h3>
            </template>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-label">
                  <h4>主題模式</h4>
                  <p>選擇您偏好的界面主題</p>
                </div>
                <div class="setting-control">
                  <el-radio-group v-model="theme" @change="setTheme">
                    <el-radio-button label="light">淺色</el-radio-button>
                    <el-radio-button label="dark">深色</el-radio-button>
                    <el-radio-button label="system">跟隨系統</el-radio-button>
                  </el-radio-group>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>字體大小</h4>
                  <p>調整界面文字大小</p>
                </div>
                <div class="setting-control">
                  <el-radio-group v-model="fontSize" @change="setFontSize">
                    <el-radio-button label="small">小</el-radio-button>
                    <el-radio-button label="medium">中</el-radio-button>
                    <el-radio-button label="large">大</el-radio-button>
                    <el-radio-button label="xlarge">特大</el-radio-button>
                  </el-radio-group>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>動畫速度</h4>
                  <p>調整界面動畫的播放速度</p>
                </div>
                <div class="setting-control">
                  <el-radio-group v-model="animationSpeed" @change="setAnimationSpeed">
                    <el-radio-button label="none">無動畫</el-radio-button>
                    <el-radio-button label="slow">慢</el-radio-button>
                    <el-radio-button label="normal">正常</el-radio-button>
                    <el-radio-button label="fast">快</el-radio-button>
                  </el-radio-group>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>緊湊模式</h4>
                  <p>減少界面元素間距，顯示更多內容</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="compactMode" @change="toggleCompactMode" />
                </div>
              </div>
            </div>
          </el-card>

          <!-- 無障礙設定 -->
          <el-card class="settings-card">
            <template #header>
              <h3>無障礙設定</h3>
            </template>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-label">
                  <h4>高對比度</h4>
                  <p>增強界面對比度，提高可讀性</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="highContrast" @change="toggleHighContrast" />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>減少動畫</h4>
                  <p>減少或停用界面動畫效果</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="reducedMotion" @change="toggleReducedMotion" />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>螢幕閱讀器優化</h4>
                  <p>優化界面以支援螢幕閱讀器</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="screenReader" @change="toggleScreenReader" />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>色盲友善模式</h4>
                  <p>調整色彩以適應不同類型的色盲</p>
                </div>
                <div class="setting-control">
                  <el-select v-model="colorBlindMode" @change="setColorBlindMode">
                    <el-option label="無" value="none" />
                    <el-option label="紅綠色盲 (Protanopia)" value="protanopia" />
                    <el-option label="綠紅色盲 (Deuteranopia)" value="deuteranopia" />
                    <el-option label="藍黃色盲 (Tritanopia)" value="tritanopia" />
                  </el-select>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>顯示工具提示</h4>
                  <p>顯示按鈕和功能的說明提示</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="showTooltips" />
                </div>
              </div>
            </div>
          </el-card>

          <!-- 通知設定 -->
          <el-card class="settings-card">
            <template #header>
              <h3>通知設定</h3>
            </template>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-label">
                  <h4>桌面通知</h4>
                  <p>允許顯示桌面通知</p>
                </div>
                <div class="setting-control">
                  <el-switch 
                    v-model="notifications.desktop" 
                    @change="updateNotificationSetting('desktop', $event)"
                  />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>通知音效</h4>
                  <p>播放通知音效</p>
                </div>
                <div class="setting-control">
                  <el-switch 
                    v-model="notifications.sound" 
                    @change="updateNotificationSetting('sound', $event)"
                  />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>震動提醒</h4>
                  <p>在支援的設備上使用震動提醒</p>
                </div>
                <div class="setting-control">
                  <el-switch 
                    v-model="notifications.vibration" 
                    @change="updateNotificationSetting('vibration', $event)"
                  />
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>通知權限</h4>
                  <p>瀏覽器通知權限狀態</p>
                </div>
                <div class="setting-control">
                  <el-tag :type="getNotificationPermissionType()">
                    {{ getNotificationPermissionText() }}
                  </el-tag>
                  <el-button 
                    v-if="Notification.permission === 'default'"
                    size="small" 
                    @click="requestNotificationPermission"
                  >
                    請求權限
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 用戶偏好設定 -->
          <el-card class="settings-card">
            <template #header>
              <h3>用戶偏好</h3>
            </template>
            
            <div class="setting-group">
              <div class="setting-item">
                <div class="setting-label">
                  <h4>預設視圖</h4>
                  <p>應用程式啟動時的預設頁面</p>
                </div>
                <div class="setting-control">
                  <el-select 
                    v-model="userPreferences.defaultView" 
                    @change="updateUserPreference('defaultView', $event)"
                  >
                    <el-option label="儀表板" value="dashboard" />
                    <el-option label="收入管理" value="income" />
                    <el-option label="支出管理" value="expense" />
                    <el-option label="財務報表" value="reports" />
                  </el-select>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>每頁顯示項目數</h4>
                  <p>列表頁面每頁顯示的項目數量</p>
                </div>
                <div class="setting-control">
                  <el-select 
                    v-model="userPreferences.itemsPerPage" 
                    @change="updateUserPreference('itemsPerPage', $event)"
                  >
                    <el-option label="10" :value="10" />
                    <el-option label="20" :value="20" />
                    <el-option label="50" :value="50" />
                    <el-option label="100" :value="100" />
                  </el-select>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>日期格式</h4>
                  <p>系統中日期的顯示格式</p>
                </div>
                <div class="setting-control">
                  <el-select 
                    v-model="userPreferences.dateFormat" 
                    @change="updateUserPreference('dateFormat', $event)"
                  >
                    <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                    <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
                    <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
                    <el-option label="YYYY年MM月DD日" value="YYYY年MM月DD日" />
                  </el-select>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>匯出格式</h4>
                  <p>資料匯出的預設格式</p>
                </div>
                <div class="setting-control">
                  <el-select 
                    v-model="userPreferences.exportFormat" 
                    @change="updateUserPreference('exportFormat', $event)"
                  >
                    <el-option label="Excel (.xlsx)" value="excel" />
                    <el-option label="CSV (.csv)" value="csv" />
                    <el-option label="PDF (.pdf)" value="pdf" />
                    <el-option label="JSON (.json)" value="json" />
                  </el-select>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-label">
                  <h4>自動儲存</h4>
                  <p>自動儲存表單資料</p>
                </div>
                <div class="setting-control">
                  <el-switch v-model="autoSave" />
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="settings-preview">
          <!-- 預覽區域 -->
          <el-card class="preview-card">
            <template #header>
              <h3>預覽</h3>
            </template>
            
            <div class="preview-content" :class="previewClasses">
              <div class="preview-header">
                <h4>廣清宮快速記帳軟體</h4>
                <div class="preview-actions">
                  <el-button size="small" type="primary">主要按鈕</el-button>
                  <el-button size="small">次要按鈕</el-button>
                </div>
              </div>
              
              <div class="preview-content-area">
                <div class="preview-card-demo">
                  <h5>示例卡片</h5>
                  <p>這是一個示例段落，用於展示當前的字體大小和主題設定。</p>
                  <div class="preview-stats">
                    <div class="stat-item">
                      <span class="stat-value">12,345</span>
                      <span class="stat-label">總收入</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-value">8,765</span>
                      <span class="stat-label">總支出</span>
                    </div>
                  </div>
                </div>
                
                <div class="preview-form-demo">
                  <el-form label-width="80px" size="small">
                    <el-form-item label="項目名稱">
                      <el-input placeholder="請輸入項目名稱" />
                    </el-form-item>
                    <el-form-item label="金額">
                      <el-input-number v-model="previewAmount" :min="0" />
                    </el-form-item>
                    <el-form-item label="類別">
                      <el-select placeholder="請選擇類別">
                        <el-option label="香油錢" value="donation" />
                        <el-option label="光明燈" value="lamp" />
                      </el-select>
                    </el-form-item>
                  </el-form>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 設定摘要 -->
          <el-card class="summary-card">
            <template #header>
              <h3>當前設定</h3>
            </template>
            
            <div class="settings-summary">
              <div class="summary-item">
                <span class="summary-label">主題:</span>
                <span class="summary-value">{{ getThemeText() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">字體大小:</span>
                <span class="summary-value">{{ getFontSizeText() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">螢幕尺寸:</span>
                <span class="summary-value">{{ getScreenSizeText() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">無障礙功能:</span>
                <span class="summary-value">{{ getAccessibilityText() }}</span>
              </div>
            </div>
          </el-card>

          <!-- 快速操作 -->
          <el-card class="quick-actions-card">
            <template #header>
              <h3>快速操作</h3>
            </template>
            
            <div class="quick-actions">
              <el-button @click="toggleTheme" block>
                <el-icon><Sunny /></el-icon>
                切換主題
              </el-button>
              <el-button @click="toggleSidebar" block>
                <el-icon><Fold /></el-icon>
                {{ sidebarCollapsed ? '展開' : '收合' }}側邊欄
              </el-button>
              <el-button @click="testNotification" block>
                <el-icon><Bell /></el-icon>
                測試通知
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  RefreshLeft, Check, Sunny, Fold, Bell 
} from '@element-plus/icons-vue'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()

// 響應式數據
const previewAmount = ref(1000)

// 計算屬性
const theme = computed({
  get: () => uiStore.theme,
  set: (value) => uiStore.setTheme(value)
})

const fontSize = computed({
  get: () => uiStore.fontSize,
  set: (value) => uiStore.setFontSize(value)
})

const animationSpeed = computed({
  get: () => uiStore.animationSpeed,
  set: (value) => uiStore.setAnimationSpeed(value)
})

const compactMode = computed({
  get: () => uiStore.compactMode,
  set: (value) => uiStore.toggleCompactMode()
})

const highContrast = computed({
  get: () => uiStore.highContrast,
  set: (value) => uiStore.toggleHighContrast()
})

const reducedMotion = computed({
  get: () => uiStore.reducedMotion,
  set: (value) => uiStore.toggleReducedMotion()
})

const screenReader = computed({
  get: () => uiStore.screenReader,
  set: (value) => uiStore.screenReader = value
})

const colorBlindMode = computed({
  get: () => uiStore.colorBlindMode,
  set: (value) => uiStore.setColorBlindMode(value)
})

const showTooltips = computed({
  get: () => uiStore.showTooltips,
  set: (value) => uiStore.showTooltips = value
})

const autoSave = computed({
  get: () => uiStore.autoSave,
  set: (value) => uiStore.autoSave = value
})

const notifications = computed(() => uiStore.notifications)
const userPreferences = computed(() => uiStore.userPreferences)
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)

const previewClasses = computed(() => {
  return [
    uiStore.accessibilityClasses,
    uiStore.responsiveClasses,
    `theme-${uiStore.theme}`,
    `font-${uiStore.fontSize}`
  ].join(' ')
})

// 方法
const setTheme = (value) => uiStore.setTheme(value)
const setFontSize = (value) => uiStore.setFontSize(value)
const setAnimationSpeed = (value) => uiStore.setAnimationSpeed(value)
const toggleCompactMode = () => uiStore.toggleCompactMode()
const toggleHighContrast = () => uiStore.toggleHighContrast()
const toggleReducedMotion = () => uiStore.toggleReducedMotion()
const toggleScreenReader = () => uiStore.screenReader = !uiStore.screenReader
const setColorBlindMode = (value) => uiStore.setColorBlindMode(value)
const updateNotificationSetting = (type, value) => uiStore.updateNotificationSetting(type, value)
const updateUserPreference = (key, value) => uiStore.updateUserPreference(key, value)
const toggleTheme = () => uiStore.toggleTheme()
const toggleSidebar = () => uiStore.toggleSidebar()

const requestNotificationPermission = async () => {
  try {
    const permission = await uiStore.requestNotificationPermission()
    if (permission === 'granted') {
      ElMessage.success('通知權限已授予')
    } else {
      ElMessage.warning('通知權限被拒絕')
    }
  } catch (error) {
    ElMessage.error('請求通知權限失敗')
  }
}

const testNotification = () => {
  uiStore.showNotification('測試通知', {
    body: '這是一個測試通知，用於驗證通知設定是否正常工作。',
    tag: 'test'
  })
}

const saveSettings = () => {
  uiStore.savePreferences()
  ElMessage.success('設定已儲存')
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm(
      '確定要重置所有設定為預設值嗎？此操作無法復原。',
      '確認重置',
      { type: 'warning' }
    )
    
    uiStore.resetToDefaults()
    ElMessage.success('設定已重置為預設值')
  } catch (error) {
    // 用戶取消
  }
}

// 工具函數
const getThemeText = () => {
  const themeMap = { light: '淺色', dark: '深色', system: '跟隨系統' }
  return themeMap[uiStore.theme] || '未知'
}

const getFontSizeText = () => {
  const sizeMap = { small: '小', medium: '中', large: '大', xlarge: '特大' }
  return sizeMap[uiStore.fontSize] || '未知'
}

const getScreenSizeText = () => {
  const sizeMap = { mobile: '手機', tablet: '平板', desktop: '桌面' }
  return sizeMap[uiStore.screenSize] || '未知'
}

const getAccessibilityText = () => {
  const features = []
  if (uiStore.highContrast) features.push('高對比度')
  if (uiStore.reducedMotion) features.push('減少動畫')
  if (uiStore.screenReader) features.push('螢幕閱讀器')
  if (uiStore.colorBlindMode !== 'none') features.push('色盲友善')
  return features.length > 0 ? features.join(', ') : '無'
}

const getNotificationPermissionText = () => {
  const permissionMap = {
    granted: '已授予',
    denied: '已拒絕',
    default: '未設定'
  }
  return permissionMap[Notification.permission] || '未知'
}

const getNotificationPermissionType = () => {
  const typeMap = {
    granted: 'success',
    denied: 'danger',
    default: 'warning'
  }
  return typeMap[Notification.permission] || 'info'
}
</script>

<style scoped>
.ui-settings {
  padding: 20px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.settings-content {
  display: grid;
  gap: 20px;
}

.settings-card {
  margin-bottom: 20px;
}

.setting-group {
  display: grid;
  gap: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.setting-label {
  flex: 1;
}

.setting-label h4 {
  margin: 0 0 4px 0;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 500;
}

.setting-label p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.settings-preview {
  position: sticky;
  top: 20px;
  display: grid;
  gap: 20px;
}

.preview-card {
  margin-bottom: 20px;
}

.preview-content {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  transition: all 0.3s ease;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.preview-header h4 {
  margin: 0;
  color: var(--color-text);
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content-area {
  display: grid;
  gap: 16px;
}

.preview-card-demo {
  padding: 16px;
  background: var(--color-surface);
  border-radius: 6px;
}

.preview-card-demo h5 {
  margin: 0 0 8px 0;
  color: var(--color-text);
}

.preview-card-demo p {
  margin: 0 0 16px 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.preview-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.preview-form-demo {
  padding: 16px;
  background: var(--color-surface);
  border-radius: 6px;
}

.settings-summary {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.summary-value {
  color: var(--color-text);
  font-weight: 500;
}

.quick-actions {
  display: grid;
  gap: 12px;
}

/* 主題樣式 */
.theme-dark .preview-content {
  background: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

.theme-dark .preview-card-demo,
.theme-dark .preview-form-demo {
  background: #1a1a1a;
}

/* 無障礙樣式 */
.high-contrast {
  filter: contrast(150%);
}

.reduced-motion * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.compact-mode .setting-item {
  gap: 12px;
}

.compact-mode .setting-group {
  gap: 16px;
}

.compact-mode .preview-content {
  padding: 12px;
}

/* 色盲友善樣式 */
.colorblind-protanopia {
  filter: url('#protanopia-filter');
}

.colorblind-deuteranopia {
  filter: url('#deuteranopia-filter');
}

.colorblind-tritanopia {
  filter: url('#tritanopia-filter');
}

/* 響應式設計 */
@media (max-width: 1200px) {
  .ui-settings .el-row {
    flex-direction: column;
  }
  
  .ui-settings .el-col {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .settings-preview {
    position: static;
  }
}

@media (max-width: 768px) {
  .settings-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .setting-item {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .setting-control {
    justify-content: flex-start;
  }
  
  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .preview-stats {
    justify-content: space-around;
  }
}
</style>
