/**
 * 廣清宮記帳軟體 - Firebase 雲端服務
 * 提供 Firebase 認證和雲端資料服務
 */

class FirebaseCloudService {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.auth = null;
        this.db = null;
        
        this.init();
    }

    /**
     * 初始化 Firebase 服務
     */
    async init() {
        try {
            // 檢查 Firebase 是否可用
            if (typeof firebase === 'undefined') {
                console.warn('Firebase SDK 未載入，使用模擬模式');
                this.isInitialized = false;
                return;
            }

            // Firebase 配置
            const firebaseConfig = {
                apiKey: "AIzaSyCUaCI3_DAs7iYDAUb8ezMqZRnQJJ0511Y",
                authDomain: "temple-accounting-a5d35.firebaseapp.com",
                projectId: "temple-accounting-a5d35",
                storageBucket: "temple-accounting-a5d35.firebasestorage.app",
                messagingSenderId: "1070844356209",
                appId: "1:1070844356209:web:bcc42d152470fd9f5b1dd0",
                measurementId: "G-DD094GW46G"
            };

            // 初始化 Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // 監聽認證狀態變化
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChanged(user);
            });

            this.isInitialized = true;
            console.log('Firebase 雲端服務初始化成功');
            
        } catch (error) {
            console.error('Firebase 初始化失敗:', error);
            this.isInitialized = false;
        }
    }

    /**
     * 認證狀態變化處理
     */
    onAuthStateChanged(user) {
        // 發送認證狀態變化事件
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { user }
        }));
    }

    /**
     * 用戶登入
     */
    async loginUser(email, password) {
        try {
            if (!this.isInitialized) {
                return this.simulateAuth('login', { email });
            }

            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || '用戶',
                    isAnonymous: user.isAnonymous
                },
                message: '登入成功'
            };
        } catch (error) {
            console.error('登入失敗:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 用戶註冊
     */
    async registerUser(email, password, displayName) {
        try {
            if (!this.isInitialized) {
                return this.simulateAuth('register', { email, displayName });
            }

            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // 更新用戶資料
            if (displayName) {
                await user.updateProfile({
                    displayName: displayName
                });
            }

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    displayName: displayName || '用戶',
                    isAnonymous: user.isAnonymous
                },
                message: '註冊成功'
            };
        } catch (error) {
            console.error('註冊失敗:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 匿名登入
     */
    async loginAnonymously() {
        try {
            if (!this.isInitialized) {
                return this.simulateAuth('anonymous');
            }

            const userCredential = await this.auth.signInAnonymously();
            const user = userCredential.user;

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: null,
                    displayName: '訪客',
                    isAnonymous: true
                },
                message: '訪客登入成功'
            };
        } catch (error) {
            console.error('匿名登入失敗:', error);
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
            if (!this.isInitialized) {
                this.currentUser = null;
                this.onAuthStateChanged(null);
                return {
                    success: true,
                    message: '登出成功'
                };
            }

            await this.auth.signOut();
            return {
                success: true,
                message: '登出成功'
            };
        } catch (error) {
            console.error('登出失敗:', error);
            return {
                success: false,
                error: error.code,
                message: '登出失敗'
            };
        }
    }

    /**
     * 獲取當前用戶
     */
    getCurrentUser() {
        if (!this.isInitialized) {
            return this.currentUser;
        }
        return this.auth.currentUser;
    }

    /**
     * 檢查用戶是否已登入
     */
    isLoggedIn() {
        const user = this.getCurrentUser();
        return user !== null;
    }

    /**
     * 獲取服務狀態
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isLoggedIn: this.isLoggedIn(),
            currentUser: this.getCurrentUser(),
            isOnline: navigator.onLine
        };
    }

    /**
     * 模擬認證（當 Firebase 不可用時）
     */
    simulateAuth(type, userData = {}) {
        const simulatedUser = {
            uid: 'demo_' + Date.now(),
            email: userData.email || null,
            displayName: userData.displayName || (type === 'anonymous' ? '訪客' : '演示用戶'),
            isAnonymous: type === 'anonymous'
        };

        this.currentUser = simulatedUser;
        
        // 延遲觸發認證狀態變化
        setTimeout(() => {
            this.onAuthStateChanged(simulatedUser);
        }, 100);

        return {
            success: true,
            user: simulatedUser,
            message: `${type === 'anonymous' ? '訪客' : '演示'}模式登入成功`
        };
    }

    /**
     * 獲取錯誤訊息
     */
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': '找不到此用戶',
            'auth/wrong-password': '密碼錯誤',
            'auth/email-already-in-use': '此電子郵件已被使用',
            'auth/weak-password': '密碼強度不足',
            'auth/invalid-email': '電子郵件格式無效',
            'auth/user-disabled': '此用戶已被停用',
            'auth/too-many-requests': '請求過於頻繁，請稍後再試',
            'auth/network-request-failed': '網路連接失敗'
        };

        return errorMessages[errorCode] || '發生未知錯誤';
    }

    /**
     * 重置密碼
     */
    async resetPassword(email) {
        try {
            if (!this.isInitialized) {
                return {
                    success: true,
                    message: '演示模式：密碼重置郵件已發送'
                };
            }

            await this.auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: '密碼重置郵件已發送'
            };
        } catch (error) {
            console.error('密碼重置失敗:', error);
            return {
                success: false,
                error: error.code,
                message: this.getErrorMessage(error.code)
            };
        }
    }

    /**
     * 更新用戶資料
     */
    async updateProfile(displayName, photoURL) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                throw new Error('用戶未登入');
            }

            if (!this.isInitialized) {
                // 模擬模式
                if (this.currentUser) {
                    this.currentUser.displayName = displayName;
                    this.currentUser.photoURL = photoURL;
                }
                return {
                    success: true,
                    message: '資料更新成功'
                };
            }

            await user.updateProfile({
                displayName: displayName,
                photoURL: photoURL
            });

            return {
                success: true,
                message: '資料更新成功'
            };
        } catch (error) {
            console.error('更新資料失敗:', error);
            return {
                success: false,
                error: error.code || 'update-failed',
                message: '更新資料失敗'
            };
        }
    }
}

// 創建全域實例
window.firebaseCloud = new FirebaseCloudService();

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Firebase 雲端服務已載入');
});
