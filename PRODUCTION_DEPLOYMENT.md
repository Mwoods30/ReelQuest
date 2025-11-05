# Production Deployment Guide for ReelQuest

## 🚀 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Copy `.env.example` to `.env.local` 
- [ ] Fill in your Firebase configuration in `.env.local`
- [ ] Verify Firebase project is created and configured
- [ ] Test authentication flows locally

### 2. Security Review
- [ ] Firestore security rules deployed and tested
- [ ] Environment variables secured (not in source control)
- [ ] API keys restricted to specific domains
- [ ] Rate limiting configured for sensitive operations

### 3. Performance Optimization
- [ ] Build optimizations enabled
- [ ] Asset compression configured
- [ ] CDN setup for static assets
- [ ] Performance monitoring enabled

## 🔧 Deployment Commands

### Local Testing
```bash
# Start development server
npm run dev

# Test production build locally
npm run build && npm run preview

# Test with Firebase emulators
npm run firebase:emulators
```

### Firebase Deployment
```bash
# Full deployment (hosting + rules)
npm run firebase:deploy

# Deploy only hosting
npm run firebase:deploy:hosting

# Deploy only Firestore rules
npm run firebase:deploy:rules
```

### Environment-Specific Deployment
```bash
# Deploy to staging
firebase use staging
npm run firebase:deploy

# Deploy to production
firebase use production
npm run firebase:deploy
```

## 🔒 Security Configuration

### Firebase Security Rules Checklist
- [x] Users can only access their own data
- [x] Leaderboard entries are immutable after creation
- [x] Input validation for all user data
- [x] Rate limiting through Firebase security rules
- [x] Protected admin collections

### API Key Security
```bash
# Restrict API keys to specific domains
# In Firebase Console > Settings > General > Your apps
# Add your production domain to authorized domains
```

## 📊 Monitoring Setup

### Analytics Configuration
1. **Custom Events Tracked:**
   - Game starts/completions
   - Fish catches and rarities
   - Shop purchases and level progression
   - User authentication events
   - Error tracking

2. **Performance Metrics:**
   - Page load times
   - API response times
   - Game performance (FPS, render times)
   - User engagement metrics

### Error Monitoring
```javascript
// Add to your error boundaries
import { gameAnalytics } from './src/firebase/analytics.js';

// Track errors
gameAnalytics.gameError('component_error', error.message);
```

## 🌍 Production Environment Variables

### Required Environment Variables
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=reelquest-fishing.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=reelquest-fishing
VITE_FIREBASE_STORAGE_BUCKET=reelquest-fishing.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Application Configuration
VITE_APP_NAME=ReelQuest
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          # ... other env vars
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: reelquest-fishing
```

## 📈 Performance Optimization

### Build Optimization
```javascript
// vite.config.js additions
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          react: ['react', 'react-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Caching Strategy
- Static assets: 1 year cache
- HTML: No cache
- API responses: Firestore handles caching
- Images: Optimized and cached

## 🚨 Troubleshooting

### Common Deployment Issues
1. **Environment Variables Not Loading**
   - Check `.env.local` exists and has correct format
   - Verify Vite environment variable naming (VITE_ prefix)

2. **Firebase Rules Deployment Failed**
   - Check rules syntax in `firestore.rules`
   - Verify Firebase CLI is logged in

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check for TypeScript/ESLint errors

### Debug Commands
```bash
# Check Firebase project status
firebase projects:list

# Validate Firestore rules
firebase firestore:rules:validate

# Test security rules
npm run test:security
```

## 🎯 Post-Deployment Tasks

### 1. Verify Deployment
- [ ] Test user registration and login
- [ ] Verify game progress saves
- [ ] Check leaderboard updates
- [ ] Test on multiple devices

### 2. Monitor Performance
- [ ] Check Firebase Analytics dashboard
- [ ] Monitor Firestore usage and costs
- [ ] Review error logs
- [ ] Track user engagement metrics

### 3. Optimize Based on Data
- [ ] Analyze user behavior patterns
- [ ] Optimize slow-performing features
- [ ] A/B test game mechanics
- [ ] Scale based on usage patterns

---

**Your ReelQuest game is now production-ready with enterprise-grade security, monitoring, and deployment capabilities!** 🎣✨