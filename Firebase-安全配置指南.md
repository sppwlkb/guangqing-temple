# 🔐 Firebase 安全配置指南

## ⚠️ 重要安全提醒

**您剛才分享的服務帳戶私鑰包含敏感資訊，請立即採取以下安全措施：**

### 🚨 立即行動項目

1. **撤銷現有私鑰**
   - 前往 [Firebase Console](https://console.firebase.google.com/)
   - 選擇專案 `temple-accounting-a5d35`
   - 前往 `專案設定` → `服務帳戶`
   - 找到並刪除洩露的私鑰

2. **生成新的服務帳戶金鑰**
   - 在同一頁面生成新的私鑰
   - 下載並安全保存新的 JSON 檔案
   - 不要在公開場所分享

## 🔧 正確的 Firebase 配置

### 客戶端配置 vs 服務端配置

#### ✅ 客戶端配置（安全可公開）
```javascript
// 這些配置可以安全地放在前端代碼中
const firebaseConfig = {
    apiKey: "AIzaSyCUaCI3_DAs7iYDAUb8ezMqZRnQJJ0511Y",
    authDomain: "temple-accounting-a5d35.firebaseapp.com",
    projectId: "temple-accounting-a5d35",
    storageBucket: "temple-accounting-a5d35.firebasestorage.app",
    messagingSenderId: "1070844356209",
    appId: "1:1070844356209:web:bcc42d152470fd9f5b1dd0",
    measurementId: "G-DD094GW46G"
};
```

#### ❌ 服務端配置（絕對保密）
```javascript
// 這些配置絕對不能放在前端代碼中
{
    "type": "service_account",
    "project_id": "temple-accounting-a5d35",
    "private_key_id": "...",
    "private_key": "-----BEGIN PRIVATE KEY-----\n...",
    "client_email": "firebase-adminsdk-...",
    // ... 其他敏感資訊
}
```

## 🛡️ 安全最佳實踐

### 1. 前端應用配置
**我們的廣清宮記帳軟體使用客戶端配置：**

```javascript
// firebase-cloud-service.js 中的安全配置
class FirebaseCloudService {
    async init() {
        // 使用客戶端配置，安全可公開
        const firebaseConfig = {
            apiKey: "AIzaSyCUaCI3_DAs7iYDAUb8ezMqZRnQJJ0511Y",
            authDomain: "temple-accounting-a5d35.firebaseapp.com",
            projectId: "temple-accounting-a5d35",
            storageBucket: "temple-accounting-a5d35.firebasestorage.app",
            messagingSenderId: "1070844356209",
            appId: "1:1070844356209:web:bcc42d152470fd9f5b1dd0",
            measurementId: "G-DD094GW46G"
        };
        
        // 初始化 Firebase
        firebase.initializeApp(firebaseConfig);
    }
}
```

### 2. Firebase 安全規則
**在 Firebase Console 中設定安全規則：**

#### Firestore 安全規則
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 只允許已認證用戶存取自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 記帳資料只允許擁有者存取
    match /records/{recordId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // 公開的類別資料允許讀取
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### Storage 安全規則
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. 環境變數管理
**對於後端服務（如果需要）：**

```bash
# .env 檔案（不要提交到 Git）
FIREBASE_PROJECT_ID=temple-accounting-a5d35
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@temple-accounting-a5d35.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

## 🔒 當前系統安全狀態

### ✅ 已實施的安全措施

1. **客戶端認證**
   - 使用 Firebase Auth 進行用戶認證
   - 支援電子郵件/密碼和匿名登入
   - 認證狀態管理和監控

2. **資料隔離**
   - 每個用戶只能存取自己的資料
   - 使用用戶 UID 作為資料隔離標識
   - 本地資料加密存儲

3. **網路安全**
   - HTTPS 強制連接
   - CSP 安全政策
   - 跨域請求保護

### 🔧 建議的額外安全措施

1. **API 金鑰限制**
   ```
   前往 Google Cloud Console
   → API 和服務 → 憑證
   → 限制 API 金鑰使用範圍
   ```

2. **域名限制**
   ```
   在 Firebase Console 中
   → 專案設定 → 一般
   → 授權網域
   → 只允許 sppwlkb.github.io
   ```

3. **使用量監控**
   ```
   設定 Firebase 使用量警報
   監控異常的 API 呼叫
   ```

## 📋 安全檢查清單

### 立即執行
- [ ] 撤銷洩露的服務帳戶私鑰
- [ ] 生成新的服務帳戶金鑰（如果需要後端服務）
- [ ] 檢查 Firebase 安全規則
- [ ] 限制 API 金鑰使用範圍

### 定期檢查
- [ ] 審查 Firebase 使用量
- [ ] 更新安全規則
- [ ] 檢查授權網域
- [ ] 監控異常登入活動

## 🛠️ 修復建議

### 1. 立即撤銷私鑰
```bash
# 如果您有 Firebase CLI
firebase projects:list
firebase use temple-accounting-a5d35
firebase functions:config:unset serviceAccount
```

### 2. 更新安全規則
```javascript
// 在 Firebase Console 中更新 Firestore 規則
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. 設定 API 限制
```
1. 前往 Google Cloud Console
2. 選擇專案 temple-accounting-a5d35
3. API 和服務 → 憑證
4. 編輯 API 金鑰
5. 設定應用程式限制：HTTP 引用者
6. 添加：https://sppwlkb.github.io/*
```

## 🎯 結論

**您的廣清宮記帳軟體目前使用的是安全的客戶端配置方式，這是正確的做法。**

### 重要提醒
1. **服務帳戶私鑰** 只用於後端服務，不應出現在前端代碼中
2. **客戶端配置** 可以安全地放在前端，Firebase 會透過安全規則保護資料
3. **立即撤銷** 剛才分享的私鑰，並生成新的（如果需要）

### 當前狀態
- ✅ 前端配置安全
- ✅ 認證系統正常
- ✅ 資料隔離完善
- ⚠️ 需要撤銷洩露的私鑰

您的系統架構是安全的，只需要處理剛才意外洩露的私鑰即可！
