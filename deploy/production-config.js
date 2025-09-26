/**
 * 廣清宮記帳軟體 - 生產環境配置
 * 生產環境的 Firebase 和應用配置
 */

// 生產環境 Firebase 配置
export const productionFirebaseConfig = {
  // 請替換為您的生產環境 Firebase 專案配置
  apiKey: process.env.VITE_FIREBASE_API_KEY || "your-production-api-key",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "temple-accounting-prod.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "temple-accounting-prod",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "temple-accounting-prod.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.VITE_FIREBASE_APP_ID || "your-production-app-id",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "your-measurement-id"
};

// 生產環境應用配置
export const productionConfig = {
  // 應用基本配置
  app: {
    name: "廣清宮快速記帳軟體",
    version: "1.0.0",
    environment: "production",
    debug: false,
    logLevel: "error"
  },

  // API 配置
  api: {
    baseURL: process.env.VITE_API_BASE_URL || "https://api.temple-accounting.com",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // 安全配置
  security: {
    enableCSP: true,
    enableHTTPS: true,
    sessionTimeout: 30 * 60 * 1000, // 30 分鐘
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 分鐘
    passwordMinLength: 8,
    enableTwoFactor: false
  },

  // 快取配置
  cache: {
    enableServiceWorker: true,
    cacheStrategy: "cache-first",
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cacheExpiry: 24 * 60 * 60 * 1000 // 24 小時
  },

  // 監控配置
  monitoring: {
    enableAnalytics: true,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    sampleRate: 0.1, // 10% 取樣
    enableUserFeedback: true
  },

  // 功能開關
  features: {
    enableOfflineMode: true,
    enableCloudSync: true,
    enableAdvancedAnalytics: true,
    enableBelieversManagement: true,
    enableMultipleAccounts: false,
    enableDataExport: true,
    enableBackup: true
  },

  // 效能配置
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableImageOptimization: true,
    enableGzip: true,
    enableBrotli: true,
    maxBundleSize: 2 * 1024 * 1024 // 2MB
  },

  // 本地化配置
  i18n: {
    defaultLocale: "zh-TW",
    supportedLocales: ["zh-TW", "zh-CN", "en-US"],
    fallbackLocale: "zh-TW"
  },

  // 資料庫配置
  database: {
    enableOfflineSupport: true,
    cacheSizeBytes: 40 * 1024 * 1024, // 40MB
    enablePersistence: true,
    enableMultiTabSupport: true
  },

  // 備份配置
  backup: {
    enableAutoBackup: true,
    backupInterval: 24 * 60 * 60 * 1000, // 每日備份
    maxBackupFiles: 30,
    backupLocation: "cloud",
    enableEncryption: true
  },

  // 通知配置
  notifications: {
    enablePushNotifications: true,
    enableEmailNotifications: false,
    enableSMSNotifications: false,
    defaultNotificationSettings: {
      desktop: true,
      sound: false,
      vibration: false
    }
  },

  // SEO 配置
  seo: {
    title: "廣清宮快速記帳軟體",
    description: "專為宮廟設計的現代化記帳管理系統",
    keywords: "宮廟,記帳,財務管理,會計,台灣",
    author: "廣清宮",
    robots: "noindex, nofollow", // 生產環境可能需要調整
    canonical: "https://accounting.temple.com"
  },

  // CDN 配置
  cdn: {
    enableCDN: true,
    cdnBaseURL: process.env.VITE_CDN_BASE_URL || "https://cdn.temple-accounting.com",
    staticAssetsPath: "/static",
    enableImageCDN: true
  },

  // 錯誤處理配置
  errorHandling: {
    enableGlobalErrorHandler: true,
    enableUnhandledRejectionHandler: true,
    enableErrorBoundary: true,
    errorReportingEndpoint: process.env.VITE_ERROR_REPORTING_ENDPOINT,
    maxErrorReports: 100
  },

  // 開發工具配置（生產環境關閉）
  devTools: {
    enableVueDevtools: false,
    enableReduxDevtools: false,
    enableConsoleLogging: false,
    enableDebugMode: false
  }
};

// 環境變數驗證
export function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('缺少必要的環境變數:', missingVars);
    throw new Error(`生產環境配置不完整，缺少環境變數: ${missingVars.join(', ')}`);
  }

  console.log('✅ 環境變數驗證通過');
}

// 配置驗證
export function validateProductionConfig() {
  try {
    // 驗證 Firebase 配置
    if (!productionFirebaseConfig.apiKey || productionFirebaseConfig.apiKey.includes('your-')) {
      throw new Error('Firebase API Key 未正確配置');
    }

    if (!productionFirebaseConfig.projectId || productionFirebaseConfig.projectId.includes('your-')) {
      throw new Error('Firebase Project ID 未正確配置');
    }

    // 驗證安全配置
    if (productionConfig.security.sessionTimeout < 5 * 60 * 1000) {
      console.warn('⚠️ 會話超時時間過短，建議至少 5 分鐘');
    }

    // 驗證效能配置
    if (productionConfig.performance.maxBundleSize > 5 * 1024 * 1024) {
      console.warn('⚠️ 最大包大小過大，可能影響載入速度');
    }

    console.log('✅ 生產環境配置驗證通過');
    return true;
  } catch (error) {
    console.error('❌ 生產環境配置驗證失敗:', error.message);
    return false;
  }
}

// 初始化生產環境配置
export function initializeProductionConfig() {
  try {
    validateEnvironmentVariables();
    validateProductionConfig();
    
    // 設定全域配置
    if (typeof window !== 'undefined') {
      window.__TEMPLE_CONFIG__ = productionConfig;
      window.__TEMPLE_FIREBASE_CONFIG__ = productionFirebaseConfig;
    }

    console.log('✅ 生產環境配置初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 生產環境配置初始化失敗:', error.message);
    return false;
  }
}

// 匯出配置
export default {
  firebase: productionFirebaseConfig,
  app: productionConfig,
  validate: validateProductionConfig,
  initialize: initializeProductionConfig
};
