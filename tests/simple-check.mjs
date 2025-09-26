/**
 * 廣清宮記帳軟體 - 簡單系統檢查
 * 使用 ES 模組檢查系統狀態
 */

import fs from 'fs';
import path from 'path';

class SimpleSystemChecker {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

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
                'firebase-config.js'
            ];

            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`缺少必要檔案: ${file}`);
                }
            }
        });
    }

    // 檢查 package.json
    async checkPackageJson() {
        await this.runTest('package.json 檢查', async () => {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            const requiredDeps = [
                'vue',
                'vue-router',
                'pinia',
                'element-plus',
                'firebase',
                'dayjs',
                'echarts'
            ];

            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            for (const dep of requiredDeps) {
                if (!allDeps[dep]) {
                    throw new Error(`缺少必要依賴: ${dep}`);
                }
            }

            this.log(`發現 ${Object.keys(allDeps).length} 個依賴`, 'info');
        });
    }

    // 檢查 Stores 目錄
    async checkStores() {
        await this.runTest('Stores 檢查', async () => {
            const storesDir = 'src/stores';
            if (!fs.existsSync(storesDir)) {
                throw new Error('stores 目錄不存在');
            }

            const storeFiles = fs.readdirSync(storesDir).filter(file => file.endsWith('.js'));
            
            const expectedStores = [
                'app.js',
                'auth.js',
                'ui.js',
                'accounting.js',
                'income.js',
                'expense.js',
                'reports.js',
                'analytics.js',
                'believers.js',
                'sync.js'
            ];

            for (const store of expectedStores) {
                if (!storeFiles.includes(store)) {
                    throw new Error(`缺少 Store: ${store}`);
                }
            }

            this.log(`發現 ${storeFiles.length} 個 Store 檔案`, 'info');
        });
    }

    // 檢查 Views 目錄
    async checkViews() {
        await this.runTest('Views 檢查', async () => {
            const viewsDir = 'src/views';
            if (!fs.existsSync(viewsDir)) {
                throw new Error('views 目錄不存在');
            }

            const getAllVueFiles = (dir) => {
                let vueFiles = [];
                const items = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        vueFiles = vueFiles.concat(getAllVueFiles(fullPath));
                    } else if (item.name.endsWith('.vue')) {
                        vueFiles.push(fullPath);
                    }
                }
                
                return vueFiles;
            };

            const vueFiles = getAllVueFiles(viewsDir);
            
            if (vueFiles.length === 0) {
                throw new Error('沒有找到 Vue 組件');
            }

            // 檢查幾個重要的組件
            const importantViews = [
                'Dashboard.vue',
                'IncomeManagement.vue',
                'ExpenseManagement.vue'
            ];

            for (const view of importantViews) {
                const found = vueFiles.some(file => file.includes(view));
                if (!found) {
                    this.log(`重要組件可能缺失: ${view}`, 'warning');
                }
            }

            this.log(`發現 ${vueFiles.length} 個 Vue 組件`, 'info');
        });
    }

    // 檢查 Firebase 配置
    async checkFirebaseConfig() {
        await this.runTest('Firebase 配置檢查', async () => {
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

            // 檢查是否有實際的配置值
            if (configContent.includes('your-') || configContent.includes('YOUR_')) {
                this.log('Firebase 配置包含佔位符，需要實際配置', 'warning');
            }
        });
    }

    // 檢查路由配置
    async checkRouter() {
        await this.runTest('路由配置檢查', async () => {
            const routerContent = fs.readFileSync('src/router/index.js', 'utf8');
            
            if (!routerContent.includes('createRouter')) {
                throw new Error('路由配置沒有使用 createRouter');
            }

            const expectedRoutes = [
                'dashboard',
                'income',
                'expense',
                'reports'
            ];

            let foundRoutes = 0;
            for (const route of expectedRoutes) {
                if (routerContent.includes(route)) {
                    foundRoutes++;
                }
            }

            this.log(`發現 ${foundRoutes}/${expectedRoutes.length} 個預期路由`, 'info');
        });
    }

    // 檢查組件目錄
    async checkComponents() {
        await this.runTest('組件檢查', async () => {
            const componentsDir = 'src/components';
            if (!fs.existsSync(componentsDir)) {
                this.log('components 目錄不存在，跳過檢查', 'warning');
                return;
            }

            const getAllFiles = (dir) => {
                let files = [];
                const items = fs.readdirSync(dir, { withFileTypes: true });
                
                for (const item of items) {
                    const fullPath = path.join(dir, item.name);
                    if (item.isDirectory()) {
                        files = files.concat(getAllFiles(fullPath));
                    } else {
                        files.push(fullPath);
                    }
                }
                
                return files;
            };

            const allFiles = getAllFiles(componentsDir);
            const vueFiles = allFiles.filter(file => file.endsWith('.vue'));
            
            this.log(`發現 ${vueFiles.length} 個組件檔案`, 'info');
        });
    }

    // 檢查測試檔案
    async checkTests() {
        await this.runTest('測試檔案檢查', async () => {
            const testsDir = 'tests';
            if (!fs.existsSync(testsDir)) {
                throw new Error('tests 目錄不存在');
            }

            const testFiles = fs.readdirSync(testsDir);
            this.log(`發現 ${testFiles.length} 個測試檔案`, 'info');
        });
    }

    // 執行所有檢查
    async runAllChecks() {
        this.log('開始系統檢查...', 'info');
        this.log('='.repeat(50), 'info');
        
        await this.checkFileStructure();
        await this.checkPackageJson();
        await this.checkStores();
        await this.checkViews();
        await this.checkFirebaseConfig();
        await this.checkRouter();
        await this.checkComponents();
        await this.checkTests();
        
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
        } else if (successRate >= 60) {
            this.log('\n⚠️ 系統檢查基本通過，但有一些問題需要注意', 'warning');
        } else {
            this.log('\n❌ 系統檢查發現嚴重問題，建議修復後再繼續', 'error');
        }

        return {
            success: successRate >= 60,
            successRate,
            results: this.results
        };
    }
}

// 執行檢查
const checker = new SimpleSystemChecker();
await checker.runAllChecks();

// 退出碼
const successRate = checker.results.total > 0 ?
    Math.round((checker.results.passed / checker.results.total) * 100) : 0;
process.exit(successRate >= 60 ? 0 : 1);
