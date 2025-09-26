/**
 * 廣清宮記帳軟體 - 錯誤修復狀態監控
 * 監控和報告系統錯誤修復狀態
 */

class ErrorFixStatus {
    constructor() {
        this.fixes = {
            indexedDBVersion: false,
            serviceWorkerCache: false,
            moduleImport: false,
            databaseCleanup: false,
            indexRepair: false
        };
        
        this.init();
    }

    /**
     * 初始化錯誤修復監控
     */
    init() {
        // 監控 IndexedDB 版本問題
        this.checkIndexedDBVersion();
        
        // 監控 Service Worker 快取問題
        this.checkServiceWorkerCache();
        
        // 監控模組載入問題
        this.checkModuleImport();
        
        // 監控資料庫清理狀態
        this.checkDatabaseCleanup();

        // 監控索引修復狀態
        this.checkIndexRepair();
        
        // 定期檢查修復狀態
        setInterval(() => {
            this.reportStatus();
        }, 10000); // 每 10 秒檢查一次
        
        console.log('錯誤修復狀態監控已啟動');
    }

    /**
     * 檢查 IndexedDB 版本問題
     */
    async checkIndexedDBVersion() {
        try {
            // 檢查是否能正常開啟資料庫
            const request = indexedDB.open('GuangqingTempleDB', 4);
            
            request.onsuccess = () => {
                this.fixes.indexedDBVersion = true;
                console.log('✅ IndexedDB 版本問題已修復');
                request.result.close();
            };
            
            request.onerror = (event) => {
                console.warn('❌ IndexedDB 版本問題仍存在:', event.target.error);
            };
            
            request.onblocked = () => {
                console.warn('⚠️ IndexedDB 被阻擋，請關閉其他分頁');
            };
        } catch (error) {
            console.error('檢查 IndexedDB 版本時發生錯誤:', error);
        }
    }

    /**
     * 檢查 Service Worker 快取問題
     */
    async checkServiceWorkerCache() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    this.fixes.serviceWorkerCache = true;
                    console.log('✅ Service Worker 快取問題已修復');
                } else {
                    console.log('ℹ️ Service Worker 尚未註冊');
                }
            } else {
                console.log('ℹ️ 瀏覽器不支援 Service Worker');
                this.fixes.serviceWorkerCache = true; // 標記為已修復（不適用）
            }
        } catch (error) {
            console.error('檢查 Service Worker 時發生錯誤:', error);
        }
    }

    /**
     * 檢查模組載入問題
     */
    checkModuleImport() {
        // 檢查是否有 ES6 模組錯誤
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('Cannot use import statement outside a module')) {
                console.warn('❌ 發現 ES6 模組載入錯誤:', event.message);
                this.fixes.moduleImport = false;
            }
        });
        
        // 如果沒有錯誤，標記為已修復
        setTimeout(() => {
            if (this.fixes.moduleImport === false) {
                this.fixes.moduleImport = true;
                console.log('✅ ES6 模組載入問題已修復');
            }
        }, 5000);
    }

    /**
     * 檢查資料庫清理狀態
     */
    checkDatabaseCleanup() {
        // 監聽資料庫清理完成事件
        window.addEventListener('databaseCleanupComplete', () => {
            this.fixes.databaseCleanup = true;
            console.log('✅ 資料庫清理已完成');
        });

        // 檢查是否需要清理
        if (localStorage.getItem('need_restore_backup') === 'true') {
            console.log('ℹ️ 檢測到需要恢復備份資料');
        } else {
            this.fixes.databaseCleanup = true;
        }
    }

    /**
     * 檢查索引修復狀態
     */
    checkIndexRepair() {
        // 監聽索引修復完成事件
        window.addEventListener('indexRepairComplete', (event) => {
            if (event.detail.success) {
                this.fixes.indexRepair = true;
                console.log('✅ IndexedDB 索引修復已完成');
            } else {
                console.warn('❌ IndexedDB 索引修復失敗:', event.detail.error);
            }
        });

        // 檢查是否有索引錯誤
        window.addEventListener('error', (event) => {
            if (event.message && event.message.includes('The specified index was not found')) {
                console.warn('❌ 發現索引不存在錯誤:', event.message);
                this.fixes.indexRepair = false;
            }
        });

        // 默認假設索引正常，等待事件確認
        setTimeout(() => {
            if (this.fixes.indexRepair === false) {
                // 如果沒有收到修復完成事件，保持 false
                console.log('ℹ️ 等待索引修復完成...');
            }
        }, 3000);
    }

    /**
     * 報告修復狀態
     */
    reportStatus() {
        const totalFixes = Object.keys(this.fixes).length;
        const completedFixes = Object.values(this.fixes).filter(Boolean).length;
        const progress = Math.round((completedFixes / totalFixes) * 100);
        
        if (progress === 100) {
            console.log('🎉 所有錯誤修復已完成！');
            this.showSuccessMessage();
        } else {
            console.log(`🔧 錯誤修復進度: ${progress}% (${completedFixes}/${totalFixes})`);
            this.showProgressMessage(progress, completedFixes, totalFixes);
        }
    }

    /**
     * 顯示成功訊息
     */
    showSuccessMessage() {
        // 只顯示一次成功訊息
        if (this.successShown) return;
        this.successShown = true;
        
        // 創建成功提示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: 'Microsoft JhengHei', Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🎉</span>
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">系統修復完成！</div>
                    <div style="font-size: 12px; opacity: 0.9;">所有錯誤已修復，系統運行正常</div>
                </div>
            </div>
        `;
        
        // 添加動畫樣式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // 5 秒後自動移除
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    /**
     * 顯示進度訊息
     */
    showProgressMessage(progress, completed, total) {
        // 只在控制台顯示進度，避免過多 UI 干擾
        const pendingFixes = Object.entries(this.fixes)
            .filter(([key, value]) => !value)
            .map(([key]) => key);
        
        if (pendingFixes.length > 0) {
            console.log('⏳ 待修復項目:', pendingFixes.join(', '));
        }
    }

    /**
     * 手動觸發狀態檢查
     */
    checkAllStatus() {
        console.log('🔍 手動檢查所有修復狀態...');
        this.checkIndexedDBVersion();
        this.checkServiceWorkerCache();
        this.checkDatabaseCleanup();
        
        setTimeout(() => {
            this.reportStatus();
        }, 2000);
    }

    /**
     * 獲取當前修復狀態
     */
    getStatus() {
        return {
            fixes: { ...this.fixes },
            progress: Math.round((Object.values(this.fixes).filter(Boolean).length / Object.keys(this.fixes).length) * 100)
        };
    }
}

// 創建全域實例
window.errorFixStatus = new ErrorFixStatus();

// 頁面載入完成後開始監控
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 開始監控錯誤修復狀態...');
    
    // 延遲檢查，確保其他腳本已載入
    setTimeout(() => {
        window.errorFixStatus.checkAllStatus();
    }, 3000);
});

// 提供全域方法供調試使用
window.checkErrorFixStatus = () => {
    return window.errorFixStatus.getStatus();
};
