/**
 * 廣清宮記帳軟體 - 資料庫清理工具
 * 解決 IndexedDB 版本衝突問題
 */

class DatabaseCleanup {
    constructor() {
        this.dbName = 'GuangqingTempleDB';
    }

    /**
     * 清理舊版本資料庫
     */
    async cleanupOldDatabase() {
        try {
            console.log('開始清理舊版本資料庫...');
            
            // 檢查是否存在舊版本資料庫
            const databases = await indexedDB.databases();
            const targetDb = databases.find(db => db.name === this.dbName);
            
            if (targetDb) {
                console.log(`發現資料庫: ${targetDb.name}, 版本: ${targetDb.version}`);
                
                // 如果版本衝突，刪除舊資料庫
                if (targetDb.version && targetDb.version >= 4) {
                    console.log('資料庫版本正常，無需清理');
                    return true;
                }
                
                // 備份重要資料
                const backupData = await this.backupImportantData();
                
                // 刪除舊資料庫
                await this.deleteDatabase();
                
                // 恢復重要資料
                if (backupData) {
                    await this.restoreImportantData(backupData);
                }
                
                console.log('資料庫清理完成');
                return true;
            } else {
                console.log('未發現舊版本資料庫');
                return true;
            }
        } catch (error) {
            console.error('資料庫清理失敗:', error);
            return false;
        }
    }

    /**
     * 備份重要資料
     */
    async backupImportantData() {
        try {
            const request = indexedDB.open(this.dbName);
            
            return new Promise((resolve, reject) => {
                request.onerror = () => {
                    console.log('無法開啟舊資料庫進行備份');
                    resolve(null);
                };
                
                request.onsuccess = async (event) => {
                    const db = event.target.result;
                    const backup = {};
                    
                    try {
                        // 備份收入記錄
                        if (db.objectStoreNames.contains('income')) {
                            backup.income = await this.getAllRecords(db, 'income');
                        }
                        
                        // 備份支出記錄
                        if (db.objectStoreNames.contains('expenses')) {
                            backup.expenses = await this.getAllRecords(db, 'expenses');
                        }
                        
                        // 備份設定
                        if (db.objectStoreNames.contains('settings')) {
                            backup.settings = await this.getAllRecords(db, 'settings');
                        }
                        
                        db.close();
                        console.log('資料備份完成:', Object.keys(backup));
                        resolve(backup);
                    } catch (error) {
                        console.error('備份過程中發生錯誤:', error);
                        db.close();
                        resolve(null);
                    }
                };
            });
        } catch (error) {
            console.error('備份失敗:', error);
            return null;
        }
    }

    /**
     * 獲取指定 store 的所有記錄
     */
    getAllRecords(db, storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
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
     * 刪除資料庫
     */
    deleteDatabase() {
        return new Promise((resolve, reject) => {
            console.log('正在刪除舊資料庫...');
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            
            deleteRequest.onsuccess = () => {
                console.log('舊資料庫刪除成功');
                resolve();
            };
            
            deleteRequest.onerror = () => {
                console.error('刪除資料庫失敗:', deleteRequest.error);
                reject(deleteRequest.error);
            };
            
            deleteRequest.onblocked = () => {
                console.warn('資料庫刪除被阻擋，請關閉其他分頁');
                // 等待一段時間後重試
                setTimeout(() => {
                    resolve();
                }, 2000);
            };
        });
    }

    /**
     * 恢復重要資料
     */
    async restoreImportantData(backupData) {
        try {
            console.log('開始恢復備份資料...');
            
            // 等待新資料庫初始化
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 將備份資料存儲到 localStorage 作為臨時存儲
            if (backupData.income && backupData.income.length > 0) {
                localStorage.setItem('backup_income', JSON.stringify(backupData.income));
                console.log(`備份了 ${backupData.income.length} 筆收入記錄`);
            }
            
            if (backupData.expenses && backupData.expenses.length > 0) {
                localStorage.setItem('backup_expenses', JSON.stringify(backupData.expenses));
                console.log(`備份了 ${backupData.expenses.length} 筆支出記錄`);
            }
            
            if (backupData.settings && backupData.settings.length > 0) {
                localStorage.setItem('backup_settings', JSON.stringify(backupData.settings));
                console.log(`備份了 ${backupData.settings.length} 筆設定`);
            }
            
            // 設置恢復標記
            localStorage.setItem('need_restore_backup', 'true');
            
            console.log('備份資料已暫存到 localStorage，將在新資料庫初始化後自動恢復');
        } catch (error) {
            console.error('恢復資料失敗:', error);
        }
    }

    /**
     * 從 localStorage 恢復備份資料到新資料庫
     */
    async restoreFromLocalStorage() {
        try {
            if (localStorage.getItem('need_restore_backup') !== 'true') {
                return;
            }
            
            console.log('開始從 localStorage 恢復備份資料...');
            
            // 等待離線存儲服務初始化
            if (window.offlineStorage && window.offlineStorage.isInitialized) {
                const income = localStorage.getItem('backup_income');
                const expenses = localStorage.getItem('backup_expenses');
                const settings = localStorage.getItem('backup_settings');
                
                if (income) {
                    const incomeData = JSON.parse(income);
                    for (const record of incomeData) {
                        await window.offlineStorage.addIncome(record);
                    }
                    console.log(`恢復了 ${incomeData.length} 筆收入記錄`);
                }
                
                if (expenses) {
                    const expenseData = JSON.parse(expenses);
                    for (const record of expenseData) {
                        await window.offlineStorage.addExpense(record);
                    }
                    console.log(`恢復了 ${expenseData.length} 筆支出記錄`);
                }
                
                // 清理備份資料
                localStorage.removeItem('backup_income');
                localStorage.removeItem('backup_expenses');
                localStorage.removeItem('backup_settings');
                localStorage.removeItem('need_restore_backup');
                
                console.log('備份資料恢復完成');
            }
        } catch (error) {
            console.error('從 localStorage 恢復資料失敗:', error);
        }
    }
}

// 創建全域實例
window.databaseCleanup = new DatabaseCleanup();

// 頁面載入時自動執行清理
document.addEventListener('DOMContentLoaded', async () => {
    await window.databaseCleanup.cleanupOldDatabase();
});

// 在離線存儲初始化後恢復備份
window.addEventListener('offlineStorageReady', async () => {
    await window.databaseCleanup.restoreFromLocalStorage();
});
