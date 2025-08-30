# Firebase 雲端服務設置指南

## 🚀 步驟 1：創建 Firebase 專案

1. **前往 Firebase 控制台**
   - 訪問：https://console.firebase.google.com/
   - 使用 Google 帳號登入

2. **創建新專案**
   - 點擊「新增專案」
   - 專案名稱：`guangqing-temple-accounting`
   - 選擇地區：`asia-east1` (台灣)
   - 啟用 Google Analytics（可選）

## 🔧 步驟 2：設置 Firebase 服務

### 2.1 啟用 Authentication
1. 在左側選單點擊「Authentication」
2. 點擊「開始使用」
3. 在「Sign-in method」標籤中啟用：
   - ✅ **電子郵件/密碼**
   - ✅ **匿名**

### 2.2 設置 Firestore Database
1. 在左側選單點擊「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式開始」
4. 選擇地區：`asia-east1` (台灣)

### 2.3 設置 Storage
1. 在左側選單點擊「Storage」
2. 點擊「開始使用」
3. 選擇「以測試模式開始」
4. 選擇地區：`asia-east1` (台灣)

## ⚙️ 步驟 3：獲取配置資訊

1. **前往專案設定**
   - 點擊左上角齒輪圖標 → 「專案設定」

2. **新增 Web 應用程式**
   - 滑到「您的應用程式」區域
   - 點擊「Web」圖標 `</>`
   - 應用程式暱稱：`廣清宮記帳軟體`
   - ✅ 勾選「同時為這個應用程式設定 Firebase Hosting」
   - 點擊「註冊應用程式」

3. **複製配置資訊**
   - 複製 `firebaseConfig` 物件
   - 看起來像這樣：
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "guangqing-temple-accounting.firebaseapp.com",
     projectId: "guangqing-temple-accounting",
     storageBucket: "guangqing-temple-accounting.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef..."
   };
   ```

## 🔑 步驟 4：更新專案配置

將複製的配置資訊替換到 `firebase-config.js` 文件中：

```javascript
// 替換這個配置物件
const firebaseConfig = {
    // 貼上您從 Firebase 控制台複製的配置
    apiKey: "您的API金鑰",
    authDomain: "您的專案.firebaseapp.com",
    projectId: "您的專案ID",
    storageBucket: "您的專案.appspot.com",
    messagingSenderId: "您的發送者ID",
    appId: "您的應用程式ID"
};
```

## 🛡️ 步驟 5：設置安全規則

### 5.1 Firestore 安全規則
在 Firestore Database → 規則，設置以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶只能訪問自己的資料
    match /temples/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // 子集合規則
      match /{collection}/{document} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // 用戶資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5.2 Storage 安全規則
在 Storage → 規則，設置以下規則：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /temples/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌐 步驟 6：設置 Hosting（可選）

如果要使用 Firebase Hosting：

1. **安裝 Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **登入 Firebase**
   ```bash
   firebase login
   ```

3. **初始化專案**
   ```bash
   firebase init hosting
   ```

4. **部署**
   ```bash
   firebase deploy
   ```

## ✅ 步驟 7：測試配置

1. **重新載入網頁**
2. **檢查瀏覽器控制台**
   - 應該看到「Firebase 初始化成功」
3. **測試登入功能**
   - 點擊右上角用戶圖標
   - 嘗試註冊新帳號
4. **測試同步功能**
   - 新增一筆記錄
   - 檢查是否顯示同步狀態

## 🔍 故障排除

### 常見問題：

1. **「Firebase 初始化失敗」**
   - 檢查配置資訊是否正確
   - 確認網路連線正常

2. **「用戶未登入」**
   - 檢查 Authentication 是否已啟用
   - 確認安全規則設置正確

3. **「權限被拒絕」**
   - 檢查 Firestore 安全規則
   - 確認用戶已正確登入

4. **「離線持久化失敗」**
   - 多個標籤頁衝突，關閉其他標籤頁
   - 清除瀏覽器快取重試

## 📱 手機端測試

1. **在手機瀏覽器開啟網站**
2. **測試離線功能**
   - 關閉網路連線
   - 新增記錄（應該正常運作）
   - 開啟網路連線（應該自動同步）

3. **測試跨設備同步**
   - 在電腦上登入並新增記錄
   - 在手機上登入同一帳號
   - 檢查資料是否同步

## 🎯 完成後的功能

- ✅ **真正的雲端存儲**：資料永久保存在 Firebase
- ✅ **多設備同步**：手機、電腦資料即時同步
- ✅ **離線操作**：無網路時正常使用，恢復網路自動同步
- ✅ **用戶認證**：安全的帳號系統
- ✅ **實時更新**：多設備間即時資料同步
- ✅ **自動備份**：資料自動備份，永不遺失

設置完成後，您的廣清宮記帳軟體將具備企業級的雲端功能！ 