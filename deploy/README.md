# 廣清宮記帳軟體 - 部署指南

## 📋 目錄

- [概述](#概述)
- [環境需求](#環境需求)
- [部署方式](#部署方式)
- [環境配置](#環境配置)
- [部署步驟](#部署步驟)
- [監控和維護](#監控和維護)
- [故障排除](#故障排除)

## 🎯 概述

本指南提供廣清宮記帳軟體的完整部署說明，支援多種部署方式：

- **Firebase Hosting** - 推薦的雲端部署方式
- **Docker 容器** - 適合自建伺服器
- **傳統 Web 伺服器** - Nginx/Apache 部署
- **GitHub Pages** - 開發和測試環境

## 🔧 環境需求

### 基本需求
- **Node.js**: 18.x 或更高版本
- **npm**: 8.x 或更高版本
- **Git**: 2.x 或更高版本

### 生產環境需求
- **記憶體**: 最少 512MB，建議 1GB+
- **儲存空間**: 最少 1GB，建議 5GB+
- **網路**: 穩定的網際網路連接
- **SSL 證書**: HTTPS 支援（強烈建議）

### 可選需求
- **Docker**: 20.x+ (容器部署)
- **Firebase CLI**: 最新版本 (Firebase 部署)
- **Nginx**: 1.18+ (反向代理)

## 🚀 部署方式

### 1. Firebase Hosting (推薦)

Firebase Hosting 提供全球 CDN、自動 SSL 和簡單的部署流程。

#### 優點
- ✅ 全球 CDN 加速
- ✅ 自動 SSL 證書
- ✅ 簡單的部署流程
- ✅ 版本控制和回滾
- ✅ 自定義網域支援

#### 部署步驟
```bash
# 1. 安裝 Firebase CLI
npm install -g firebase-tools

# 2. 登入 Firebase
firebase login

# 3. 初始化專案
firebase init hosting

# 4. 建置應用
npm run build

# 5. 部署
firebase deploy
```

### 2. Docker 容器部署

使用 Docker 容器提供一致的部署環境。

#### 優點
- ✅ 環境一致性
- ✅ 易於擴展
- ✅ 隔離性好
- ✅ 支援容器編排

#### 部署步驟
```bash
# 1. 建置 Docker 映像
docker build -t temple-accounting .

# 2. 運行容器
docker run -d -p 8080:8080 --name temple-app temple-accounting

# 或使用 Docker Compose
docker-compose up -d
```

### 3. 傳統 Web 伺服器

使用 Nginx 或 Apache 部署靜態檔案。

#### 部署步驟
```bash
# 1. 建置應用
npm run build

# 2. 複製檔案到 Web 伺服器
cp -r dist/* /var/www/html/

# 3. 配置 Nginx (參考 deploy/nginx.conf)
sudo systemctl reload nginx
```

## ⚙️ 環境配置

### 1. 環境變數設定

複製環境變數範本：
```bash
cp .env.production.example .env.production
```

編輯 `.env.production` 並填入實際值：

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... 其他配置
```

### 2. Firebase 專案設定

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 創建新專案或選擇現有專案
3. 啟用以下服務：
   - Authentication
   - Firestore Database
   - Storage
   - Hosting
4. 獲取專案配置並更新環境變數

### 3. 安全配置

#### CSP (內容安全政策)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;";
```

#### HTTPS 重定向
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📝 部署步驟

### 自動部署 (CI/CD)

使用 GitHub Actions 進行自動部署：

1. **設定 GitHub Secrets**：
   ```
   FIREBASE_SERVICE_ACCOUNT_PRODUCTION
   FIREBASE_SERVICE_ACCOUNT_STAGING
   SSH_PRIVATE_KEY (如果使用自定義伺服器)
   ```

2. **設定 GitHub Variables**：
   ```
   FIREBASE_PROJECT_PRODUCTION
   FIREBASE_PROJECT_STAGING
   PRODUCTION_URL
   STAGING_URL
   ```

3. **觸發部署**：
   - 推送到 `main` 分支 → 部署到 Staging
   - 創建 `v*` 標籤 → 部署到 Production

### 手動部署

使用部署腳本：

```bash
# 賦予執行權限
chmod +x deploy/deploy.sh

# 部署到 Firebase
./deploy/deploy.sh firebase

# 部署到自定義伺服器
./deploy/deploy.sh custom

# 同時部署到兩個環境
./deploy/deploy.sh both
```

## 📊 監控和維護

### 1. 健康檢查

系統提供多個健康檢查端點：

- `/health` - 基本健康狀態
- `/status` - 詳細系統狀態

使用健康檢查腳本：
```bash
# 快速檢查
./deploy/health-check.sh quick

# 詳細檢查
./deploy/health-check.sh detailed
```

### 2. 日誌監控

#### Nginx 日誌
```bash
# 查看訪問日誌
tail -f /var/log/nginx/access.log

# 查看錯誤日誌
tail -f /var/log/nginx/error.log
```

#### 應用日誌
```bash
# Docker 容器日誌
docker logs temple-app

# 系統日誌
journalctl -u nginx -f
```

### 3. 效能監控

#### 關鍵指標
- **回應時間**: < 2 秒
- **可用性**: > 99.9%
- **錯誤率**: < 0.1%
- **記憶體使用**: < 80%
- **磁碟使用**: < 90%

#### 監控工具
- Google Analytics (使用者行為)
- Firebase Performance (應用效能)
- Nginx 狀態模組 (伺服器效能)

### 4. 備份策略

#### 自動備份
```bash
# 使用 Docker Compose 備份服務
docker-compose --profile backup run backup

# 手動備份
tar -czf backup-$(date +%Y%m%d).tar.gz dist/ logs/ letsencrypt/
```

#### 備份內容
- 應用檔案 (`dist/`)
- 配置檔案 (`nginx.conf`, `.env`)
- SSL 證書 (`letsencrypt/`)
- 日誌檔案 (`logs/`)

## 🔧 故障排除

### 常見問題

#### 1. 建置失敗
```bash
# 清理快取
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 檢查 Node.js 版本
node --version  # 應該是 18.x+
```

#### 2. Firebase 部署失敗
```bash
# 重新登入
firebase logout
firebase login

# 檢查專案配置
firebase projects:list
firebase use your-project-id
```

#### 3. Docker 容器無法啟動
```bash
# 檢查容器日誌
docker logs temple-app

# 檢查端口佔用
netstat -tulpn | grep :8080

# 重建映像
docker build --no-cache -t temple-accounting .
```

#### 4. Nginx 配置錯誤
```bash
# 測試配置
nginx -t

# 重新載入配置
nginx -s reload

# 檢查錯誤日誌
tail -f /var/log/nginx/error.log
```

### 緊急回滾

#### Firebase Hosting
```bash
# 查看部署歷史
firebase hosting:releases

# 回滾到上一版本
firebase hosting:rollback
```

#### Docker 部署
```bash
# 停止當前容器
docker stop temple-app

# 啟動上一版本
docker run -d -p 8080:8080 --name temple-app temple-accounting:previous
```

### 聯絡支援

如果遇到無法解決的問題：

1. 檢查 [GitHub Issues](https://github.com/your-repo/issues)
2. 查看部署日誌和錯誤訊息
3. 提供詳細的錯誤資訊和環境配置
4. 聯絡技術支援團隊

## 📚 相關文檔

- [Firebase Hosting 文檔](https://firebase.google.com/docs/hosting)
- [Docker 官方文檔](https://docs.docker.com/)
- [Nginx 配置指南](https://nginx.org/en/docs/)
- [Vue.js 部署指南](https://vitejs.dev/guide/static-deploy.html)

---

**最後更新**: 2024-09-26  
**版本**: 1.0.0
