<template>
  <div class="believers-management">
    <div class="management-header">
      <h1>信眾管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          新增信眾
        </el-button>
        <el-button @click="exportBelievers">
          <el-icon><Download /></el-icon>
          匯出資料
        </el-button>
      </div>
    </div>

    <!-- 統計概覽 -->
    <el-row :gutter="20" class="stats-overview">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ believerStats.total }}</div>
            <div class="stat-label">總信眾數</div>
          </div>
          <el-icon class="stat-icon"><User /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ believerStats.active }}</div>
            <div class="stat-label">活躍信眾</div>
          </div>
          <el-icon class="stat-icon"><UserFilled /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ believerStats.vip }}</div>
            <div class="stat-label">VIP信眾</div>
          </div>
          <el-icon class="stat-icon"><Crown /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ birthdayReminders.length }}</div>
            <div class="stat-label">近期生日</div>
          </div>
          <el-icon class="stat-icon"><Present /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜尋和篩選 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-input
            v-model="searchQuery"
            placeholder="搜尋信眾姓名、電話、信箱..."
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="levelFilter" placeholder="信眾等級" clearable>
            <el-option label="全部" value="" />
            <el-option label="VIP信眾" value="vip" />
            <el-option label="一般信眾" value="regular" />
            <el-option label="新信眾" value="new" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="genderFilter" placeholder="性別" clearable>
            <el-option label="全部" value="" />
            <el-option label="男性" value="male" />
            <el-option label="女性" value="female" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="ageFilter" placeholder="年齡層" clearable>
            <el-option label="全部" value="" />
            <el-option label="30歲以下" value="young" />
            <el-option label="30-60歲" value="middle" />
            <el-option label="60歲以上" value="senior" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button @click="resetFilters">重置篩選</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 信眾列表 -->
    <el-card class="believers-table-card">
      <el-table 
        :data="filteredAndSortedBelievers" 
        v-loading="loading"
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="believer-name">
              <span>{{ row.name }}</span>
              <el-tag 
                v-if="row.level === 'vip'" 
                type="warning" 
                size="small"
                class="level-tag"
              >
                VIP
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="gender" label="性別" width="80">
          <template #default="{ row }">
            {{ getGenderText(row.gender) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="age" label="年齡" width="80">
          <template #default="{ row }">
            {{ calculateAge(row.birthDate) }}歲
          </template>
        </el-table-column>
        
        <el-table-column prop="phone" label="電話" width="130" />
        
        <el-table-column prop="totalDonations" label="總捐款" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalDonations) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="donationCount" label="捐款次數" width="100" align="center" />
        
        <el-table-column prop="lastDonationDate" label="最後捐款" width="120">
          <template #default="{ row }">
            {{ row.lastDonationDate ? formatDate(row.lastDonationDate) : '無' }}
          </template>
        </el-table-column>
        
        <el-table-column prop="registrationDate" label="註冊日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.registrationDate) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click.stop="viewBeliever(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button size="small" type="primary" @click.stop="editBeliever(row)">
              <el-icon><Edit /></el-icon>
              編輯
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)" trigger="click">
              <el-button size="small">
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="certificate">開立證明</el-dropdown-item>
                  <el-dropdown-item command="services">個人化服務</el-dropdown-item>
                  <el-dropdown-item command="history">捐款歷史</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>刪除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="table-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredBelievers.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/編輯信眾對話框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingBeliever ? '編輯信眾' : '新增信眾'"
      width="600px"
    >
      <el-form 
        ref="believerFormRef" 
        :model="believerForm" 
        :rules="believerRules" 
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="believerForm.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性別" prop="gender">
              <el-select v-model="believerForm.gender" style="width: 100%">
                <el-option label="男性" value="male" />
                <el-option label="女性" value="female" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生日" prop="birthDate">
              <el-date-picker
                v-model="believerForm.birthDate"
                type="date"
                placeholder="選擇生日"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="電話" prop="phone">
              <el-input v-model="believerForm.phone" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="信箱" prop="email">
          <el-input v-model="believerForm.email" type="email" />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input v-model="believerForm.address" type="textarea" :rows="2" />
        </el-form-item>
        
        <el-form-item label="備註">
          <el-input v-model="believerForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="saveBeliever" :loading="saving">
            {{ editingBeliever ? '更新' : '新增' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 信眾詳情對話框 -->
    <el-dialog v-model="showDetailDialog" title="信眾詳情" width="800px">
      <div v-if="selectedBeliever" class="believer-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ selectedBeliever.name }}</el-descriptions-item>
          <el-descriptions-item label="等級">
            <el-tag :type="getLevelTagType(selectedBeliever.level)">
              {{ getLevelText(selectedBeliever.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="性別">{{ getGenderText(selectedBeliever.gender) }}</el-descriptions-item>
          <el-descriptions-item label="年齡">{{ calculateAge(selectedBeliever.birthDate) }}歲</el-descriptions-item>
          <el-descriptions-item label="電話">{{ selectedBeliever.phone }}</el-descriptions-item>
          <el-descriptions-item label="信箱">{{ selectedBeliever.email }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ selectedBeliever.address }}</el-descriptions-item>
          <el-descriptions-item label="總捐款">{{ formatCurrency(selectedBeliever.totalDonations) }}</el-descriptions-item>
          <el-descriptions-item label="捐款次數">{{ selectedBeliever.donationCount }}次</el-descriptions-item>
          <el-descriptions-item label="最後捐款">
            {{ selectedBeliever.lastDonationDate ? formatDate(selectedBeliever.lastDonationDate) : '無' }}
          </el-descriptions-item>
          <el-descriptions-item label="註冊日期">{{ formatDate(selectedBeliever.registrationDate) }}</el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedBeliever.notes" class="believer-notes">
          <h4>備註</h4>
          <p>{{ selectedBeliever.notes }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 生日提醒側邊欄 -->
    <el-drawer v-model="showBirthdayDrawer" title="近期生日提醒" size="400px">
      <div class="birthday-reminders">
        <div v-if="birthdayReminders.length === 0" class="no-birthdays">
          <el-empty description="近期沒有信眾生日" />
        </div>
        <div v-else>
          <div 
            v-for="reminder in birthdayReminders" 
            :key="reminder.believer.id"
            class="birthday-item"
          >
            <div class="birthday-info">
              <h4>{{ reminder.believer.name }}</h4>
              <p>{{ formatDate(reminder.date) }}</p>
              <el-tag :type="reminder.daysUntil === 0 ? 'danger' : 'warning'" size="small">
                {{ reminder.daysUntil === 0 ? '今天生日' : `${reminder.daysUntil}天後` }}
              </el-tag>
            </div>
            <div class="birthday-actions">
              <el-button size="small" @click="sendBirthdayGreeting(reminder.believer)">
                發送祝福
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Download, User, UserFilled, Crown, Present, Search, 
  View, Edit, ArrowDown 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useBelieversStore } from '@/stores/believers'

const believersStore = useBelieversStore()

// 響應式數據
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showBirthdayDrawer = ref(false)
const editingBeliever = ref(null)
const believerFormRef = ref()

// 篩選和分頁
const searchQuery = ref('')
const levelFilter = ref('')
const genderFilter = ref('')
const ageFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 表單數據
const believerForm = ref({
  name: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
})

// 表單驗證規則
const believerRules = {
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '請選擇性別', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '請輸入電話', trigger: 'blur' },
    { pattern: /^09\d{8}$/, message: '請輸入正確的手機號碼', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '請輸入正確的信箱格式', trigger: 'blur' }
  ]
}

// 計算屬性
const believerStats = computed(() => believersStore.believerStats)
const filteredBelievers = computed(() => {
  let result = believersStore.filteredBelievers
  
  // 等級篩選
  if (levelFilter.value) {
    result = result.filter(b => b.level === levelFilter.value)
  }
  
  // 性別篩選
  if (genderFilter.value) {
    result = result.filter(b => b.gender === genderFilter.value)
  }
  
  // 年齡篩選
  if (ageFilter.value) {
    result = result.filter(b => {
      const age = calculateAge(b.birthDate)
      switch (ageFilter.value) {
        case 'young': return age < 30
        case 'middle': return age >= 30 && age < 60
        case 'senior': return age >= 60
        default: return true
      }
    })
  }
  
  return result
})

const filteredAndSortedBelievers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredBelievers.value.slice(start, end)
})

const selectedBeliever = computed(() => believersStore.selectedBeliever)
const birthdayReminders = computed(() => believersStore.getBirthdayReminders())

// 方法
const handleRowClick = (row) => {
  believersStore.selectedBeliever = row
  showDetailDialog.value = true
}

const viewBeliever = (believer) => {
  believersStore.selectedBeliever = believer
  showDetailDialog.value = true
}

const editBeliever = (believer) => {
  editingBeliever.value = believer
  believerForm.value = { ...believer }
  showAddDialog.value = true
}

const saveBeliever = async () => {
  try {
    await believerFormRef.value.validate()
    saving.value = true
    
    if (editingBeliever.value) {
      await believersStore.updateBeliever(editingBeliever.value.id, believerForm.value)
      ElMessage.success('信眾資料已更新')
    } else {
      await believersStore.addBeliever(believerForm.value)
      ElMessage.success('信眾已新增')
    }
    
    showAddDialog.value = false
    resetForm()
  } catch (error) {
    ElMessage.error('操作失敗')
  } finally {
    saving.value = false
  }
}

const handleCommand = async (command, believer) => {
  switch (command) {
    case 'certificate':
      await generateCertificate(believer)
      break
    case 'services':
      showPersonalizedServices(believer)
      break
    case 'history':
      showDonationHistory(believer)
      break
    case 'delete':
      await deleteBeliever(believer)
      break
  }
}

const generateCertificate = async (believer) => {
  try {
    const year = dayjs().year()
    const certificate = await believersStore.generateDonationCertificate(believer.id, year)
    ElMessage.success('捐款證明已生成')
    // 這裡可以添加下載或列印證明的邏輯
  } catch (error) {
    ElMessage.error('生成證明失敗')
  }
}

const showPersonalizedServices = (believer) => {
  const services = believersStore.getPersonalizedServices(believer.id)
  // 顯示個人化服務對話框
  ElMessageBox.alert(
    services.map(s => `${s.name}: ${s.description}`).join('\n'),
    `${believer.name} 的個人化服務`,
    { type: 'info' }
  )
}

const showDonationHistory = (believer) => {
  const donations = believersStore.getBelieverssDonations(believer.id)
  // 這裡可以打開捐款歷史對話框
  ElMessage.info(`${believer.name} 共有 ${donations.length} 筆捐款記錄`)
}

const deleteBeliever = async (believer) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除信眾 ${believer.name} 嗎？此操作將設為非活躍狀態。`,
      '確認刪除',
      { type: 'warning' }
    )
    
    await believersStore.deleteBeliever(believer.id)
    ElMessage.success('信眾已刪除')
  } catch (error) {
    // 用戶取消
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  levelFilter.value = ''
  genderFilter.value = ''
  ageFilter.value = ''
  believersStore.searchQuery = ''
}

const resetForm = () => {
  believerForm.value = {
    name: '',
    gender: '',
    birthDate: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  }
  editingBeliever.value = null
}

const exportBelievers = () => {
  // 實現匯出功能
  const data = JSON.stringify(believersStore.believers, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `believers-${dayjs().format('YYYY-MM-DD')}.json`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('信眾資料已匯出')
}

const sendBirthdayGreeting = (believer) => {
  ElMessage.success(`已發送生日祝福給 ${believer.name}`)
}

// 工具函數
const calculateAge = (birthDate) => {
  if (!birthDate) return 0
  return dayjs().diff(dayjs(birthDate), 'year')
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount || 0)
}

const getGenderText = (gender) => {
  const genderMap = { male: '男', female: '女', other: '其他' }
  return genderMap[gender] || '未知'
}

const getLevelText = (level) => {
  const levelMap = { vip: 'VIP信眾', regular: '一般信眾', new: '新信眾' }
  return levelMap[level] || '未知'
}

const getLevelTagType = (level) => {
  const typeMap = { vip: 'warning', regular: 'success', new: 'info' }
  return typeMap[level] || 'info'
}

// 監聽搜尋查詢
believersStore.$subscribe((mutation, state) => {
  if (mutation.storeId === 'believers') {
    believersStore.searchQuery = searchQuery.value
  }
})

// 生命週期
onMounted(async () => {
  loading.value = true
  try {
    await believersStore.loadBelievers()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.believers-management {
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

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  position: relative;
  z-index: 2;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 48px;
  color: #e4e7ed;
  z-index: 1;
}

.search-card {
  margin-bottom: 20px;
}

.believers-table-card {
  margin-bottom: 20px;
}

.believer-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-tag {
  font-size: 10px;
}

.table-pagination {
  margin-top: 16px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.believer-detail {
  margin-bottom: 20px;
}

.believer-notes {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.believer-notes h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.believer-notes p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.birthday-reminders {
  padding: 16px;
}

.birthday-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 12px;
}

.birthday-info h4 {
  margin: 0 0 4px 0;
  color: #303133;
}

.birthday-info p {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
}

.no-birthdays {
  text-align: center;
  padding: 40px 0;
}

@media (max-width: 768px) {
  .management-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stats-overview .el-col {
    margin-bottom: 16px;
  }
  
  .search-card .el-row .el-col {
    margin-bottom: 12px;
  }
}
</style>
