/**
 * 廣清宮記帳軟體 - 雲端同步管理器
 * 整合 Firebase 雲端服務和 IndexedDB 離線存儲
 */

class CloudSyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.realtimeUnsubscribe = null;
        this.autoSyncInterval = null;
        this.conflictResolutionStrategy = 'timestamp'; // 'timestamp', 'manual', 'server-wins', 'client-wins'
        
        // 同步狀態
        this.syncStatus = {
            lastSync: null,
            pendingChanges: 0,
            conflicts: [],
            isRealtime: false
        };
        
        this.init();
    }

    /**
     * 初始化同步管理器
     */
    async init() {
        // 等待離線存儲初始化
        await window.offlineStorage.ensureInitialized();
        
        // 監聽網路狀態
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onNetworkChange();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onNetworkChange();
        });
        
        // 監聽 Firebase 認證狀態
        window.addEventListener('authStateChanged', (event) => {
            this.onAuthStateChange(event.detail.user);
        });
        
        // 檢查是否需要從 localStorage 遷移
        await this.checkMigration();
        
        // 設置自動同步
        this.setupAutoSync();
        
        console.log('雲端同步管理器初始化完成');
    }

    /**
     * 檢查並執行資料遷移
     */
    async checkMigration() {
        const migrated = localStorage.getItem('indexeddb-migrated');
        if (!migrated) {
            try {
                const result = await window.offlineStorage.migrateFromLocalStorage();
                localStorage.setItem('indexeddb-migrated', 'true');
                console.log('資料遷移完成:', result);
                
                // 通知用戶
                this.showNotification('資料遷移完成', '已將資料升級到新的存儲系統', 'success');
            } catch (error) {
                console.error('資料遷移失敗:', error);
            }
        }
    }

    /**
     * 網路狀態變化處理
     */
    onNetworkChange() {
        console.log('網路狀態變化:', this.isOnline ? '已連線' : '離線');
        
        if (this.isOnline) {
            // 網路恢復，嘗試同步
            setTimeout(() => this.syncPendingChanges(), 2000);
        } else {
            // 網路斷開，停止即時同步
            this.stopRealtimeSync();
        }
        
        // 更新 UI 狀態
        this.updateSyncStatusUI();
    }

    /**
     * 認證狀態變化處理
     */
    onAuthStateChange(user) {
        if (user) {
            // 用戶登入，開始雲端同步
            this.startCloudSync();
        } else {
            // 用戶登出，停止雲端同步
            this.stopCloudSync();
        }
    }

    /**
     * 開始雲端同步
     */
    async startCloudSync() {
        if (!this.isOnline || !window.firebaseCloud.currentUser) return;
        
        try {
            // 首次同步：下載雲端資料
            await this.performInitialSync();
            
            // 啟動即時同步
            this.startRealtimeSync();
            
            // 同步本地未同步的變更
            await this.syncPendingChanges();
            
            console.log('雲端同步已啟動');
        } catch (error) {
            console.error('啟動雲端同步失敗:', error);
        }
    }

    /**
     * 停止雲端同步
     */
    stopCloudSync() {
        this.stopRealtimeSync();
        this.stopAutoSync();
        console.log('雲端同步已停止');
    }

    /**
     * 執行初始同步
     */
    async performInitialSync() {
        try {
            this.syncInProgress = true;
            this.updateSyncStatusUI();
            
            // 下載雲端資料
            const cloudResult = await window.firebaseCloud.downloadData();
            
            if (cloudResult.success && cloudResult.data) {
                // 檢查衝突
                const conflicts = await this.detectConflicts(cloudResult.data);
                
                if (conflicts.length > 0) {
                    // 有衝突，需要解決
                    await this.resolveConflicts(conflicts, cloudResult.data);
                } else {
                    // 無衝突，直接合併
                    await this.mergeCloudData(cloudResult.data);
                }
                
                this.syncStatus.lastSync = new Date();
                this.showNotification('初始同步完成', '雲端資料已同步到本地', 'success');
            }
        } catch (error) {
            console.error('初始同步失敗:', error);
            this.showNotification('同步失敗', error.message, 'error');
        } finally {
            this.syncInProgress = false;
            this.updateSyncStatusUI();
        }
    }

    /**
     * 檢測資料衝突
     */
    async detectConflicts(cloudData) {
        const conflicts = [];
        
        // 檢查記錄衝突
        const localRecords = await window.offlineStorage.getAll('records');
        const cloudRecords = cloudData.records || [];
        
        for (const cloudRecord of cloudRecords) {
            const localRecord = localRecords.find(r => r.id === cloudRecord.id);
            if (localRecord && localRecord.updatedAt !== cloudRecord.updatedAt) {
                conflicts.push({
                    type: 'records',
                    id: cloudRecord.id,
                    local: localRecord,
                    cloud: cloudRecord,
                    field: 'record'
                });
            }
        }
        
        return conflicts;
    }

    /**
     * 解決資料衝突
     */
    async resolveConflicts(conflicts, cloudData) {
        switch (this.conflictResolutionStrategy) {
            case 'timestamp':
                await this.resolveByTimestamp(conflicts, cloudData);
                break;
            case 'server-wins':
                await this.resolveServerWins(conflicts, cloudData);
                break;
            case 'client-wins':
                await this.resolveClientWins(conflicts);
                break;
            case 'manual':
                await this.resolveManually(conflicts, cloudData);
                break;
        }
    }

    /**
     * 根據時間戳解決衝突
     */
    async resolveByTimestamp(conflicts, cloudData) {
        for (const conflict of conflicts) {
            const localTime = new Date(conflict.local.updatedAt);
            const cloudTime = new Date(conflict.cloud.updatedAt);
            
            if (cloudTime > localTime) {
                // 雲端資料較新，使用雲端資料
                await window.offlineStorage.update(conflict.type, conflict.cloud);
            }
            // 本地資料較新則保持不變
        }
        
        // 合併其餘無衝突資料
        await this.mergeCloudData(cloudData, conflicts.map(c => c.id));
    }

    /**
     * 合併雲端資料
     */
    async mergeCloudData(cloudData, excludeIds = []) {
        const operations = [];
        
        // 合併記錄
        if (cloudData.records) {
            cloudData.records
                .filter(record => !excludeIds.includes(record.id))
                .forEach(record => {
                    operations.push({
                        type: 'update',
                        storeName: 'records',
                        data: record
                    });
                });
        }
        
        // 合併信眾資料
        if (cloudData.believers) {
            cloudData.believers.forEach(believer => {
                operations.push({
                    type: 'update',
                    storeName: 'believers',
                    data: believer
                });
            });
        }
        
        // 合併提醒
        if (cloudData.reminders) {
            cloudData.reminders.forEach(reminder => {
                operations.push({
                    type: 'update',
                    storeName: 'reminders',
                    data: reminder
                });
            });
        }
        
        // 批次執行
        if (operations.length > 0) {
            await window.offlineStorage.batch(operations);
        }
        
        // 合併自定義類別
        if (cloudData.customCategories) {
            await this.mergeCustomCategories(cloudData.customCategories);
        }
    }

    /**
     * 合併自定義類別
     */
    async mergeCustomCategories(cloudCategories) {
        const operations = [];
        
        if (cloudCategories.customIncomeCategories) {
            cloudCategories.customIncomeCategories.forEach(category => {
                operations.push({
                    type: 'update',
                    storeName: 'categories',
                    data: { ...category, type: 'income' }
                });
            });
        }
        
        if (cloudCategories.customExpenseCategories) {
            cloudCategories.customExpenseCategories.forEach(category => {
                operations.push({
                    type: 'update',
                    storeName: 'categories',
                    data: { ...category, type: 'expense' }
                });
            });
        }
        
        if (operations.length > 0) {
            await window.offlineStorage.batch(operations);
        }
    }

    /**
     * 同步待處理的變更
     */
    async syncPendingChanges() {
        if (!this.isOnline || !window.firebaseCloud.currentUser || this.syncInProgress) return;
        
        try {
            this.syncInProgress = true;
            this.updateSyncStatusUI();
            
            const pendingItems = await window.offlineStorage.getPendingSyncItems();
            
            if (pendingItems.length === 0) {
                console.log('沒有待同步的變更');
                return;
            }
            
            // 收集所有資料
            const localData = await this.collectAllLocalData();
            
            // 上傳到雲端
            const result = await window.firebaseCloud.uploadData(localData);
            
            if (result.success) {
                // 標記所有項目為已同步
                for (const item of pendingItems) {
                    await window.offlineStorage.markSyncItemCompleted(item.id);
                }
                
                this.syncStatus.lastSync = new Date();
                this.syncStatus.pendingChanges = 0;
                
                console.log(`同步完成：${pendingItems.length} 個變更已上傳`);
                this.showNotification('同步完成', `${pendingItems.length} 個變更已上傳到雲端`, 'success');
            }
        } catch (error) {
            console.error('同步待處理變更失敗:', error);
            this.showNotification('同步失敗', error.message, 'error');
        } finally {
            this.syncInProgress = false;
            this.updateSyncStatusUI();
        }
    }

    /**
     * 收集所有本地資料
     */
    async collectAllLocalData() {
        const [records, believers, reminders, incomeCategories, expenseCategories] = await Promise.all([
            window.offlineStorage.getAll('records'),
            window.offlineStorage.getAll('believers'),
            window.offlineStorage.getAll('reminders'),
            window.offlineStorage.getByIndex('categories', 'type', 'income'),
            window.offlineStorage.getByIndex('categories', 'type', 'expense')
        ]);
        
        return {
            records,
            believers,
            reminders,
            customCategories: {
                income: incomeCategories,
                expense: expenseCategories
            }
        };
    }

    /**
     * 啟動即時同步
     */
    startRealtimeSync() {
        if (!this.isOnline || !window.firebaseCloud.currentUser) return;
        
        this.realtimeUnsubscribe = window.firebaseCloud.setupRealtimeSync((type, data, changes) => {
            this.handleRealtimeUpdate(type, data, changes);
        });
        
        this.syncStatus.isRealtime = true;
        console.log('即時同步已啟動');
    }

    /**
     * 停止即時同步
     */
    stopRealtimeSync() {
        if (this.realtimeUnsubscribe) {
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
        
        this.syncStatus.isRealtime = false;
        console.log('即時同步已停止');
    }

    /**
     * 處理即時更新
     */
    async handleRealtimeUpdate(type, data, changes) {
        try {
            const operations = [];
            
            changes.forEach(change => {
                const doc = change.doc;
                const docData = { id: doc.id, ...doc.data() };
                
                switch (change.type) {
                    case 'added':
                    case 'modified':
                        operations.push({
                            type: 'update',
                            storeName: type,
                            data: docData
                        });
                        break;
                    case 'removed':
                        operations.push({
                            type: 'delete',
                            storeName: type,
                            id: doc.id
                        });
                        break;
                }
            });
            
            if (operations.length > 0) {
                await window.offlineStorage.batch(operations);
                
                // 通知應用程式資料已更新
                window.dispatchEvent(new CustomEvent('dataUpdated', {
                    detail: { type, changes: operations }
                }));
                
                console.log(`即時同步：${type} 更新了 ${operations.length} 筆資料`);
            }
        } catch (error) {
            console.error('處理即時更新失敗:', error);
        }
    }

    /**
     * 設置自動同步
     */
    setupAutoSync() {
        // 每30秒檢查一次待同步項目
        this.autoSyncInterval = setInterval(async () => {
            if (this.isOnline && window.firebaseCloud.currentUser && !this.syncInProgress) {
                const pendingCount = await window.offlineStorage.count('syncQueue', 'synced', false);
                this.syncStatus.pendingChanges = pendingCount;
                
                if (pendingCount > 0) {
                    await this.syncPendingChanges();
                }
            }
            
            this.updateSyncStatusUI();
        }, 30000);
    }

    /**
     * 停止自動同步
     */
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
        }
    }

    /**
     * 手動觸發完整同步
     */
    async manualSync() {
        if (!window.firebaseCloud.currentUser) {
            this.showNotification('同步失敗', '請先登入帳號', 'warning');
            return;
        }
        
        if (!this.isOnline) {
            this.showNotification('同步失敗', '請檢查網路連線', 'warning');
            return;
        }
        
        try {
            this.syncInProgress = true;
            this.updateSyncStatusUI();
            
            // 雙向同步
            await this.performBidirectionalSync();
            
            this.showNotification('同步完成', '所有資料已與雲端同步', 'success');
        } catch (error) {
            console.error('手動同步失敗:', error);
            this.showNotification('同步失敗', error.message, 'error');
        } finally {
            this.syncInProgress = false;
            this.updateSyncStatusUI();
        }
    }

    /**
     * 執行雙向同步
     */
    async performBidirectionalSync() {
        // 1. 上傳本地變更
        await this.syncPendingChanges();
        
        // 2. 下載雲端最新資料
        const cloudResult = await window.firebaseCloud.downloadData();
        if (cloudResult.success) {
            await this.mergeCloudData(cloudResult.data);
        }
        
        // 3. 清理同步佇列
        await window.offlineStorage.cleanupSyncQueue();
        
        this.syncStatus.lastSync = new Date();
    }

    /**
     * 獲取同步狀態
     */
    async getSyncStatus() {
        const pendingCount = await window.offlineStorage.count('syncQueue', 'synced', false);
        const stats = await window.offlineStorage.getStats();
        const firebaseStatus = window.firebaseCloud.getStatus();
        
        return {
            ...this.syncStatus,
            pendingChanges: pendingCount,
            isOnline: this.isOnline,
            isAuthenticated: !!firebaseStatus.currentUser,
            currentUser: firebaseStatus.currentUser,
            syncInProgress: this.syncInProgress,
            dbStats: stats,
            lastSyncFormatted: this.syncStatus.lastSync ? 
                this.syncStatus.lastSync.toLocaleString('zh-TW') : '從未同步'
        };
    }

    /**
     * 更新同步狀態 UI
     */
    updateSyncStatusUI() {
        // 發送狀態更新事件
        window.dispatchEvent(new CustomEvent('syncStatusUpdated', {
            detail: this.getSyncStatus()
        }));
    }

    /**
     * 顯示通知
     */
    showNotification(title, message, type = 'info') {
        // 發送通知事件
        window.dispatchEvent(new CustomEvent('showNotification', {
            detail: { title, message, type }
        }));
    }

    /**
     * 強制重新同步（清除本地資料並重新下載）
     */
    async forceResync() {
        if (!window.firebaseCloud.currentUser) {
            throw new Error('請先登入帳號');
        }
        
        if (!confirm('此操作將清除所有本地資料並重新從雲端下載，確定要繼續嗎？')) {
            return;
        }
        
        try {
            this.syncInProgress = true;
            this.updateSyncStatusUI();
            
            // 清除本地資料
            await Promise.all([
                window.offlineStorage.clear('records'),
                window.offlineStorage.clear('believers'),
                window.offlineStorage.clear('reminders'),
                window.offlineStorage.clear('categories'),
                window.offlineStorage.clear('syncQueue')
            ]);
            
            // 重新下載雲端資料
            const cloudResult = await window.firebaseCloud.downloadData();
            if (cloudResult.success) {
                await this.mergeCloudData(cloudResult.data);
            }
            
            this.showNotification('重新同步完成', '所有資料已從雲端重新下載', 'success');
        } catch (error) {
            console.error('強制重新同步失敗:', error);
            this.showNotification('重新同步失敗', error.message, 'error');
        } finally {
            this.syncInProgress = false;
            this.updateSyncStatusUI();
        }
    }

    /**
     * 設置衝突解決策略
     */
    setConflictResolutionStrategy(strategy) {
        this.conflictResolutionStrategy = strategy;
        localStorage.setItem('conflict-resolution-strategy', strategy);
    }

    /**
     * 獲取資料庫使用統計
     */
    async getUsageStats() {
        const stats = await window.offlineStorage.getStats();
        const dbSize = await window.offlineStorage.getDBSize();
        
        return {
            ...stats,
            storage: dbSize,
            lastSync: this.syncStatus.lastSync,
            pendingChanges: this.syncStatus.pendingChanges,
            isOnline: this.isOnline,
            isRealtime: this.syncStatus.isRealtime
        };
    }
}

// 創建全域實例
window.cloudSyncManager = new CloudSyncManager(); 