/**
 * 廣清宮記帳軟體 - Firebase 雲端配置
 * 提供真正的雲端存儲、用戶認證和實時同步功能
 */

// Firebase 配置
const firebaseConfig = {
    // 注意：這些是示例配置，實際使用時請替換為您的 Firebase 專案配置
    apiKey: "your-api-key",
    authDomain: "guangqing-temple-accounting.firebaseapp.com",
    databaseURL: "https://guangqing-temple-accounting-default-rtdb.firebaseio.com",
    projectId: "guangqing-temple-accounting",
    storageBucket: "guangqing-temple-accounting.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdefghijklmnop"
};

class FirebaseCloudService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.storage = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        
        // 監聽網路狀態
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionStateChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionStateChange(false);
        });
        
        this.initFirebase();
    }

    /**
     * 初始化 Firebase
     */
    async initFirebase() {
        try {
            // 動態載入 Firebase SDK
            if (typeof firebase === 'undefined') {
                await this.loadFirebaseSDK();
            }

            // 初始化 Firebase
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            // 初始化服務
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.storage = firebase.storage();

            // 啟用離線持久化
            if (!this.isInitialized) {
                this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
                    if (err.code == 'failed-precondition') {
                        console.warn('離線持久化失敗：多個標籤頁打開');
                    } else if (err.code == 'unimplemented') {
                        console.warn('離線持久化不支援此瀏覽器');
                    }
                });
            }

            // 監聽認證狀態變化
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChanged(user);
            });

            this.isInitialized = true;
            console.log('Firebase 初始化成功');
            
        } catch (error) {
            console.error('Firebase 初始化失敗:', error);
            // 降級到本地存儲模式
            this.fallbackToLocalStorage();
        }
    }

    /**
     * 動態載入 Firebase SDK
     */
    async loadFirebaseSDK() {
        return new Promise((resolve, reject) => {
            // Firebase App (核心)
            const appScript = document.createElement('script');
            appScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
            
            appScript.onload = () => {
                // Firebase Auth
                const authScript = document.createElement('script');
                authScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js';
                
                authScript.onload = () => {
                    // Firebase Firestore
                    const firestoreScript = document.createElement('script');
                    firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js';
                    
                    firestoreScript.onload = () => {
                        // Firebase Storage
                        const storageScript = document.createElement('script');
                        storageScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js';
                        
                        storageScript.onload = resolve;
                        storageScript.onerror = reject;
                        document.head.appendChild(storageScript);
                    };
                    firestoreScript.onerror = reject;
                    document.head.appendChild(firestoreScript);
                };
                authScript.onerror = reject;
                document.head.appendChild(authScript);
            };
            appScript.onerror = reject;
            document.head.appendChild(appScript);
        });
    }

    /**
     * 用戶註冊
     */
    async registerUser(email, password, displayName) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 更新用戶資料
            await user.updateProfile({
                displayName: displayName
            });

            // 創建用戶文檔
            await this.db.collection('users').doc(user.uid).set({
                email: email,
                displayName: displayName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                templeInfo: {
                    name: displayName,
                    type: 'temple'
                }
            });

            return {
                success: true,
                user: user,
                message: '註冊成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 用戶登入
     */
    async loginUser(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 更新最後登入時間
            await this.db.collection('users').doc(user.uid).update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            return {
                success: true,
                user: user,
                message: '登入成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 匿名登入（用於訪客使用）
     */
    async loginAnonymously() {
        try {
            const userCredential = await this.auth.signInAnonymously();
            return {
                success: true,
                user: userCredential.user,
                message: '匿名登入成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 用戶登出
     */
    async logout() {
        try {
            await this.auth.signOut();
            return {
                success: true,
                message: '登出成功'
            };
        } catch (error) {
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 上傳資料到雲端
     */
    async uploadData(data) {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            const userDoc = this.db.collection('temples').doc(this.currentUser.uid);
            
            // 分別儲存不同類型的資料
            const batch = this.db.batch();
            
            // 儲存記錄
            if (data.records && data.records.length > 0) {
                const recordsRef = userDoc.collection('records');
                data.records.forEach(record => {
                    const docRef = recordsRef.doc(record.id.toString());
                    batch.set(docRef, {
                        ...record,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                });
            }

            // 儲存信眾資料
            if (data.believers && data.believers.length > 0) {
                const believersRef = userDoc.collection('believers');
                data.believers.forEach(believer => {
                    const docRef = believersRef.doc(believer.id?.toString() || believer.name);
                    batch.set(docRef, {
                        ...believer,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                });
            }

            // 儲存提醒
            if (data.reminders && data.reminders.length > 0) {
                const remindersRef = userDoc.collection('reminders');
                data.reminders.forEach(reminder => {
                    const docRef = remindersRef.doc(reminder.id.toString());
                    batch.set(docRef, {
                        ...reminder,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                });
            }

            // 儲存自定義類別
            if (data.customCategories) {
                batch.set(userDoc.collection('settings').doc('categories'), {
                    customIncomeCategories: data.customCategories.income || [],
                    customExpenseCategories: data.customCategories.expense || [],
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }

            // 更新同步資訊
            batch.set(userDoc, {
                lastSyncAt: firebase.firestore.FieldValue.serverTimestamp(),
                recordsCount: data.records?.length || 0,
                believersCount: data.believers?.length || 0,
                remindersCount: data.reminders?.length || 0
            }, { merge: true });

            await batch.commit();

            return {
                success: true,
                message: '資料已成功上傳到雲端',
                timestamp: new Date().toLocaleString('zh-TW')
            };
        } catch (error) {
            console.error('上傳資料錯誤:', error);
            throw error;
        }
    }

    /**
     * 從雲端下載資料
     */
    async downloadData() {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            const userDoc = this.db.collection('temples').doc(this.currentUser.uid);
            
            // 並行獲取所有資料
            const [recordsSnapshot, believersSnapshot, remindersSnapshot, categoriesSnapshot] = await Promise.all([
                userDoc.collection('records').get(),
                userDoc.collection('believers').get(),
                userDoc.collection('reminders').get(),
                userDoc.collection('settings').doc('categories').get()
            ]);

            const data = {
                records: recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                believers: believersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                reminders: remindersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
                customCategories: categoriesSnapshot.exists ? categoriesSnapshot.data() : null,
                downloadedAt: new Date().toISOString()
            };

            return {
                success: true,
                data: data,
                message: '資料已成功從雲端下載',
                timestamp: new Date().toLocaleString('zh-TW')
            };
        } catch (error) {
            console.error('下載資料錯誤:', error);
            throw error;
        }
    }

    /**
     * 實時監聽資料變化
     */
    setupRealtimeSync(callback) {
        if (!this.currentUser) return null;

        const userDoc = this.db.collection('temples').doc(this.currentUser.uid);
        
        // 監聽記錄變化
        const recordsUnsubscribe = userDoc.collection('records')
            .onSnapshot((snapshot) => {
                const changes = snapshot.docChanges();
                if (changes.length > 0) {
                    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback('records', records, changes);
                }
            });

        // 監聽信眾資料變化
        const believersUnsubscribe = userDoc.collection('believers')
            .onSnapshot((snapshot) => {
                const changes = snapshot.docChanges();
                if (changes.length > 0) {
                    const believers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    callback('believers', believers, changes);
                }
            });

        // 返回取消監聽的函數
        return () => {
            recordsUnsubscribe();
            believersUnsubscribe();
        };
    }

    /**
     * 認證狀態變化處理
     */
    onAuthStateChanged(user) {
        if (user) {
            console.log('用戶已登入:', user.displayName || user.email || '匿名用戶');
            // 觸發自動同步
            this.autoSync();
        } else {
            console.log('用戶已登出');
        }
        
        // 通知應用程式認證狀態變化
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
    }

    /**
     * 網路狀態變化處理
     */
    onConnectionStateChange(isOnline) {
        console.log('網路狀態:', isOnline ? '已連線' : '已離線');
        
        if (isOnline && this.currentUser) {
            // 網路恢復時自動同步
            this.autoSync();
        }
        
        // 通知應用程式網路狀態變化
        window.dispatchEvent(new CustomEvent('connectionStateChanged', { detail: { isOnline } }));
    }

    /**
     * 自動同步
     */
    async autoSync() {
        if (!this.isOnline || !this.currentUser) return;

        try {
            // 檢查本地是否有未同步的變更
            const lastLocalModified = localStorage.getItem('temple-last-modified');
            const lastCloudSync = localStorage.getItem('temple-last-cloud-sync');
            
            if (lastLocalModified && (!lastCloudSync || parseInt(lastLocalModified) > parseInt(lastCloudSync))) {
                // 有本地變更，上傳到雲端
                const localData = this.collectLocalData();
                await this.uploadData(localData);
                localStorage.setItem('temple-last-cloud-sync', Date.now().toString());
            }
        } catch (error) {
            console.warn('自動同步失敗:', error);
        }
    }

    /**
     * 收集本地資料
     */
    collectLocalData() {
        return {
            records: JSON.parse(localStorage.getItem('temple-records') || '[]'),
            believers: JSON.parse(localStorage.getItem('temple-believers') || '[]'),
            reminders: JSON.parse(localStorage.getItem('temple-reminders') || '[]'),
            customCategories: {
                income: JSON.parse(localStorage.getItem('custom-income-categories') || '[]'),
                expense: JSON.parse(localStorage.getItem('custom-expense-categories') || '[]')
            },
            lastModified: Date.now()
        };
    }

    /**
     * 降級到本地存儲模式
     */
    fallbackToLocalStorage() {
        console.warn('降級到本地存儲模式');
        // 這裡可以使用原有的 CloudSyncService
        if (window.cloudSync) {
            this.localStorageMode = true;
        }
    }

    /**
     * 獲取錯誤訊息
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': '此電子郵件已被使用',
            'auth/invalid-email': '電子郵件格式無效',
            'auth/weak-password': '密碼強度不足',
            'auth/user-not-found': '找不到此用戶',
            'auth/wrong-password': '密碼錯誤',
            'auth/too-many-requests': '登入嘗試次數過多，請稍後再試',
            'auth/network-request-failed': '網路連線失敗',
            'auth/requires-recent-login': '需要重新登入'
        };
        
        return errorMessages[errorCode] || '發生未知錯誤';
    }

    /**
     * 獲取當前狀態
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isOnline: this.isOnline,
            currentUser: this.currentUser ? {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName,
                isAnonymous: this.currentUser.isAnonymous
            } : null,
            localStorageMode: this.localStorageMode || false
        };
    }
}

// 創建全局實例
window.firebaseCloud = new FirebaseCloudService(); 