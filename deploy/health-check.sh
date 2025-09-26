#!/bin/sh

# 廣清宮記帳軟體 - 健康檢查腳本
# Docker 容器健康檢查

set -e

# 配置
HEALTH_URL="http://localhost:8080/health"
STATUS_URL="http://localhost:8080/status"
TIMEOUT=3
MAX_RETRIES=3

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${NC}[INFO] $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 檢查 HTTP 響應
check_http_response() {
    local url=$1
    local expected_status=${2:-200}
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        # 使用 curl 檢查 HTTP 響應
        if response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null); then
            http_code=$(echo "$response" | tail -c 4)
            body=$(echo "$response" | head -c -4)
            
            if [ "$http_code" = "$expected_status" ]; then
                log_success "HTTP 檢查通過: $url (狀態碼: $http_code)"
                return 0
            else
                log_warning "HTTP 狀態碼不正確: $http_code (預期: $expected_status)"
            fi
        else
            log_warning "HTTP 請求失敗: $url (嘗試 $((retry_count + 1))/$MAX_RETRIES)"
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            sleep 1
        fi
    done
    
    log_error "HTTP 檢查失敗: $url"
    return 1
}

# 檢查 Nginx 進程
check_nginx_process() {
    if pgrep nginx > /dev/null; then
        log_success "Nginx 進程運行正常"
        return 0
    else
        log_error "Nginx 進程未運行"
        return 1
    fi
}

# 檢查端口監聽
check_port_listening() {
    local port=${1:-8080}
    
    if netstat -ln 2>/dev/null | grep ":$port " > /dev/null; then
        log_success "端口 $port 正在監聽"
        return 0
    elif ss -ln 2>/dev/null | grep ":$port " > /dev/null; then
        log_success "端口 $port 正在監聽"
        return 0
    else
        log_error "端口 $port 未在監聽"
        return 1
    fi
}

# 檢查檔案系統
check_filesystem() {
    local html_dir="/usr/share/nginx/html"
    local index_file="$html_dir/index.html"
    
    # 檢查 HTML 目錄
    if [ ! -d "$html_dir" ]; then
        log_error "HTML 目錄不存在: $html_dir"
        return 1
    fi
    
    # 檢查 index.html
    if [ ! -f "$index_file" ]; then
        log_error "index.html 檔案不存在: $index_file"
        return 1
    fi
    
    # 檢查檔案權限
    if [ ! -r "$index_file" ]; then
        log_error "index.html 檔案無法讀取"
        return 1
    fi
    
    # 檢查檔案大小
    file_size=$(stat -c%s "$index_file" 2>/dev/null || wc -c < "$index_file")
    if [ "$file_size" -lt 100 ]; then
        log_error "index.html 檔案過小 ($file_size bytes)"
        return 1
    fi
    
    log_success "檔案系統檢查通過"
    return 0
}

# 檢查記憶體使用
check_memory_usage() {
    if [ -f "/proc/meminfo" ]; then
        mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        mem_available=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
        
        if [ "$mem_total" -gt 0 ] && [ "$mem_available" -gt 0 ]; then
            mem_usage_percent=$(( (mem_total - mem_available) * 100 / mem_total ))
            
            if [ "$mem_usage_percent" -lt 90 ]; then
                log_success "記憶體使用正常: ${mem_usage_percent}%"
                return 0
            else
                log_warning "記憶體使用過高: ${mem_usage_percent}%"
                return 1
            fi
        fi
    fi
    
    log_info "無法檢查記憶體使用情況"
    return 0
}

# 檢查磁碟空間
check_disk_space() {
    local html_dir="/usr/share/nginx/html"
    
    if df_output=$(df "$html_dir" 2>/dev/null); then
        disk_usage=$(echo "$df_output" | tail -1 | awk '{print $5}' | sed 's/%//')
        
        if [ "$disk_usage" -lt 90 ]; then
            log_success "磁碟空間充足: ${disk_usage}% 已使用"
            return 0
        else
            log_warning "磁碟空間不足: ${disk_usage}% 已使用"
            return 1
        fi
    fi
    
    log_info "無法檢查磁碟空間"
    return 0
}

# 檢查應用內容
check_application_content() {
    local index_file="/usr/share/nginx/html/index.html"
    
    if [ -f "$index_file" ]; then
        # 檢查是否包含應用標題
        if grep -q "廣清宮" "$index_file"; then
            log_success "應用內容檢查通過"
            return 0
        else
            log_warning "應用內容可能不正確"
            return 1
        fi
    fi
    
    log_error "無法檢查應用內容"
    return 1
}

# 主要健康檢查函數
main_health_check() {
    local exit_code=0
    
    log_info "開始健康檢查..."
    
    # 基本檢查
    check_nginx_process || exit_code=1
    check_port_listening 8080 || exit_code=1
    check_filesystem || exit_code=1
    
    # HTTP 檢查
    check_http_response "$HEALTH_URL" 200 || exit_code=1
    check_http_response "$STATUS_URL" 200 || exit_code=1
    
    # 系統資源檢查
    check_memory_usage || exit_code=1
    check_disk_space || exit_code=1
    
    # 應用檢查
    check_application_content || exit_code=1
    
    if [ $exit_code -eq 0 ]; then
        log_success "所有健康檢查通過"
    else
        log_error "健康檢查發現問題"
    fi
    
    return $exit_code
}

# 快速檢查 (僅基本功能)
quick_health_check() {
    log_info "執行快速健康檢查..."
    
    check_nginx_process && \
    check_port_listening 8080 && \
    check_http_response "$HEALTH_URL" 200
}

# 詳細檢查 (所有項目)
detailed_health_check() {
    log_info "執行詳細健康檢查..."
    main_health_check
}

# 根據參數選擇檢查類型
case "${1:-quick}" in
    "quick")
        quick_health_check
        ;;
    "detailed")
        detailed_health_check
        ;;
    "full")
        detailed_health_check
        ;;
    *)
        log_error "未知的檢查類型: $1"
        log_info "支援的類型: quick, detailed, full"
        exit 1
        ;;
esac

exit $?
