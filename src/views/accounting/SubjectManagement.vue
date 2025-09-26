<template>
  <div class="subject-management">
    <el-card class="header-card">
      <template #header>
        <div class="card-header">
          <h2>會計科目管理</h2>
          <div class="header-actions">
            <el-button type="primary" @click="showAddDialog = true">
              <el-icon><Plus /></el-icon>
              新增科目
            </el-button>
            <el-button @click="resetToDefault" :loading="loading">
              <el-icon><Refresh /></el-icon>
              重置為預設
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="filterType" placeholder="選擇科目類型" clearable>
              <el-option label="全部" value="" />
              <el-option label="資產" value="asset" />
              <el-option label="負債" value="liability" />
              <el-option label="淨資產" value="equity" />
              <el-option label="收入" value="income" />
              <el-option label="支出" value="expense" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input v-model="searchText" placeholder="搜尋科目名稱或代碼" clearable>
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table 
        :data="filteredSubjects" 
        :loading="loading"
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        stripe
      >
        <el-table-column prop="code" label="科目代碼" width="120" />
        <el-table-column prop="name" label="科目名稱" min-width="200">
          <template #default="{ row }">
            <span :style="{ paddingLeft: (row.level - 1) * 20 + 'px' }">
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="科目類型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="層級" width="80" />
        <el-table-column prop="isDefault" label="預設" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault" type="info" size="small">預設</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editSubject(row)">編輯</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="addChildSubject(row)"
              v-if="row.level < 4"
            >
              新增子科目
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteSubject(row)"
              :disabled="row.isDefault"
            >
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/編輯科目對話框 -->
    <el-dialog 
      v-model="showAddDialog" 
      :title="editingSubject ? '編輯科目' : '新增科目'"
      width="600px"
    >
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item label="科目代碼" prop="code">
          <el-input v-model="form.code" placeholder="留空自動生成" />
        </el-form-item>
        <el-form-item label="科目名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入科目名稱" />
        </el-form-item>
        <el-form-item label="科目類型" prop="type">
          <el-select v-model="form.type" placeholder="請選擇科目類型">
            <el-option label="資產" value="asset" />
            <el-option label="負債" value="liability" />
            <el-option label="淨資產" value="equity" />
            <el-option label="收入" value="income" />
            <el-option label="支出" value="expense" />
          </el-select>
        </el-form-item>
        <el-form-item label="上級科目" prop="parentId" v-if="!parentSubject">
          <el-cascader
            v-model="form.parentId"
            :options="parentOptions"
            :props="cascaderProps"
            placeholder="請選擇上級科目（可選）"
            clearable
          />
        </el-form-item>
        <el-form-item label="上級科目" v-else>
          <el-input :value="parentSubject.name" disabled />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveSubject" :loading="saving">
          {{ editingSubject ? '更新' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useAccountingStore } from '@/stores/accounting'

const accountingStore = useAccountingStore()

// 響應式數據
const showAddDialog = ref(false)
const editingSubject = ref(null)
const parentSubject = ref(null)
const filterType = ref('')
const searchText = ref('')
const loading = ref(false)
const saving = ref(false)
const formRef = ref()

// 表單數據
const form = ref({
  code: '',
  name: '',
  type: '',
  parentId: null
})

// 表單驗證規則
const formRules = {
  name: [
    { required: true, message: '請輸入科目名稱', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '請選擇科目類型', trigger: 'change' }
  ]
}

// 計算屬性
const filteredSubjects = computed(() => {
  let subjects = accountingStore.subjectTree
  
  // 類型篩選
  if (filterType.value) {
    subjects = subjects.filter(subject => subject.type === filterType.value)
  }
  
  // 文字搜尋
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    subjects = subjects.filter(subject => 
      subject.name.toLowerCase().includes(searchLower) ||
      subject.code.toLowerCase().includes(searchLower)
    )
  }
  
  return subjects
})

const parentOptions = computed(() => {
  return buildCascaderOptions(accountingStore.subjectTree)
})

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true
}

// 方法
function buildCascaderOptions(subjects, level = 1) {
  return subjects
    .filter(subject => level < 4) // 最多4級
    .map(subject => ({
      id: subject.id,
      name: `${subject.code} ${subject.name}`,
      children: subject.children ? buildCascaderOptions(subject.children, level + 1) : []
    }))
}

function getTypeLabel(type) {
  const labels = {
    asset: '資產',
    liability: '負債',
    equity: '淨資產',
    income: '收入',
    expense: '支出'
  }
  return labels[type] || type
}

function getTypeTagType(type) {
  const types = {
    asset: 'success',
    liability: 'warning',
    equity: 'info',
    income: 'primary',
    expense: 'danger'
  }
  return types[type] || ''
}

function editSubject(subject) {
  editingSubject.value = subject
  form.value = {
    code: subject.code,
    name: subject.name,
    type: subject.type,
    parentId: subject.parentId
  }
  showAddDialog.value = true
}

function addChildSubject(parent) {
  parentSubject.value = parent
  form.value = {
    code: '',
    name: '',
    type: parent.type, // 繼承父科目類型
    parentId: parent.id
  }
  showAddDialog.value = true
}

function cancelEdit() {
  showAddDialog.value = false
  editingSubject.value = null
  parentSubject.value = null
  form.value = {
    code: '',
    name: '',
    type: '',
    parentId: null
  }
  formRef.value?.resetFields()
}

async function saveSubject() {
  try {
    await formRef.value.validate()
    saving.value = true
    
    const subjectData = {
      ...form.value,
      level: calculateLevel(form.value.parentId)
    }
    
    if (editingSubject.value) {
      await accountingStore.updateSubject(editingSubject.value.id, subjectData)
      ElMessage.success('科目更新成功')
    } else {
      await accountingStore.addSubject(subjectData)
      ElMessage.success('科目新增成功')
    }
    
    cancelEdit()
  } catch (error) {
    ElMessage.error(error.message || '操作失敗')
  } finally {
    saving.value = false
  }
}

function calculateLevel(parentId) {
  if (!parentId) return 1
  const parent = accountingStore.getSubjectById(parentId)
  return parent ? parent.level + 1 : 1
}

async function deleteSubject(subject) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除科目「${subject.name}」嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await accountingStore.deleteSubject(subject.id)
    ElMessage.success('科目刪除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '刪除失敗')
    }
  }
}

async function resetToDefault() {
  try {
    await ElMessageBox.confirm(
      '確定要重置為預設科目嗎？這將清除所有自定義科目。',
      '確認重置',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    await accountingStore.resetToDefault()
    ElMessage.success('已重置為預設科目')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '重置失敗')
    }
  } finally {
    loading.value = false
  }
}

// 生命週期
onMounted(async () => {
  loading.value = true
  try {
    await accountingStore.initializeSubjects()
  } catch (error) {
    ElMessage.error('載入科目失敗')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.subject-management {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-section {
  margin-top: 20px;
}

.table-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
