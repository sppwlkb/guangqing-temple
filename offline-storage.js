/**
 * 廣清宮記帳軟體 - 離線存儲系統
 * 使用 IndexedDB 提供強大的離線資料庫功能
 */

class OfflineStorageService {
    constructor() {
        this.dbName = 'GuangqingTempleDB';
        this.dbVersion = 4; // 增加版本號避免衝突
        this.db = null;
        this.isInitialized = false;
        
        // 資料表定義
        this.stores = {
            records: {
                keyPath: 'id',
                indexes: [
                    { name: 'type', keyPath: 'type' },
                    { name: 'category', keyPath: 'category' },
                    { name: 'date', keyPath: 'date' },
                    { name: 'amount', keyPath: 'amount' },
                    { name: 'createdAt', keyPath: 'createdAt' }
                ]
            },
            believers: {
                keyPath: 'id',
                indexes: [
                    { name: 'name', keyPath: 'name' },
                    { name: 'phone', keyPath: 'phone' },
                    { name: 'email', keyPath: 'email' },
                    { name: 'totalDonation', keyPath: 'totalDonation' }
                ]
            },
            reminders: {
                keyPath: 'id',
                indexes: [
                    { name: 'dueDate', keyPath: 'dueDate' },
                    { name: 'completed', keyPath: 'completed' },
                    { name: 'repeat', keyPath: 'repeat' }
                ]
            },
            categories: {
                keyPath: 'id',
                indexes: [
                    { name: 'type', keyPath: 'type' },
                    { name: 'name', keyPath: 'name' }
                ]
            },
            syncQueue: {
                keyPath: 'id',
                indexes: [
                    { name: 'action', keyPath: 'action' },
                    { name: 'table', keyPath: 'table' },
                    { name: 'timestamp', keyPath: 'timestamp' }
                ]
            },
            settings: {
                keyPath: 'key'
            }
        };
        
        this.initDB();
    }

    /**
     * 初始化 IndexedDB
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB 開啟失敗:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.isInitialized = true;
                console.log('IndexedDB 初始化成功');

                // 發送初始化完成事件
                window.dispatchEvent(new CustomEvent('offlineStorageReady'));

                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 創建物件存儲
                Object.keys(this.stores).forEach(storeName => {
                    const storeConfig = this.stores[storeName];
                    
                    // 如果存儲已存在，先刪除
                    if (db.objectStoreNames.contains(storeName)) {
                        db.deleteObjectStore(storeName);
                    }
                    
                    // 創建新的存儲
                    const store = db.createObjectStore(storeName, {
                        keyPath: storeConfig.keyPath,
                        autoIncrement: storeConfig.keyPath === 'id'
                    });
                    
                    // 創建索引
                    if (storeConfig.indexes) {
                        storeConfig.indexes.forEach(index => {
                            store.createIndex(index.name, index.keyPath, { unique: false });
                        });
                    }
                });
                
                console.log('IndexedDB 結構升級完成');
            };
        });
    }

    /**
     * 確保資料庫已初始化
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            await this.initDB();
        }
    }

    /**
     * 新增資料
     */
    async add(storeName, data) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // 添加時間戳
            const dataWithTimestamp = {
                ...data,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const request = store.add(dataWithTimestamp);
            
            request.onsuccess = () => {
                // 添加到同步佇列
                this.addToSyncQueue('create', storeName, dataWithTimestamp);
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 更新資料
     */
    async update(storeName, data) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // 添加更新時間戳
            const dataWithTimestamp = {
                ...data,
                updatedAt: new Date().toISOString()
            };
            
            const request = store.put(dataWithTimestamp);
            
            request.onsuccess = () => {
                // 添加到同步佇列
                this.addToSyncQueue('update', storeName, dataWithTimestamp);
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 刪除資料
     */
    async delete(storeName, id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const request = store.delete(id);
            
            request.onsuccess = () => {
                // 添加到同步佇列
                this.addToSyncQueue('delete', storeName, { id });
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 根據 ID 獲取單筆資料
     */
    async get(storeName, id) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 獲取所有資料
     */
    async getAll(storeName) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 根據索引查詢資料
     */
    async getByIndex(storeName, indexName, value) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 範圍查詢
     */
    async getByRange(storeName, indexName, lowerBound, upperBound) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const range = IDBKeyRange.bound(lowerBound, upperBound);
            const request = index.getAll(range);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 複雜查詢（支援多條件篩選）
     */
    async query(storeName, conditions = {}) {
        const allData = await this.getAll(storeName);
        
        return allData.filter(item => {
            return Object.keys(conditions).every(key => {
                const condition = conditions[key];
                const value = item[key];
                
                if (typeof condition === 'object' && condition !== null) {
                    // 範圍查詢 { min: value, max: value }
                    if (condition.min !== undefined && value < condition.min) return false;
                    if (condition.max !== undefined && value > condition.max) return false;
                    // 包含查詢 { includes: value }
                    if (condition.includes !== undefined && !value?.toString().toLowerCase().includes(condition.includes.toLowerCase())) return false;
                    return true;
                } else {
                    // 精確匹配
                    return value === condition;
                }
            });
        });
    }

    /**
     * 統計查詢
     */
    async count(storeName, indexName = null, value = null) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let request;
            if (indexName && value !== null) {
                const index = store.index(indexName);
                request = index.count(value);
            } else {
                request = store.count();
            }
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 批次操作
     */
    async batch(operations) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [...new Set(operations.map(op => op.storeName))], 
                'readwrite'
            );
            
            const results = [];
            let completed = 0;
            
            transaction.oncomplete = () => {
                resolve(results);
            };
            
            transaction.onerror = () => {
                reject(transaction.error);
            };
            
            operations.forEach((operation, index) => {
                const store = transaction.objectStore(operation.storeName);
                let request;
                
                switch (operation.type) {
                    case 'add':
                        request = store.add({
                            ...operation.data,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        });
                        break;
                    case 'update':
                        request = store.put({
                            ...operation.data,
                            updatedAt: new Date().toISOString()
                        });
                        break;
                    case 'delete':
                        request = store.delete(operation.id);
                        break;
                }
                
                request.onsuccess = () => {
                    results[index] = request.result;
                    completed++;
                    
                    // 添加到同步佇列
                    this.addToSyncQueue(operation.type, operation.storeName, 
                        operation.type === 'delete' ? { id: operation.id } : operation.data);
                };
            });
        });
    }

    /**
     * 添加到同步佇列
     */
    async addToSyncQueue(action, table, data) {
        if (!this.isInitialized) return;
        
        const queueItem = {
            id: Date.now() + Math.random(),
            action: action,
            table: table,
            data: data,
            timestamp: Date.now(),
            synced: false
        };
        
        try {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            store.add(queueItem);
        } catch (error) {
            console.warn('添加同步佇列失敗:', error);
        }
    }

    /**
     * 獲取未同步的項目
     */
    async getPendingSyncItems() {
        return await this.getByIndex('syncQueue', 'synced', false);
    }

    /**
     * 標記同步項目為已同步
     */
    async markSyncItemCompleted(id) {
        const item = await this.get('syncQueue', id);
        if (item) {
            item.synced = true;
            item.syncedAt = new Date().toISOString();
            await this.update('syncQueue', item);
        }
    }

    /**
     * 清理已同步的項目
     */
    async cleanupSyncQueue() {
        const syncedItems = await this.getByIndex('syncQueue', 'synced', true);
        const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7天前
        
        for (const item of syncedItems) {
            if (item.timestamp < cutoffTime) {
                await this.delete('syncQueue', item.id);
            }
        }
    }

    /**
     * 資料庫統計資訊
     */
    async getStats() {
        const stats = {};
        
        for (const storeName of Object.keys(this.stores)) {
            if (storeName !== 'syncQueue') {
                stats[storeName] = await this.count(storeName);
            }
        }
        
        stats.pendingSync = await this.count('syncQueue', 'synced', false);
        stats.dbSize = await this.getDBSize();
        
        return stats;
    }

    /**
     * 獲取資料庫大小估算
     */
    async getDBSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                used: estimate.usage,
                available: estimate.quota,
                usedMB: Math.round(estimate.usage / 1024 / 1024 * 100) / 100,
                availableMB: Math.round(estimate.quota / 1024 / 1024 * 100) / 100
            };
        }
        return null;
    }

    /**
     * 匯出所有資料
     */
    async exportAllData() {
        const exportData = {};
        
        for (const storeName of Object.keys(this.stores)) {
            if (storeName !== 'syncQueue') {
                exportData[storeName] = await this.getAll(storeName);
            }
        }
        
        exportData.exportedAt = new Date().toISOString();
        exportData.version = this.dbVersion;
        
        return exportData;
    }

    /**
     * 匯入資料
     */
    async importData(data) {
        const operations = [];
        
        for (const storeName of Object.keys(data)) {
            if (storeName !== 'exportedAt' && storeName !== 'version' && this.stores[storeName]) {
                // 清空現有資料
                await this.clear(storeName);
                
                // 準備匯入操作
                data[storeName].forEach(item => {
                    operations.push({
                        type: 'add',
                        storeName: storeName,
                        data: item
                    });
                });
            }
        }
        
        // 批次匯入
        await this.batch(operations);
        
        return {
            success: true,
            imported: operations.length,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 清空資料表
     */
    async clear(storeName) {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * 備份資料庫
     */
    async backup() {
        const data = await this.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `廣清宮記帳備份_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return {
            success: true,
            message: '資料庫備份完成',
            timestamp: new Date().toLocaleString('zh-TW')
        };
    }

    /**
     * 從 localStorage 遷移資料
     */
    async migrateFromLocalStorage() {
        const migrationData = {
            records: JSON.parse(localStorage.getItem('temple-records') || '[]'),
            believers: JSON.parse(localStorage.getItem('temple-believers') || '[]'),
            reminders: JSON.parse(localStorage.getItem('temple-reminders') || '[]')
        };
        
        let migratedCount = 0;
        
        for (const [storeName, data] of Object.entries(migrationData)) {
            if (data.length > 0) {
                const operations = data.map(item => ({
                    type: 'add',
                    storeName: storeName,
                    data: item
                }));
                
                await this.batch(operations);
                migratedCount += data.length;
            }
        }
        
        // 遷移自定義類別
        const customIncomeCategories = JSON.parse(localStorage.getItem('custom-income-categories') || '[]');
        const customExpenseCategories = JSON.parse(localStorage.getItem('custom-expense-categories') || '[]');
        
        const categoryOperations = [];
        customIncomeCategories.forEach(category => {
            categoryOperations.push({
                type: 'add',
                storeName: 'categories',
                data: { ...category, type: 'income' }
            });
        });
        
        customExpenseCategories.forEach(category => {
            categoryOperations.push({
                type: 'add',
                storeName: 'categories',
                data: { ...category, type: 'expense' }
            });
        });
        
        if (categoryOperations.length > 0) {
            await this.batch(categoryOperations);
            migratedCount += categoryOperations.length;
        }
        
        return {
            success: true,
            migrated: migratedCount,
            message: `成功遷移 ${migratedCount} 筆資料到 IndexedDB`
        };
    }
}

// 創建全域實例
window.offlineStorage = new OfflineStorageService(); 