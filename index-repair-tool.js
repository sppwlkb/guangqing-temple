/**
 * 廣清宮記帳軟體 - 索引修復工具
 * 檢查和修復 IndexedDB 索引問題
 */

class IndexRepairTool {
    constructor() {
        this.dbName = 'GuangqingTempleDB';
        this.dbVersion = 5; // 再次升級版本以確保索引更新
        this.requiredIndexes = {
            records: [
                { name: 'type', keyPath: 'type' },
                { name: 'category', keyPath: 'category' },
                { name: 'date', keyPath: 'date' },
                { name: 'amount', keyPath: 'amount' },
                { name: 'createdAt', keyPath: 'createdAt' }
            ],
            believers: [
                { name: 'name', keyPath: 'name' },
                { name: 'phone', keyPath: 'phone' },
                { name: 'email', keyPath: 'email' },
                { name: 'totalDonation', keyPath: 'totalDonation' }
            ],
            reminders: [
                { name: 'dueDate', keyPath: 'dueDate' },
                { name: 'completed', keyPath: 'completed' },
                { name: 'repeat', keyPath: 'repeat' }
            ],
            categories: [
                { name: 'type', keyPath: 'type' },
                { name: 'name', keyPath: 'name' }
            ],
            syncQueue: [
                { name: 'action', keyPath: 'action' },
                { name: 'table', keyPath: 'table' },
                { name: 'timestamp', keyPath: 'timestamp' },
                { name: 'synced', keyPath: 'synced' }
            ]
        };
    }

    /**
     * 檢查和修復索引
     */
    async checkAndRepairIndexes() {
        try {
            console.log('開始檢查 IndexedDB 索引...');
            
            // 檢查當前資料庫版本
            const databases = await indexedDB.databases();
            const currentDb = databases.find(db => db.name === this.dbName);
            
            if (!currentDb) {
                console.log('資料庫不存在，將創建新資料庫');
                return await this.createNewDatabase();
            }
            
            console.log(`當前資料庫版本: ${currentDb.version}`);
            
            // 如果版本低於要求，升級資料庫
            if (currentDb.version < this.dbVersion) {
                console.log('需要升級資料庫版本');
                return await this.upgradeDatabase();
            }
            
            // 檢查索引完整性
            return await this.verifyIndexes();
            
        } catch (error) {
            console.error('索引檢查失敗:', error);
            return false;
        }
    }

    /**
     * 創建新資料庫
     */
    createNewDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('創建資料庫失敗:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('新資料庫創建成功');
                request.result.close();
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStoresAndIndexes(db);
            };
        });
    }

    /**
     * 升級資料庫
     */
    upgradeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('升級資料庫失敗:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log('資料庫升級成功');
                request.result.close();
                resolve(true);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.updateStoresAndIndexes(db);
            };
        });
    }

    /**
     * 創建 stores 和索引
     */
    createStoresAndIndexes(db) {
        console.log('創建 stores 和索引...');
        
        Object.entries(this.requiredIndexes).forEach(([storeName, indexes]) => {
            let store;
            
            if (!db.objectStoreNames.contains(storeName)) {
                // 創建 store
                const keyPath = storeName === 'settings' ? 'key' : 'id';
                store = db.createObjectStore(storeName, { keyPath });
                console.log(`創建 store: ${storeName}`);
            } else {
                // 獲取現有 store（在 upgrade 事件中）
                store = event.target.transaction.objectStore(storeName);
            }
            
            // 創建索引
            indexes.forEach(index => {
                if (!store.indexNames.contains(index.name)) {
                    store.createIndex(index.name, index.keyPath);
                    console.log(`創建索引: ${storeName}.${index.name}`);
                }
            });
        });
    }

    /**
     * 更新 stores 和索引
     */
    updateStoresAndIndexes(db) {
        console.log('更新 stores 和索引...');
        
        Object.entries(this.requiredIndexes).forEach(([storeName, indexes]) => {
            let store;
            
            if (!db.objectStoreNames.contains(storeName)) {
                // 創建新 store
                const keyPath = storeName === 'settings' ? 'key' : 'id';
                store = db.createObjectStore(storeName, { keyPath });
                console.log(`創建新 store: ${storeName}`);
            } else {
                // 獲取現有 store
                store = event.target.transaction.objectStore(storeName);
            }
            
            // 檢查和創建缺失的索引
            indexes.forEach(index => {
                if (!store.indexNames.contains(index.name)) {
                    store.createIndex(index.name, index.keyPath);
                    console.log(`添加缺失的索引: ${storeName}.${index.name}`);
                }
            });
        });
    }

    /**
     * 驗證索引完整性
     */
    async verifyIndexes() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            
            request.onerror = () => {
                reject(request.error);
            };
            
            request.onsuccess = () => {
                const db = request.result;
                let allIndexesValid = true;
                
                try {
                    Object.entries(this.requiredIndexes).forEach(([storeName, indexes]) => {
                        if (!db.objectStoreNames.contains(storeName)) {
                            console.warn(`Store '${storeName}' 不存在`);
                            allIndexesValid = false;
                            return;
                        }
                        
                        const transaction = db.transaction([storeName], 'readonly');
                        const store = transaction.objectStore(storeName);
                        
                        indexes.forEach(index => {
                            if (!store.indexNames.contains(index.name)) {
                                console.warn(`索引 '${index.name}' 在 store '${storeName}' 中不存在`);
                                allIndexesValid = false;
                            }
                        });
                    });
                    
                    db.close();
                    
                    if (allIndexesValid) {
                        console.log('✅ 所有索引驗證通過');
                        resolve(true);
                    } else {
                        console.warn('❌ 索引驗證失敗，需要修復');
                        resolve(false);
                    }
                } catch (error) {
                    console.error('索引驗證過程中發生錯誤:', error);
                    db.close();
                    reject(error);
                }
            };
        });
    }

    /**
     * 獲取資料庫資訊
     */
    async getDatabaseInfo() {
        try {
            const databases = await indexedDB.databases();
            const currentDb = databases.find(db => db.name === this.dbName);
            
            if (!currentDb) {
                return { exists: false };
            }
            
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName);
                
                request.onerror = () => reject(request.error);
                
                request.onsuccess = () => {
                    const db = request.result;
                    const info = {
                        exists: true,
                        version: db.version,
                        stores: Array.from(db.objectStoreNames),
                        indexes: {}
                    };
                    
                    // 獲取每個 store 的索引資訊
                    const transaction = db.transaction(Array.from(db.objectStoreNames), 'readonly');
                    
                    Array.from(db.objectStoreNames).forEach(storeName => {
                        const store = transaction.objectStore(storeName);
                        info.indexes[storeName] = Array.from(store.indexNames);
                    });
                    
                    db.close();
                    resolve(info);
                };
            });
        } catch (error) {
            console.error('獲取資料庫資訊失敗:', error);
            return { exists: false, error: error.message };
        }
    }
}

// 創建全域實例
window.indexRepairTool = new IndexRepairTool();

// 頁面載入時自動檢查
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 開始檢查 IndexedDB 索引...');
    
    try {
        const success = await window.indexRepairTool.checkAndRepairIndexes();
        
        if (success) {
            console.log('✅ IndexedDB 索引檢查完成');
            
            // 發送索引修復完成事件
            window.dispatchEvent(new CustomEvent('indexRepairComplete', {
                detail: { success: true }
            }));
        } else {
            console.warn('⚠️ IndexedDB 索引需要進一步修復');
        }
    } catch (error) {
        console.error('❌ IndexedDB 索引檢查失敗:', error);
        
        // 發送索引修復失敗事件
        window.dispatchEvent(new CustomEvent('indexRepairComplete', {
            detail: { success: false, error: error.message }
        }));
    }
});

// 提供調試方法
window.checkDatabaseInfo = async () => {
    return await window.indexRepairTool.getDatabaseInfo();
};
