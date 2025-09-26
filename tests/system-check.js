/**
 * 廣清宮記帳軟體 - 系統檢查腳本
 * 檢查所有核心功能和模組整合
 */

class SystemChecker {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
        this.isNode = typeof window === 'undefined';
    }

    // 日誌輸出
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    // 執行測試
    async runTest(name, testFn) {
        this.results.total++;
        this.log(`開始測試: ${name}`);
        
        try {
            await testFn();
            this.results.passed++;
            this.log(`測試通過: ${name}`, 'success');
            return true;
        } catch (error) {
            this.results.failed++;
            this.results.errors.push({ test: name, error: error.message });
            this.log(`測試失敗: ${name} - ${error.message}`, 'error');
            return false;
        }
    }

    // 檢查檔案結構
    async checkFileStructure() {
        await this.runTest('檔案結構檢查', async () => {
            const requiredFiles = [
                'package.json',
                'index.html',
                'src/App.vue',
                'src/main.js',
                'src/router/index.js',
                'src/stores/app.js',
                'src/stores/auth.js',
                'src/stores/ui.js',
                'src/stores/accounting.js',
                'src/stores/income.js',
                'src/stores/expense.js',
                'src/stores/reports.js',
                'src/stores/analytics.js',
                'src/stores/believers.js',
                'src/stores/sync.js',
                'src/services/firebase.js',
                'firebase-config.js'
            ];

            if (this.isNode) {
                const fs = require('fs');
                const path = require('path');
                
                for (const file of requiredFiles) {
                    if (!fs.existsSync(path.join(process.cwd(), file))) {
                        throw new Error(`缺少必要檔案: ${file}`);
                    }
                }
            } else {
                // 瀏覽器環境中的檢查
                this.log('瀏覽器環境中跳過檔案結構檢查', 'warning');
            }
        });
    }

    // 檢查 package.json 依賴
    async checkDependencies() {
        await this.runTest('依賴檢查', async () => {
            if (this.isNode) {
                const fs = require('fs');
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                
                const requiredDeps = [
                    'vue',
                    'vue-router',
                    'pinia',
                    'element-plus',
                    'firebase',
                    'dayjs',
                    'echarts',
                    'crypto-js'
                ];

                const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                for (const dep of requiredDeps) {
                    if (!allDeps[dep]) {
                        throw new Error(`缺少必要依賴: ${dep}`);
                    }
                }
            } else {
                // 檢查全域變數是否存在
                const globalChecks = [
                    { name: 'Vue', check: () => typeof Vue !== 'undefined' },
                    { name: 'ElementPlus', check: () => typeof ElementPlus !== 'undefined' },
                    { name: 'dayjs', check: () => typeof dayjs !== 'undefined' }
                ];

                for (const { name, check } of globalChecks) {
                    if (!check()) {
                        this.log(`全域變數 ${name} 未載入`, 'warning');
                    }
                }
            }
        });
    }

    // 檢查 Firebase 配置
    async checkFirebaseConfig() {
        await this.runTest('Firebase 配置檢查', async () => {
            if (this.isNode) {
                const fs = require('fs');
                const configContent = fs.readFileSync('firebase-config.js', 'utf8');
                
                const requiredFields = [
                    'apiKey',
                    'authDomain',
                    'projectId',
                    'storageBucket',
                    'messagingSenderId',
                    'appId'
                ];

                for (const field of requiredFields) {
                    if (!configContent.includes(field)) {
                        throw new Error(`Firebase 配置缺少 ${field}`);
                    }
                }
            } else {
                // 瀏覽器環境檢查
                if (typeof firebase === 'undefined') {
                    throw new Error('Firebase SDK 未載入');
                }
            }
        });
    }

    // 檢查 Vue 組件
    async checkVueComponents() {
        await this.runTest('Vue 組件檢查', async () => {
            if (this.isNode) {
                const fs = require('fs');
                const path = require('path');
                
                const componentDirs = [
                    'src/views',
                    'src/components'
                ];

                for (const dir of componentDirs) {
                    if (fs.existsSync(dir)) {
                        const files = fs.readdirSync(dir, { recursive: true });
                        const vueFiles = files.filter(file => file.endsWith('.vue'));
                        
                        if (vueFiles.length === 0) {
                            throw new Error(`${dir} 目錄中沒有 Vue 組件`);
                        }

                        // 檢查組件語法
                        for (const file of vueFiles.slice(0, 5)) { // 只檢查前5個
                            const filePath = path.join(dir, file);
                            const content = fs.readFileSync(filePath, 'utf8');
                            
                            if (!content.includes('<template>') || !content.includes('<script')) {
                                throw new Error(`組件 ${file} 格式不正確`);
                            }
                        }
                    }
                }
            } else {
                this.log('瀏覽器環境中跳過 Vue 組件檢查', 'warning');
            }
        });
    }

    // 檢查 Pinia Stores
    async checkPiniaStores() {
        await this.runTest('Pinia Stores 檢查', async () => {
            if (this.isNode) {
                const fs = require('fs');
                const path = require('path');
                
                const storeFiles = [
                    'src/stores/app.js',
                    'src/stores/auth.js',
                    'src/stores/ui.js',
                    'src/stores/accounting.js',
                    'src/stores/income.js',
                    'src/stores/expense.js',
                    'src/stores/reports.js',
                    'src/stores/analytics.js',
                    'src/stores/believers.js',
                    'src/stores/sync.js'
                ];

                for (const storeFile of storeFiles) {
                    if (!fs.existsSync(storeFile)) {
                        throw new Error(`Store 檔案不存在: ${storeFile}`);
                    }

                    const content = fs.readFileSync(storeFile, 'utf8');
                    
                    if (!content.includes('defineStore')) {
                        throw new Error(`Store ${storeFile} 沒有使用 defineStore`);
                    }

                    if (!content.includes('export')) {
                        throw new Error(`Store ${storeFile} 沒有匯出`);
                    }
                }
            } else {
                this.log('瀏覽器環境中跳過 Pinia Stores 檢查', 'warning');
            }
        });
    }

    // 檢查路由配置
    async checkRouterConfig() {
        await this.runTest('路由配置檢查', async () => {
            if (this.isNode) {
                const fs = require('fs');
                const routerContent = fs.readFileSync('src/router/index.js', 'utf8');
                
                const requiredRoutes = [
                    'dashboard',
                    'income',
                    'expense',
                    'reports',
                    'believers',
                    'accounting'
                ];

                for (const route of requiredRoutes) {
                    if (!routerContent.includes(route)) {
                        this.log(`路由可能缺少: ${route}`, 'warning');
                    }
                }

                if (!routerContent.includes('createRouter')) {
                    throw new Error('路由配置沒有使用 createRouter');
                }
            } else {
                this.log('瀏覽器環境中跳過路由配置檢查', 'warning');
            }
        });
    }

    // 檢查本地儲存功能
    async checkLocalStorage() {
        await this.runTest('本地儲存檢查', async () => {
            if (!this.isNode) {
                // 測試 localStorage
                const testKey = 'temple-test-key';
                const testValue = 'test-value';
                
                localStorage.setItem(testKey, testValue);
                const retrieved = localStorage.getItem(testKey);
                
                if (retrieved !== testValue) {
                    throw new Error('localStorage 讀寫失敗');
                }
                
                localStorage.removeItem(testKey);
                
                // 測試 sessionStorage
                sessionStorage.setItem(testKey, testValue);
                const sessionRetrieved = sessionStorage.getItem(testKey);
                
                if (sessionRetrieved !== testValue) {
                    throw new Error('sessionStorage 讀寫失敗');
                }
                
                sessionStorage.removeItem(testKey);
            } else {
                this.log('Node.js 環境中跳過本地儲存檢查', 'warning');
            }
        });
    }

    // 檢查 CSS 和樣式
    async checkStyles() {
        await this.runTest('樣式檢查', async () => {
            if (!this.isNode) {
                // 檢查 Element Plus 樣式是否載入
                const elementPlusLoaded = document.querySelector('link[href*="element-plus"]') || 
                                        document.querySelector('style[data-vite-dev-id*="element-plus"]') ||
                                        getComputedStyle(document.body).getPropertyValue('--el-color-primary');
                
                if (!elementPlusLoaded) {
                    this.log('Element Plus 樣式可能未正確載入', 'warning');
                }

                // 檢查響應式設計
                const viewport = document.querySelector('meta[name="viewport"]');
                if (!viewport) {
                    throw new Error('缺少 viewport meta 標籤');
                }
            } else {
                this.log('Node.js 環境中跳過樣式檢查', 'warning');
            }
        });
    }

    // 檢查瀏覽器兼容性
    async checkBrowserCompatibility() {
        await this.runTest('瀏覽器兼容性檢查', async () => {
            if (!this.isNode) {
                const requiredFeatures = [
                    { name: 'ES6 Modules', check: () => 'import' in document.createElement('script') },
                    { name: 'Fetch API', check: () => typeof fetch !== 'undefined' },
                    { name: 'Promise', check: () => typeof Promise !== 'undefined' },
                    { name: 'localStorage', check: () => typeof localStorage !== 'undefined' },
                    { name: 'sessionStorage', check: () => typeof sessionStorage !== 'undefined' }
                ];

                for (const { name, check } of requiredFeatures) {
                    if (!check()) {
                        throw new Error(`瀏覽器不支援 ${name}`);
                    }
                }

                // 檢查瀏覽器版本
                const userAgent = navigator.userAgent;
                if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
                    this.log('檢測到 Internet Explorer，可能存在兼容性問題', 'warning');
                }
            } else {
                this.log('Node.js 環境中跳過瀏覽器兼容性檢查', 'warning');
            }
        });
    }

    // 執行所有檢查
    async runAllChecks() {
        this.log('開始系統檢查...', 'info');
        
        await this.checkFileStructure();
        await this.checkDependencies();
        await this.checkFirebaseConfig();
        await this.checkVueComponents();
        await this.checkPiniaStores();
        await this.checkRouterConfig();
        await this.checkLocalStorage();
        await this.checkStyles();
        await this.checkBrowserCompatibility();
        
        this.generateReport();
    }

    // 生成檢查報告
    generateReport() {
        this.log('='.repeat(50), 'info');
        this.log('系統檢查完成', 'info');
        this.log('='.repeat(50), 'info');
        this.log(`總檢查項目: ${this.results.total}`, 'info');
        this.log(`通過: ${this.results.passed}`, 'success');
        this.log(`失敗: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'info');
        
        const successRate = this.results.total > 0 ? 
            Math.round((this.results.passed / this.results.total) * 100) : 0;
        this.log(`成功率: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
        
        if (this.results.errors.length > 0) {
            this.log('\n錯誤詳情:', 'error');
            this.results.errors.forEach(({ test, error }) => {
                this.log(`- ${test}: ${error}`, 'error');
            });
        }
        
        if (successRate >= 80) {
            this.log('\n✅ 系統檢查通過，可以進行下一步！', 'success');
        } else {
            this.log('\n⚠️ 系統檢查發現問題，建議修復後再繼續', 'warning');
        }
    }
}

// 執行檢查
if (typeof window === 'undefined') {
    // Node.js 環境
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = SystemChecker;
    }

    // 直接執行檢查
    const checker = new SystemChecker();
    checker.runAllChecks().catch(console.error);
} else {
    // 瀏覽器環境
    window.SystemChecker = SystemChecker;

    // 自動執行檢查
    document.addEventListener('DOMContentLoaded', async () => {
        const checker = new SystemChecker();
        await checker.runAllChecks();
    });
}
