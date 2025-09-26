import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { useIncomeStore } from './income'

export const useBelieversStore = defineStore('believers', () => {
  // 狀態
  const believers = ref([])
  const loading = ref(false)
  const error = ref(null)
  const searchQuery = ref('')
  const selectedBeliever = ref(null)

  // 獲取其他 stores
  const incomeStore = useIncomeStore()

  // 計算屬性
  const filteredBelievers = computed(() => {
    if (!searchQuery.value) return believers.value
    
    const query = searchQuery.value.toLowerCase()
    return believers.value.filter(believer => 
      believer.name.toLowerCase().includes(query) ||
      believer.phone.includes(query) ||
      believer.email.toLowerCase().includes(query) ||
      believer.address.toLowerCase().includes(query)
    )
  })

  const activeBelievers = computed(() => 
    believers.value.filter(believer => believer.isActive)
  )

  const totalBelievers = computed(() => believers.value.length)
  const activeBelieversCount = computed(() => activeBelievers.value.length)

  // 信眾統計
  const believerStats = computed(() => {
    const stats = {
      total: believers.value.length,
      active: activeBelievers.value.length,
      vip: believers.value.filter(b => b.level === 'vip').length,
      regular: believers.value.filter(b => b.level === 'regular').length,
      new: believers.value.filter(b => b.level === 'new').length,
      byAge: {
        young: believers.value.filter(b => calculateAge(b.birthDate) < 30).length,
        middle: believers.value.filter(b => {
          const age = calculateAge(b.birthDate)
          return age >= 30 && age < 60
        }).length,
        senior: believers.value.filter(b => calculateAge(b.birthDate) >= 60).length
      },
      byGender: {
        male: believers.value.filter(b => b.gender === 'male').length,
        female: believers.value.filter(b => b.gender === 'female').length,
        other: believers.value.filter(b => b.gender === 'other').length
      }
    }
    return stats
  })

  // 方法
  async function loadBelievers() {
    loading.value = true
    try {
      const stored = localStorage.getItem('temple-believers')
      if (stored) {
        believers.value = JSON.parse(stored)
      } else {
        // 載入示例資料
        await loadSampleData()
      }
    } catch (err) {
      error.value = err.message
      console.error('載入信眾資料失敗:', err)
    } finally {
      loading.value = false
    }
  }

  async function saveBelievers() {
    try {
      localStorage.setItem('temple-believers', JSON.stringify(believers.value))
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function addBeliever(believerData) {
    try {
      const newBeliever = {
        id: generateBelieverId(),
        ...believerData,
        level: 'new',
        totalDonations: 0,
        donationCount: 0,
        lastDonationDate: null,
        registrationDate: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      believers.value.push(newBeliever)
      await saveBelievers()
      
      return newBeliever
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function updateBeliever(id, updates) {
    try {
      const index = believers.value.findIndex(b => b.id === id)
      if (index === -1) {
        throw new Error('找不到指定的信眾')
      }
      
      believers.value[index] = {
        ...believers.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await saveBelievers()
      return believers.value[index]
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function deleteBeliever(id) {
    try {
      const index = believers.value.findIndex(b => b.id === id)
      if (index === -1) {
        throw new Error('找不到指定的信眾')
      }
      
      // 軟刪除 - 設為非活躍
      await updateBeliever(id, { isActive: false })
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  function getBelieversById(id) {
    return believers.value.find(b => b.id === id)
  }

  // 捐款相關方法
  function getBelieverssDonations(believerId) {
    return incomeStore.incomes.filter(income => 
      income.donor && income.donor.includes(getBelieversById(believerId)?.name)
    )
  }

  function calculateBelieversDonationStats(believerId) {
    const donations = getBelieverssDonations(believerId)
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
    
    return {
      total: totalAmount,
      count: donations.length,
      average: donations.length > 0 ? totalAmount / donations.length : 0,
      lastDonation: donations.length > 0 ? 
        donations.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())[0] : null,
      monthlyAverage: calculateMonthlyAverage(donations),
      yearlyTotal: calculateYearlyTotal(donations)
    }
  }

  function updateBelieverLevel(believerId) {
    const believer = getBelieversById(believerId)
    if (!believer) return
    
    const stats = calculateBelieversDonationStats(believerId)
    let newLevel = 'new'
    
    if (stats.total >= 100000) {
      newLevel = 'vip'
    } else if (stats.total >= 20000 || stats.count >= 10) {
      newLevel = 'regular'
    }
    
    if (believer.level !== newLevel) {
      updateBeliever(believerId, { 
        level: newLevel,
        totalDonations: stats.total,
        donationCount: stats.count,
        lastDonationDate: stats.lastDonation?.date
      })
    }
  }

  // 證明開立
  async function generateDonationCertificate(believerId, year) {
    const believer = getBelieversById(believerId)
    if (!believer) {
      throw new Error('找不到指定的信眾')
    }
    
    const donations = getBelieverssDonations(believerId).filter(donation => 
      dayjs(donation.date).year() === year
    )
    
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
    
    const certificate = {
      id: generateCertificateId(),
      believerId,
      believerName: believer.name,
      year,
      totalAmount,
      donationCount: donations.length,
      donations: donations.map(d => ({
        date: d.date,
        amount: d.amount,
        category: incomeStore.getCategoryById(d.categoryId)?.name || '其他',
        description: d.description
      })),
      issueDate: new Date().toISOString(),
      certificateNumber: generateCertificateNumber(year)
    }
    
    // 儲存證明記錄
    const certificates = JSON.parse(localStorage.getItem('temple-certificates') || '[]')
    certificates.push(certificate)
    localStorage.setItem('temple-certificates', JSON.stringify(certificates))
    
    return certificate
  }

  // 個人化服務
  function getPersonalizedServices(believerId) {
    const believer = getBelieversById(believerId)
    if (!believer) return []
    
    const services = []
    const stats = calculateBelieversDonationStats(believerId)
    
    // 根據信眾等級提供不同服務
    switch (believer.level) {
      case 'vip':
        services.push(
          { type: 'priority', name: '優先服務', description: '享有優先諮詢和服務' },
          { type: 'exclusive', name: '專屬活動', description: '參與VIP專屬法會和活動' },
          { type: 'consultation', name: '個人諮詢', description: '免費個人運勢諮詢服務' }
        )
        break
      case 'regular':
        services.push(
          { type: 'discount', name: '服務優惠', description: '部分服務享有優惠價格' },
          { type: 'notification', name: '活動通知', description: '優先收到重要活動通知' }
        )
        break
      case 'new':
        services.push(
          { type: 'welcome', name: '新信眾禮', description: '新信眾專屬歡迎禮品' },
          { type: 'guide', name: '導覽服務', description: '免費宮廟導覽和介紹' }
        )
        break
    }
    
    // 根據捐款歷史提供建議
    if (stats.count > 0) {
      const daysSinceLastDonation = dayjs().diff(dayjs(stats.lastDonation?.date), 'day')
      if (daysSinceLastDonation > 90) {
        services.push({
          type: 'reminder',
          name: '關懷提醒',
          description: '已有一段時間未見，歡迎隨時回來參拜'
        })
      }
    }
    
    return services
  }

  // 生日提醒
  function getBirthdayReminders() {
    const today = dayjs()
    const upcoming = []
    
    believers.value.forEach(believer => {
      if (!believer.birthDate || !believer.isActive) return
      
      const birthday = dayjs(believer.birthDate)
      const thisYearBirthday = birthday.year(today.year())
      const nextYearBirthday = birthday.year(today.year() + 1)
      
      const daysUntilBirthday = thisYearBirthday.diff(today, 'day')
      const daysUntilNextYear = nextYearBirthday.diff(today, 'day')
      
      if (daysUntilBirthday >= 0 && daysUntilBirthday <= 7) {
        upcoming.push({
          believer,
          daysUntil: daysUntilBirthday,
          date: thisYearBirthday.format('YYYY-MM-DD')
        })
      } else if (daysUntilNextYear <= 7) {
        upcoming.push({
          believer,
          daysUntil: daysUntilNextYear,
          date: nextYearBirthday.format('YYYY-MM-DD')
        })
      }
    })
    
    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil)
  }

  // 工具函數
  function generateBelieverId() {
    return 'believer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  function generateCertificateId() {
    return 'cert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  function generateCertificateNumber(year) {
    const certificates = JSON.parse(localStorage.getItem('temple-certificates') || '[]')
    const yearCertificates = certificates.filter(c => c.year === year)
    const sequence = (yearCertificates.length + 1).toString().padStart(4, '0')
    return `${year}${sequence}`
  }

  function calculateAge(birthDate) {
    if (!birthDate) return 0
    return dayjs().diff(dayjs(birthDate), 'year')
  }

  function calculateMonthlyAverage(donations) {
    if (donations.length === 0) return 0
    
    const months = new Set()
    donations.forEach(donation => {
      months.add(dayjs(donation.date).format('YYYY-MM'))
    })
    
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
    return totalAmount / months.size
  }

  function calculateYearlyTotal(donations) {
    const currentYear = dayjs().year()
    const yearlyDonations = donations.filter(donation => 
      dayjs(donation.date).year() === currentYear
    )
    return yearlyDonations.reduce((sum, donation) => sum + donation.amount, 0)
  }

  async function loadSampleData() {
    const sampleBelievers = [
      {
        id: 'believer_1',
        name: '王小明',
        gender: 'male',
        birthDate: '1980-05-15',
        phone: '0912345678',
        email: 'wang@example.com',
        address: '台北市中正區中山南路1號',
        level: 'vip',
        totalDonations: 150000,
        donationCount: 25,
        lastDonationDate: '2024-01-15',
        registrationDate: '2020-03-10T00:00:00.000Z',
        isActive: true,
        notes: '長期支持宮廟活動的熱心信眾',
        createdAt: '2020-03-10T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z'
      },
      {
        id: 'believer_2',
        name: '李美華',
        gender: 'female',
        birthDate: '1975-08-22',
        phone: '0923456789',
        email: 'li@example.com',
        address: '台北市大安區敦化南路100號',
        level: 'regular',
        totalDonations: 45000,
        donationCount: 12,
        lastDonationDate: '2024-01-10',
        registrationDate: '2021-06-20T00:00:00.000Z',
        isActive: true,
        notes: '每月固定捐款的虔誠信眾',
        createdAt: '2021-06-20T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z'
      },
      {
        id: 'believer_3',
        name: '張志強',
        gender: 'male',
        birthDate: '1990-12-03',
        phone: '0934567890',
        email: 'zhang@example.com',
        address: '新北市板橋區文化路50號',
        level: 'new',
        totalDonations: 5000,
        donationCount: 2,
        lastDonationDate: '2024-01-05',
        registrationDate: '2023-12-01T00:00:00.000Z',
        isActive: true,
        notes: '新加入的年輕信眾',
        createdAt: '2023-12-01T00:00:00.000Z',
        updatedAt: '2024-01-05T00:00:00.000Z'
      }
    ]
    
    believers.value = sampleBelievers
    await saveBelievers()
  }

  return {
    // 狀態
    believers,
    loading,
    error,
    searchQuery,
    selectedBeliever,

    // 計算屬性
    filteredBelievers,
    activeBelievers,
    totalBelievers,
    activeBelieversCount,
    believerStats,

    // 方法
    loadBelievers,
    addBeliever,
    updateBeliever,
    deleteBeliever,
    getBelieversById,
    getBelieverssDonations,
    calculateBelieversDonationStats,
    updateBelieverLevel,
    generateDonationCertificate,
    getPersonalizedServices,
    getBirthdayReminders
  }
})
