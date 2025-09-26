// Firebase 配置和初始化
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getAnalytics } from 'firebase/analytics'

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCUaCI3_DAs7iYDAUb8ezMqZRnQJJ0511Y",
  authDomain: "temple-accounting-a5d35.firebaseapp.com",
  projectId: "temple-accounting-a5d35",
  storageBucket: "temple-accounting-a5d35.firebasestorage.app",
  messagingSenderId: "1070844356209",
  appId: "1:1070844356209:web:bcc42d152470fd9f5b1dd0",
  measurementId: "G-DD094GW46G"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)

// 初始化服務
const db = getFirestore(app)
const auth = getAuth(app)
let analytics = null

// 只在瀏覽器環境中初始化 Analytics
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

// 開發環境模擬器連接
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 檢查是否已經連接模擬器
  if (!db._delegate._databaseId.projectId.includes('demo-')) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectAuthEmulator(auth, 'http://localhost:9099')
    } catch (error) {
      console.log('模擬器已連接或連接失敗:', error.message)
    }
  }
}

export { app, db, auth, analytics }