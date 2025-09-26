import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 會計科目數據模型
export const useAccountingStore = defineStore('accounting', () => {
  // 狀態
  const subjects = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 預設宮廟會計科目模板
  const defaultSubjects = [
    // 資產類 (1000-1999)
    { id: '1000', code: '1000', name: '資產', level: 1, type: 'asset', isActive: true, isDefault: true },
    { id: '1100', code: '1100', name: '流動資產', level: 2, parentId: '1000', type: 'asset', isActive: true, isDefault: true },
    { id: '1101', code: '1101', name: '現金', level: 3, parentId: '1100', type: 'asset', isActive: true, isDefault: true },
    { id: '1102', code: '1102', name: '銀行存款', level: 3, parentId: '1100', type: 'asset', isActive: true, isDefault: true },
    { id: '1103', code: '1103', name: '定期存款', level: 3, parentId: '1100', type: 'asset', isActive: true, isDefault: true },
    { id: '1200', code: '1200', name: '固定資產', level: 2, parentId: '1000', type: 'asset', isActive: true, isDefault: true },
    { id: '1201', code: '1201', name: '土地', level: 3, parentId: '1200', type: 'asset', isActive: true, isDefault: true },
    { id: '1202', code: '1202', name: '建築物', level: 3, parentId: '1200', type: 'asset', isActive: true, isDefault: true },
    { id: '1203', code: '1203', name: '設備', level: 3, parentId: '1200', type: 'asset', isActive: true, isDefault: true },

    // 負債類 (2000-2999)
    { id: '2000', code: '2000', name: '負債', level: 1, type: 'liability', isActive: true, isDefault: true },
    { id: '2100', code: '2100', name: '流動負債', level: 2, parentId: '2000', type: 'liability', isActive: true, isDefault: true },
    { id: '2101', code: '2101', name: '應付帳款', level: 3, parentId: '2100', type: 'liability', isActive: true, isDefault: true },
    { id: '2102', code: '2102', name: '應付費用', level: 3, parentId: '2100', type: 'liability', isActive: true, isDefault: true },
    { id: '2200', code: '2200', name: '長期負債', level: 2, parentId: '2000', type: 'liability', isActive: true, isDefault: true },
    { id: '2201', code: '2201', name: '長期借款', level: 3, parentId: '2200', type: 'liability', isActive: true, isDefault: true },

    // 淨資產類 (3000-3999)
    { id: '3000', code: '3000', name: '淨資產', level: 1, type: 'equity', isActive: true, isDefault: true },
    { id: '3100', code: '3100', name: '基金', level: 2, parentId: '3000', type: 'equity', isActive: true, isDefault: true },
    { id: '3101', code: '3101', name: '創立基金', level: 3, parentId: '3100', type: 'equity', isActive: true, isDefault: true },
    { id: '3102', code: '3102', name: '指定用途基金', level: 3, parentId: '3100', type: 'equity', isActive: true, isDefault: true },
    { id: '3200', code: '3200', name: '累積餘絀', level: 2, parentId: '3000', type: 'equity', isActive: true, isDefault: true },
    { id: '3201', code: '3201', name: '累積賸餘', level: 3, parentId: '3200', type: 'equity', isActive: true, isDefault: true },

    // 收入類 (4000-4999) - 宮廟特色
    { id: '4000', code: '4000', name: '收入', level: 1, type: 'income', isActive: true, isDefault: true },
    { id: '4100', code: '4100', name: '捐贈收入', level: 2, parentId: '4000', type: 'income', isActive: true, isDefault: true },
    { id: '4101', code: '4101', name: '香油錢', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4102', code: '4102', name: '點光明燈', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4103', code: '4103', name: '屬名紅包', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4104', code: '4104', name: '未屬名紅包', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4105', code: '4105', name: '祝壽', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4106', code: '4106', name: '感謝神尊', level: 3, parentId: '4100', type: 'income', isActive: true, isDefault: true },
    { id: '4200', code: '4200', name: '服務收入', level: 2, parentId: '4000', type: 'income', isActive: true, isDefault: true },
    { id: '4201', code: '4201', name: '看風水', level: 3, parentId: '4200', type: 'income', isActive: true, isDefault: true },
    { id: '4202', code: '4202', name: '停車費', level: 3, parentId: '4200', type: 'income', isActive: true, isDefault: true },
    { id: '4300', code: '4300', name: '其他收入', level: 2, parentId: '4000', type: 'income', isActive: true, isDefault: true },
    { id: '4301', code: '4301', name: '利息收入', level: 3, parentId: '4300', type: 'income', isActive: true, isDefault: true },

    // 支出類 (5000-5999) - 宮廟特色
    { id: '5000', code: '5000', name: '支出', level: 1, type: 'expense', isActive: true, isDefault: true },
    { id: '5100', code: '5100', name: '管理費用', level: 2, parentId: '5000', type: 'expense', isActive: true, isDefault: true },
    { id: '5101', code: '5101', name: '人員薪水', level: 3, parentId: '5100', type: 'expense', isActive: true, isDefault: true },
    { id: '5102', code: '5102', name: '房租', level: 3, parentId: '5100', type: 'expense', isActive: true, isDefault: true },
    { id: '5103', code: '5103', name: '水電費', level: 3, parentId: '5100', type: 'expense', isActive: true, isDefault: true },
    { id: '5104', code: '5104', name: '管理費', level: 3, parentId: '5100', type: 'expense', isActive: true, isDefault: true },
    { id: '5200', code: '5200', name: '活動支出', level: 2, parentId: '5000', type: 'expense', isActive: true, isDefault: true },
    { id: '5201', code: '5201', name: '參訪金', level: 3, parentId: '5200', type: 'expense', isActive: true, isDefault: true },
    { id: '5202', code: '5202', name: '祭典費用', level: 3, parentId: '5200', type: 'expense', isActive: true, isDefault: true },
    { id: '5300', code: '5300', name: '維護支出', level: 2, parentId: '5000', type: 'expense', isActive: true, isDefault: true },
    { id: '5301', code: '5301', name: '修繕費', level: 3, parentId: '5300', type: 'expense', isActive: true, isDefault: true },
    { id: '5302', code: '5302', name: '設備採購', level: 3, parentId: '5300', type: 'expense', isActive: true, isDefault: true },
    { id: '5400', code: '5400', name: '雜項支出', level: 2, parentId: '5000', type: 'expense', isActive: true, isDefault: true },
    { id: '5401', code: '5401', name: '雜項開支', level: 3, parentId: '5400', type: 'expense', isActive: true, isDefault: true }
  ]

  // 計算屬性
  const activeSubjects = computed(() => 
    subjects.value.filter(subject => subject.isActive)
  )

  const subjectsByType = computed(() => {
    const grouped = {}
    activeSubjects.value.forEach(subject => {
      if (!grouped[subject.type]) {
        grouped[subject.type] = []
      }
      grouped[subject.type].push(subject)
    })
    return grouped
  })

  const subjectTree = computed(() => {
    const tree = []
    const subjectMap = new Map()
    
    // 建立映射
    activeSubjects.value.forEach(subject => {
      subjectMap.set(subject.id, { ...subject, children: [] })
    })
    
    // 建立樹狀結構
    subjectMap.forEach(subject => {
      if (subject.parentId) {
        const parent = subjectMap.get(subject.parentId)
        if (parent) {
          parent.children.push(subject)
        }
      } else {
        tree.push(subject)
      }
    })
    
    return tree
  })

  // 動作
  async function initializeSubjects() {
    loading.value = true
    try {
      // 從本地存儲載入科目
      const stored = localStorage.getItem('accounting-subjects')
      if (stored) {
        subjects.value = JSON.parse(stored)
      } else {
        // 使用預設科目
        subjects.value = [...defaultSubjects]
        await saveSubjects()
      }
    } catch (err) {
      error.value = err.message
      console.error('初始化會計科目失敗:', err)
    } finally {
      loading.value = false
    }
  }

  async function saveSubjects() {
    try {
      localStorage.setItem('accounting-subjects', JSON.stringify(subjects.value))
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function addSubject(subjectData) {
    try {
      const newSubject = {
        id: generateSubjectId(),
        code: subjectData.code || generateSubjectCode(subjectData.type, subjectData.level),
        name: subjectData.name,
        level: subjectData.level,
        parentId: subjectData.parentId,
        type: subjectData.type,
        isActive: true,
        isDefault: false,
        createdAt: new Date().toISOString()
      }
      
      subjects.value.push(newSubject)
      await saveSubjects()
      return newSubject
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updateSubject(id, updates) {
    try {
      const index = subjects.value.findIndex(s => s.id === id)
      if (index === -1) {
        throw new Error('科目不存在')
      }
      
      subjects.value[index] = {
        ...subjects.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await saveSubjects()
      return subjects.value[index]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteSubject(id) {
    try {
      const subject = subjects.value.find(s => s.id === id)
      if (!subject) {
        throw new Error('科目不存在')
      }
      
      if (subject.isDefault) {
        throw new Error('預設科目不能刪除')
      }
      
      // 檢查是否有子科目
      const hasChildren = subjects.value.some(s => s.parentId === id)
      if (hasChildren) {
        throw new Error('有子科目的科目不能刪除')
      }
      
      // 軟刪除 - 設為非活躍
      await updateSubject(id, { isActive: false })
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  function getSubjectById(id) {
    return subjects.value.find(s => s.id === id)
  }

  function getSubjectsByParent(parentId) {
    return subjects.value.filter(s => s.parentId === parentId && s.isActive)
  }

  function getSubjectPath(id) {
    const path = []
    let current = getSubjectById(id)
    
    while (current) {
      path.unshift(current)
      current = current.parentId ? getSubjectById(current.parentId) : null
    }
    
    return path
  }

  // 工具函數
  function generateSubjectId() {
    return 'subj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  function generateSubjectCode(type, level) {
    const typePrefix = {
      asset: '1',
      liability: '2', 
      equity: '3',
      income: '4',
      expense: '5'
    }
    
    const prefix = typePrefix[type] || '9'
    const timestamp = Date.now().toString().slice(-3)
    return prefix + '0'.repeat(3 - timestamp.length) + timestamp
  }

  async function resetToDefault() {
    try {
      subjects.value = [...defaultSubjects]
      await saveSubjects()
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    // 狀態
    subjects,
    loading,
    error,
    
    // 計算屬性
    activeSubjects,
    subjectsByType,
    subjectTree,
    
    // 動作
    initializeSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectById,
    getSubjectsByParent,
    getSubjectPath,
    resetToDefault,
    
    // 常數
    defaultSubjects
  }
})
