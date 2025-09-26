import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 狀態
  const theme = ref('light')
  const language = ref('zh-TW')
  const fontSize = ref('medium')
  const sidebarCollapsed = ref(false)
  const highContrast = ref(false)
  const reducedMotion = ref(false)
  const screenReader = ref(false)
  const colorBlindMode = ref('none')
  const compactMode = ref(false)
  const showTooltips = ref(true)
  const animationSpeed = ref('normal')
  const autoSave = ref(true)
  const notifications = ref({
    desktop: true,
    sound: false,
    vibration: false
  })

  // 響應式設計狀態
  const screenSize = ref('desktop')
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)

  // 用戶偏好設定
  const userPreferences = ref({
    defaultView: 'dashboard',
    itemsPerPage: 20,
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: 'TWD',
    numberFormat: 'comma',
    chartType: 'line',
    exportFormat: 'excel',
    backupFrequency: 'daily'
  })

  // 計算屬性
  const isDarkMode = computed(() => theme.value === 'dark')
  const isLightMode = computed(() => theme.value === 'light')
  const isSystemTheme = computed(() => theme.value === 'system')

  const currentFontSize = computed(() => {
    const sizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    }
    return sizeMap[fontSize.value] || '16px'
  })

  const themeColors = computed(() => {
    if (isDarkMode.value) {
      return {
        primary: '#409eff',
        success: '#67c23a',
        warning: '#e6a23c',
        danger: '#f56c6c',
        info: '#909399',
        background: '#1a1a1a',
        surface: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#b3b3b3',
        border: '#404040'
      }
    } else {
      return {
        primary: '#409eff',
        success: '#67c23a',
        warning: '#e6a23c',
        danger: '#f56c6c',
        info: '#909399',
        background: '#ffffff',
        surface: '#f5f7fa',
        text: '#303133',
        textSecondary: '#606266',
        border: '#dcdfe6'
      }
    }
  })

  const accessibilityClasses = computed(() => {
    const classes = []
    
    if (highContrast.value) classes.push('high-contrast')
    if (reducedMotion.value) classes.push('reduced-motion')
    if (screenReader.value) classes.push('screen-reader-optimized')
    if (colorBlindMode.value !== 'none') classes.push(`colorblind-${colorBlindMode.value}`)
    if (compactMode.value) classes.push('compact-mode')
    
    return classes.join(' ')
  })

  const responsiveClasses = computed(() => {
    const classes = []
    
    classes.push(`screen-${screenSize.value}`)
    if (isMobile.value) classes.push('mobile')
    if (isTablet.value) classes.push('tablet')
    if (isDesktop.value) classes.push('desktop')
    if (sidebarCollapsed.value) classes.push('sidebar-collapsed')
    
    return classes.join(' ')
  })

  // 方法 - 主題管理
  function setTheme(newTheme) {
    theme.value = newTheme
    applyTheme()
    savePreferences()
  }

  function toggleTheme() {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  function applyTheme() {
    const root = document.documentElement
    
    // 移除現有主題類別
    root.classList.remove('theme-light', 'theme-dark', 'theme-system')
    
    // 應用新主題
    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'theme-dark' : 'theme-light')
    } else {
      root.classList.add(`theme-${theme.value}`)
    }
    
    // 設定 CSS 變數
    Object.entries(themeColors.value).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
    
    // 設定字體大小
    root.style.setProperty('--font-size-base', currentFontSize.value)
  }

  // 方法 - 無障礙功能
  function setFontSize(size) {
    fontSize.value = size
    applyTheme()
    savePreferences()
  }

  function toggleHighContrast() {
    highContrast.value = !highContrast.value
    applyAccessibility()
    savePreferences()
  }

  function toggleReducedMotion() {
    reducedMotion.value = !reducedMotion.value
    applyAccessibility()
    savePreferences()
  }

  function setColorBlindMode(mode) {
    colorBlindMode.value = mode
    applyAccessibility()
    savePreferences()
  }

  function applyAccessibility() {
    const root = document.documentElement
    
    // 移除現有無障礙類別
    root.classList.remove('high-contrast', 'reduced-motion', 'screen-reader-optimized')
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia')
    
    // 應用無障礙類別
    if (highContrast.value) {
      root.classList.add('high-contrast')
    }
    
    if (reducedMotion.value) {
      root.classList.add('reduced-motion')
    }
    
    if (screenReader.value) {
      root.classList.add('screen-reader-optimized')
    }
    
    if (colorBlindMode.value !== 'none') {
      root.classList.add(`colorblind-${colorBlindMode.value}`)
    }
    
    if (compactMode.value) {
      root.classList.add('compact-mode')
    }
  }

  // 方法 - 響應式設計
  function updateScreenSize() {
    const width = window.innerWidth
    
    if (width < 768) {
      screenSize.value = 'mobile'
      isMobile.value = true
      isTablet.value = false
      isDesktop.value = false
      sidebarCollapsed.value = true
    } else if (width < 1024) {
      screenSize.value = 'tablet'
      isMobile.value = false
      isTablet.value = true
      isDesktop.value = false
      sidebarCollapsed.value = false
    } else {
      screenSize.value = 'desktop'
      isMobile.value = false
      isTablet.value = false
      isDesktop.value = true
      sidebarCollapsed.value = false
    }
    
    applyResponsive()
  }

  function applyResponsive() {
    const root = document.documentElement
    
    // 移除現有響應式類別
    root.classList.remove('screen-mobile', 'screen-tablet', 'screen-desktop')
    root.classList.remove('mobile', 'tablet', 'desktop', 'sidebar-collapsed')
    
    // 應用響應式類別
    root.classList.add(`screen-${screenSize.value}`)
    
    if (isMobile.value) root.classList.add('mobile')
    if (isTablet.value) root.classList.add('tablet')
    if (isDesktop.value) root.classList.add('desktop')
    if (sidebarCollapsed.value) root.classList.add('sidebar-collapsed')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    applyResponsive()
    savePreferences()
  }

  // 方法 - 用戶體驗優化
  function setLanguage(lang) {
    language.value = lang
    // 這裡可以整合 i18n
    savePreferences()
  }

  function updateUserPreference(key, value) {
    userPreferences.value[key] = value
    savePreferences()
  }

  function setAnimationSpeed(speed) {
    animationSpeed.value = speed
    const root = document.documentElement
    
    const speedMap = {
      slow: '0.5s',
      normal: '0.3s',
      fast: '0.15s',
      none: '0s'
    }
    
    root.style.setProperty('--animation-duration', speedMap[speed] || '0.3s')
    savePreferences()
  }

  function toggleCompactMode() {
    compactMode.value = !compactMode.value
    applyAccessibility()
    savePreferences()
  }

  // 方法 - 通知管理
  function updateNotificationSetting(type, enabled) {
    notifications.value[type] = enabled
    savePreferences()
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      return Notification.requestPermission()
    }
    return Promise.resolve(Notification.permission)
  }

  function showNotification(title, options = {}) {
    if (!notifications.value.desktop || Notification.permission !== 'granted') {
      return
    }
    
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    })
    
    if (notifications.value.sound) {
      // 播放通知音效
      const audio = new Audio('/notification.mp3')
      audio.play().catch(() => {})
    }
    
    if (notifications.value.vibration && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
    
    return notification
  }

  // 方法 - 數據持久化
  function savePreferences() {
    const preferences = {
      theme: theme.value,
      language: language.value,
      fontSize: fontSize.value,
      sidebarCollapsed: sidebarCollapsed.value,
      highContrast: highContrast.value,
      reducedMotion: reducedMotion.value,
      screenReader: screenReader.value,
      colorBlindMode: colorBlindMode.value,
      compactMode: compactMode.value,
      showTooltips: showTooltips.value,
      animationSpeed: animationSpeed.value,
      autoSave: autoSave.value,
      notifications: notifications.value,
      userPreferences: userPreferences.value
    }
    
    localStorage.setItem('temple-ui-preferences', JSON.stringify(preferences))
  }

  function loadPreferences() {
    try {
      const saved = localStorage.getItem('temple-ui-preferences')
      if (saved) {
        const preferences = JSON.parse(saved)
        
        theme.value = preferences.theme || 'light'
        language.value = preferences.language || 'zh-TW'
        fontSize.value = preferences.fontSize || 'medium'
        sidebarCollapsed.value = preferences.sidebarCollapsed || false
        highContrast.value = preferences.highContrast || false
        reducedMotion.value = preferences.reducedMotion || false
        screenReader.value = preferences.screenReader || false
        colorBlindMode.value = preferences.colorBlindMode || 'none'
        compactMode.value = preferences.compactMode || false
        showTooltips.value = preferences.showTooltips !== false
        animationSpeed.value = preferences.animationSpeed || 'normal'
        autoSave.value = preferences.autoSave !== false
        
        if (preferences.notifications) {
          notifications.value = { ...notifications.value, ...preferences.notifications }
        }
        
        if (preferences.userPreferences) {
          userPreferences.value = { ...userPreferences.value, ...preferences.userPreferences }
        }
      }
    } catch (error) {
      console.error('載入用戶偏好設定失敗:', error)
    }
  }

  // 方法 - 初始化
  function initialize() {
    loadPreferences()
    updateScreenSize()
    applyTheme()
    applyAccessibility()
    applyResponsive()
    
    // 監聽系統主題變化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', () => {
        if (theme.value === 'system') {
          applyTheme()
        }
      })
    }
    
    // 監聽視窗大小變化
    window.addEventListener('resize', updateScreenSize)
    
    // 監聽系統無障礙偏好
    if (window.matchMedia) {
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (reducedMotionQuery.matches && !reducedMotion.value) {
        reducedMotion.value = true
        applyAccessibility()
      }
    }
  }

  // 方法 - 重置設定
  function resetToDefaults() {
    theme.value = 'light'
    language.value = 'zh-TW'
    fontSize.value = 'medium'
    sidebarCollapsed.value = false
    highContrast.value = false
    reducedMotion.value = false
    screenReader.value = false
    colorBlindMode.value = 'none'
    compactMode.value = false
    showTooltips.value = true
    animationSpeed.value = 'normal'
    autoSave.value = true
    notifications.value = {
      desktop: true,
      sound: false,
      vibration: false
    }
    userPreferences.value = {
      defaultView: 'dashboard',
      itemsPerPage: 20,
      dateFormat: 'YYYY-MM-DD',
      currencyFormat: 'TWD',
      numberFormat: 'comma',
      chartType: 'line',
      exportFormat: 'excel',
      backupFrequency: 'daily'
    }
    
    applyTheme()
    applyAccessibility()
    applyResponsive()
    savePreferences()
  }

  return {
    // 狀態
    theme,
    language,
    fontSize,
    sidebarCollapsed,
    highContrast,
    reducedMotion,
    screenReader,
    colorBlindMode,
    compactMode,
    showTooltips,
    animationSpeed,
    autoSave,
    notifications,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    userPreferences,

    // 計算屬性
    isDarkMode,
    isLightMode,
    isSystemTheme,
    currentFontSize,
    themeColors,
    accessibilityClasses,
    responsiveClasses,

    // 方法
    setTheme,
    toggleTheme,
    setFontSize,
    toggleHighContrast,
    toggleReducedMotion,
    setColorBlindMode,
    updateScreenSize,
    toggleSidebar,
    setLanguage,
    updateUserPreference,
    setAnimationSpeed,
    toggleCompactMode,
    updateNotificationSetting,
    requestNotificationPermission,
    showNotification,
    initialize,
    resetToDefaults
  }
})
