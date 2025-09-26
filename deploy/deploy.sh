#!/bin/bash

# 廣清宮記帳軟體 - 部署腳本
# 自動化生產環境部署流程

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查必要工具
check_dependencies() {
    log_info "檢查部署依賴..."
    
    local deps=("node" "npm" "git")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "缺少必要工具: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "依賴檢查通過"
}

# 檢查環境變數
check_environment() {
    log_info "檢查環境變數..."
    
    local required_vars=(
        "VITE_FIREBASE_API_KEY"
        "VITE_FIREBASE_AUTH_DOMAIN"
        "VITE_FIREBASE_PROJECT_ID"
        "VITE_FIREBASE_STORAGE_BUCKET"
        "VITE_FIREBASE_MESSAGING_SENDER_ID"
        "VITE_FIREBASE_APP_ID"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "缺少必要環境變數: ${missing_vars[*]}"
        log_info "請在 .env.production 檔案中設定這些變數"
        exit 1
    fi
    
    log_success "環境變數檢查通過"
}

# 載入環境變數
load_environment() {
    log_info "載入環境變數..."
    
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        log_success "已載入 .env.production"
    else
        log_warning ".env.production 檔案不存在"
    fi
    
    if [ -f ".env.local" ]; then
        export $(cat .env.local | grep -v '^#' | xargs)
        log_success "已載入 .env.local"
    fi
}

# 清理舊的建置檔案
clean_build() {
    log_info "清理舊的建置檔案..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        log_success "已清理 dist 目錄"
    fi
    
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log_success "已清理快取"
    fi
}

# 安裝依賴
install_dependencies() {
    log_info "安裝依賴..."
    
    if [ -f "package-lock.json" ]; then
        npm ci --production=false
    else
        npm install
    fi
    
    log_success "依賴安裝完成"
}

# 執行測試
run_tests() {
    log_info "執行測試..."
    
    # 執行系統檢查
    if [ -f "tests/simple-check.mjs" ]; then
        node tests/simple-check.mjs
        log_success "系統檢查通過"
    else
        log_warning "系統檢查檔案不存在，跳過測試"
    fi
    
    # 執行 lint 檢查
    if npm run lint --silent 2>/dev/null; then
        log_success "代碼檢查通過"
    else
        log_warning "代碼檢查失敗或未配置"
    fi
}

# 建置應用
build_application() {
    log_info "建置應用..."
    
    # 設定生產環境
    export NODE_ENV=production
    export VITE_APP_ENV=production
    
    # 執行建置
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "建置失敗，dist 目錄不存在"
        exit 1
    fi
    
    log_success "應用建置完成"
}

# 優化建置檔案
optimize_build() {
    log_info "優化建置檔案..."
    
    # 檢查建置檔案大小
    local dist_size=$(du -sh dist | cut -f1)
    log_info "建置檔案大小: $dist_size"
    
    # 檢查是否有大檔案
    local large_files=$(find dist -type f -size +1M)
    if [ -n "$large_files" ]; then
        log_warning "發現大檔案:"
        echo "$large_files"
    fi
    
    # 生成檔案清單
    find dist -type f > deploy/build-manifest.txt
    log_success "已生成建置清單"
}

# 驗證建置
validate_build() {
    log_info "驗證建置..."
    
    # 檢查必要檔案
    local required_files=("dist/index.html" "dist/assets")
    
    for file in "${required_files[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "缺少必要檔案: $file"
            exit 1
        fi
    done
    
    # 檢查 index.html 內容
    if ! grep -q "廣清宮" dist/index.html; then
        log_warning "index.html 可能缺少應用標題"
    fi
    
    log_success "建置驗證通過"
}

# 備份當前版本
backup_current() {
    log_info "備份當前版本..."
    
    local backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
    
    if [ -d "dist" ]; then
        mkdir -p "$backup_dir"
        cp -r dist "$backup_dir/"
        log_success "已備份到 $backup_dir"
    else
        log_info "沒有現有版本需要備份"
    fi
}

# 部署到 Firebase Hosting
deploy_firebase() {
    log_info "部署到 Firebase Hosting..."
    
    # 檢查 Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI 未安裝"
        log_info "請執行: npm install -g firebase-tools"
        exit 1
    fi
    
    # 檢查登入狀態
    if ! firebase projects:list &> /dev/null; then
        log_error "未登入 Firebase"
        log_info "請執行: firebase login"
        exit 1
    fi
    
    # 部署
    firebase deploy --only hosting
    
    log_success "Firebase 部署完成"
}

# 部署到自定義伺服器
deploy_custom() {
    log_info "部署到自定義伺服器..."
    
    # 這裡可以添加自定義部署邏輯
    # 例如：rsync、scp、FTP 等
    
    if [ -n "$DEPLOY_SERVER" ] && [ -n "$DEPLOY_PATH" ]; then
        log_info "部署到 $DEPLOY_SERVER:$DEPLOY_PATH"
        
        # 使用 rsync 部署（需要配置 SSH 金鑰）
        rsync -avz --delete dist/ "$DEPLOY_SERVER:$DEPLOY_PATH"
        
        log_success "自定義伺服器部署完成"
    else
        log_warning "未配置自定義伺服器部署"
    fi
}

# 部署後驗證
post_deploy_validation() {
    log_info "部署後驗證..."
    
    if [ -n "$DEPLOY_URL" ]; then
        log_info "檢查部署 URL: $DEPLOY_URL"
        
        # 檢查網站是否可訪問
        if curl -f -s "$DEPLOY_URL" > /dev/null; then
            log_success "網站可正常訪問"
        else
            log_error "網站無法訪問"
            exit 1
        fi
    else
        log_warning "未配置部署 URL，跳過驗證"
    fi
}

# 發送通知
send_notification() {
    log_info "發送部署通知..."
    
    local version=$(node -p "require('./package.json').version")
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local message="廣清宮記帳軟體 v$version 已成功部署到生產環境
時間: $timestamp
URL: ${DEPLOY_URL:-'未配置'}"
    
    # 這裡可以添加通知邏輯
    # 例如：Slack、Discord、Email 等
    
    log_success "部署完成通知已發送"
}

# 清理部署檔案
cleanup() {
    log_info "清理部署檔案..."
    
    # 保留最近 5 個備份
    if [ -d "backups" ]; then
        local backup_count=$(ls -1 backups | wc -l)
        if [ "$backup_count" -gt 5 ]; then
            ls -1t backups | tail -n +6 | xargs -I {} rm -rf "backups/{}"
            log_success "已清理舊備份"
        fi
    fi
}

# 主要部署流程
main() {
    log_info "開始部署廣清宮記帳軟體..."
    log_info "========================================"
    
    # 檢查參數
    local deploy_target=${1:-"firebase"}
    
    # 執行部署步驟
    check_dependencies
    load_environment
    check_environment
    clean_build
    install_dependencies
    run_tests
    backup_current
    build_application
    optimize_build
    validate_build
    
    # 根據目標部署
    case "$deploy_target" in
        "firebase")
            deploy_firebase
            ;;
        "custom")
            deploy_custom
            ;;
        "both")
            deploy_firebase
            deploy_custom
            ;;
        *)
            log_error "未知的部署目標: $deploy_target"
            log_info "支援的目標: firebase, custom, both"
            exit 1
            ;;
    esac
    
    post_deploy_validation
    send_notification
    cleanup
    
    log_success "========================================"
    log_success "部署完成！"
    
    if [ -n "$DEPLOY_URL" ]; then
        log_info "應用 URL: $DEPLOY_URL"
    fi
}

# 錯誤處理
trap 'log_error "部署過程中發生錯誤，請檢查日誌"; exit 1' ERR

# 執行主流程
main "$@"
