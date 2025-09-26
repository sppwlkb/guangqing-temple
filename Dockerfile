# 廣清宮記帳軟體 - Docker 配置
# 多階段建置，優化映像大小

# ================================
# 建置階段
# ================================
FROM node:18-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 安裝建置依賴
RUN apk add --no-cache git

# 複製 package 檔案
COPY package*.json ./

# 安裝依賴
RUN npm ci --only=production=false

# 複製原始碼
COPY . .

# 建置應用
RUN npm run build

# ================================
# 生產階段
# ================================
FROM nginx:alpine AS production

# 安裝必要工具
RUN apk add --no-cache curl

# 複製自定義 nginx 配置
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/default.conf /etc/nginx/conf.d/default.conf

# 複製建置檔案
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製健康檢查腳本
COPY deploy/health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

# 創建非 root 用戶
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# 設定權限
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d

# 創建 PID 目錄
RUN mkdir -p /var/run/nginx && \
    chown -R nginx-user:nginx-user /var/run/nginx

# 切換到非 root 用戶
USER nginx-user

# 暴露端口
EXPOSE 8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# 啟動 nginx
CMD ["nginx", "-g", "daemon off;"]

# ================================
# 開發階段 (可選)
# ================================
FROM node:18-alpine AS development

WORKDIR /app

# 安裝開發依賴
RUN apk add --no-cache git

# 複製 package 檔案
COPY package*.json ./

# 安裝所有依賴
RUN npm ci

# 複製原始碼
COPY . .

# 暴露開發端口
EXPOSE 5173

# 啟動開發伺服器
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ================================
# 標籤和元數據
# ================================
LABEL maintainer="廣清宮 <temple@example.com>"
LABEL version="1.0.0"
LABEL description="廣清宮快速記帳軟體"
LABEL org.opencontainers.image.title="Temple Accounting Software"
LABEL org.opencontainers.image.description="Modern accounting system for temples"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="廣清宮"
LABEL org.opencontainers.image.licenses="MIT"
