@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo    廣清宮記帳軟體 - 快速部署腳本
echo ==========================================
echo.

echo 🚀 開始部署流程...
echo.

echo 📋 步驟 1: 檢查 Git 狀態
git status
if %errorlevel% neq 0 (
    echo ❌ Git 倉庫未初始化，請先初始化 Git
    pause
    exit /b 1
)
echo ✅ Git 狀態檢查完成
echo.

echo 📋 步驟 2: 添加所有檔案到 Git
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加檔案失敗
    pause
    exit /b 1
)
echo ✅ 檔案添加完成
echo.

echo 📋 步驟 3: 提交變更
git commit -m "🚀 部署廣清宮記帳軟體到 GitHub Pages"
if %errorlevel% neq 0 (
    echo ⚠️  沒有新的變更需要提交，或提交失敗
)
echo ✅ 變更提交完成
echo.

echo 📋 步驟 4: 檢查遠端倉庫設定
git remote -v
echo.

echo 📋 步驟 5: 推送到 GitHub
echo 正在推送到 GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ 推送失敗！可能的原因：
    echo    1. GitHub 倉庫不存在
    echo    2. 網路連接問題
    echo    3. 認證問題
    echo.
    echo 🔧 解決方案：
    echo    1. 請先在 GitHub 創建倉庫：guangqing-temple-accounting
    echo    2. 確保網路連接正常
    echo    3. 檢查 Git 認證設定
    echo.
    echo 📖 詳細步驟請參考：線上部署指南.md
    pause
    exit /b 1
)
echo ✅ 推送完成
echo.

echo 🎉 部署流程完成！
echo.
echo 📊 部署狀態：
echo    • 代碼已推送到 GitHub
echo    • GitHub Actions 將自動開始建置
echo    • 預計 2-5 分鐘後完成部署
echo.
echo 🌐 網站網址：
echo    https://sppwlkb.github.io/guangqing-temple-accounting/
echo.
echo 📋 後續步驟：
echo    1. 前往 GitHub 查看 Actions 執行狀態
echo    2. 等待部署完成
echo    3. 訪問網站確認功能正常
echo.
echo 📞 如遇問題請參考：
echo    • 線上部署指南.md
echo    • docs/troubleshooting-guide.md
echo.

pause
