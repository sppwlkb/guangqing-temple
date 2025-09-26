import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  enableNetwork,
  disableNetwork,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { db, auth } from '../../firebase-config.js'

/**
 * Firebase 服務類 - 提供完整的雲端資料操作功能
 */
class FirebaseService {
  constructor() {
    this.db = db
    this.auth = auth
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.listeners = new Map()
    
    // 監聽網路狀態
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // ==================== 身份驗證 ====================
  
  /**
   * 用戶登入
   */
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
      return {
        success: true,
        user: userCredential.user
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 用戶註冊
   */
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password)
      
      // 更新用戶資料
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      
      return {
        success: true,
        user: userCredential.user
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 用戶登出
   */
  async signOut() {
    try {
      await signOut(this.auth)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 監聽身份驗證狀態
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(this.auth, callback)
  }

  /**
   * 獲取當前用戶
   */
  getCurrentUser() {
    return this.auth.currentUser
  }

  // ==================== 資料操作 ====================

  /**
   * 新增文檔
   */
  async addDocument(collectionName, data) {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        userId: this.getCurrentUser()?.uid
      }

      if (this.isOnline) {
        const docRef = await addDoc(collection(this.db, collectionName), docData)
        return {
          success: true,
          id: docRef.id
        }
      } else {
        // 離線時加入同步佇列
        this.addToSyncQueue('add', collectionName, null, docData)
        return {
          success: true,
          id: this.generateTempId(),
          offline: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 更新文檔
   */
  async updateDocument(collectionName, docId, data) {
    try {
      const docData = {
        ...data,
        updatedAt: serverTimestamp()
      }

      if (this.isOnline) {
        const docRef = doc(this.db, collectionName, docId)
        await updateDoc(docRef, docData)
        return { success: true }
      } else {
        // 離線時加入同步佇列
        this.addToSyncQueue('update', collectionName, docId, docData)
        return {
          success: true,
          offline: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 刪除文檔
   */
  async deleteDocument(collectionName, docId) {
    try {
      if (this.isOnline) {
        const docRef = doc(this.db, collectionName, docId)
        await deleteDoc(docRef)
        return { success: true }
      } else {
        // 離線時加入同步佇列
        this.addToSyncQueue('delete', collectionName, docId)
        return {
          success: true,
          offline: true
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 獲取文檔
   */
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(this.db, collectionName, docId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          }
        }
      } else {
        return {
          success: false,
          error: '文檔不存在'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 獲取集合
   */
  async getCollection(collectionName, queryOptions = {}) {
    try {
      let q = collection(this.db, collectionName)
      
      // 添加查詢條件
      if (queryOptions.where) {
        queryOptions.where.forEach(condition => {
          q = query(q, where(...condition))
        })
      }
      
      // 添加排序
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(order => {
          q = query(q, orderBy(...order))
        })
      }
      
      // 添加限制
      if (queryOptions.limit) {
        q = query(q, limit(queryOptions.limit))
      }
      
      const querySnapshot = await getDocs(q)
      const documents = []
      
      querySnapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return {
        success: true,
        data: documents
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 即時監聽集合變化
   */
  subscribeToCollection(collectionName, callback, queryOptions = {}) {
    let q = collection(this.db, collectionName)
    
    // 添加查詢條件
    if (queryOptions.where) {
      queryOptions.where.forEach(condition => {
        q = query(q, where(...condition))
      })
    }
    
    if (queryOptions.orderBy) {
      queryOptions.orderBy.forEach(order => {
        q = query(q, orderBy(...order))
      })
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const documents = []
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        })
      })
      callback(documents)
    }, (error) => {
      console.error('監聽錯誤:', error)
      callback(null, error)
    })
    
    // 儲存監聽器以便後續取消
    const listenerId = this.generateTempId()
    this.listeners.set(listenerId, unsubscribe)
    
    return listenerId
  }

  /**
   * 取消監聽
   */
  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(listenerId)
    }
  }

  // ==================== 批次操作 ====================

  /**
   * 批次寫入
   */
  async batchWrite(operations) {
    try {
      const batch = writeBatch(this.db)
      
      operations.forEach(operation => {
        const { type, collectionName, docId, data } = operation
        const docRef = docId 
          ? doc(this.db, collectionName, docId)
          : doc(collection(this.db, collectionName))
        
        switch (type) {
          case 'add':
          case 'set':
            batch.set(docRef, {
              ...data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
            break
          case 'update':
            batch.update(docRef, {
              ...data,
              updatedAt: serverTimestamp()
            })
            break
          case 'delete':
            batch.delete(docRef)
            break
        }
      })
      
      await batch.commit()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  // ==================== 離線同步 ====================

  /**
   * 添加到同步佇列
   */
  addToSyncQueue(operation, collectionName, docId, data) {
    this.syncQueue.push({
      id: this.generateTempId(),
      operation,
      collectionName,
      docId,
      data,
      timestamp: Date.now()
    })
    
    // 儲存到本地
    localStorage.setItem('firebase-sync-queue', JSON.stringify(this.syncQueue))
  }

  /**
   * 處理同步佇列
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return
    
    const operations = [...this.syncQueue]
    this.syncQueue = []
    
    for (const operation of operations) {
      try {
        switch (operation.operation) {
          case 'add':
            await this.addDocument(operation.collectionName, operation.data)
            break
          case 'update':
            await this.updateDocument(operation.collectionName, operation.docId, operation.data)
            break
          case 'delete':
            await this.deleteDocument(operation.collectionName, operation.docId)
            break
        }
      } catch (error) {
        console.error('同步失敗:', error)
        // 失敗的操作重新加入佇列
        this.syncQueue.push(operation)
      }
    }
    
    // 更新本地儲存
    localStorage.setItem('firebase-sync-queue', JSON.stringify(this.syncQueue))
  }

  /**
   * 載入同步佇列
   */
  loadSyncQueue() {
    try {
      const stored = localStorage.getItem('firebase-sync-queue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('載入同步佇列失敗:', error)
    }
  }

  /**
   * 生成臨時ID
   */
  generateTempId() {
    return 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // ==================== 網路控制 ====================

  /**
   * 啟用網路
   */
  async enableNetwork() {
    try {
      await enableNetwork(this.db)
      this.isOnline = true
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 停用網路
   */
  async disableNetwork() {
    try {
      await disableNetwork(this.db)
      this.isOnline = false
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// 創建單例實例
const firebaseService = new FirebaseService()

// 初始化時載入同步佇列
firebaseService.loadSyncQueue()

export default firebaseService
