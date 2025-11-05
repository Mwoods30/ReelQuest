# Firebase API Key Troubleshooting Guide

## 🔧 **Quick Fixes for "API Key Not Valid" Error**

### **Step 1: Verify Environment Variables**
Check that your `.env.local` file exists and has the correct values:
```bash
# Should show your environment variables
cat .env.local
```

### **Step 2: Check Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `reelquest-fishing` project
3. Go to **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Copy the current config object

### **Step 3: Update API Key Restrictions**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your Firebase API key
5. Under **Application restrictions**:
   - Select "HTTP referrers"
   - Add these domains:
     ```
     localhost:5173/*
     localhost:3000/*
     *.firebaseapp.com/*
     your-production-domain.com/*
     ```

### **Step 4: Verify Required APIs are Enabled**
In Google Cloud Console, go to **APIs & Services** > **Library** and ensure these are enabled:
- [x] Identity and Access Management (IAM) API
- [x] Cloud Resource Manager API  
- [x] Firebase Authentication API
- [x] Cloud Firestore API
- [x] Firebase Analytics API

### **Step 5: Generate New API Key (If Needed)**
1. In Firebase Console > Project Settings
2. Scroll to **Your apps**
3. Click **Add app** or regenerate existing config
4. Copy the new configuration
5. Update your `.env.local` file

### **Step 6: Clear Cache and Restart**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
rm -rf dist

# Restart development server
npm run dev
```

## 🚨 **Common Error Messages and Solutions**

### "Firebase: Error (auth/invalid-api-key)"
- **Cause**: API key is wrong, expired, or restricted
- **Solution**: Check API key in Firebase Console and update `.env.local`

### "Firebase: Error (auth/network-request-failed)"
- **Cause**: Network/firewall issues or wrong endpoints
- **Solution**: Check internet connection and Firebase endpoints

### "Firebase: Error (auth/app-not-authorized)"
- **Cause**: Domain not authorized for this API key
- **Solution**: Add your domain to API key restrictions

### "Firebase: No Firebase App '[DEFAULT]' has been created"
- **Cause**: Firebase not initialized properly
- **Solution**: Check that `initializeApp()` is called with valid config

## 🔍 **Debug Steps**

1. **Open browser console** (F12) and look for Firebase errors
2. **Check Network tab** to see if Firebase requests are failing
3. **Verify config values** are loading correctly (check console logs)
4. **Test with Firebase emulators** to isolate the issue

## 📱 **Test Configuration**
```javascript
// Add this to your component to test Firebase connection
import { auth } from './firebase/config';
console.log('Firebase Auth initialized:', !!auth);
console.log('Current user:', auth.currentUser);
```

---

**Most Common Fix**: Update the API key restrictions to include `localhost:5173` and restart your dev server!