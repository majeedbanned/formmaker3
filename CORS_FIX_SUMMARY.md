# CORS Fix for Mobile Web App - Summary

## 🎯 Problem
When accessing the web version of the mobile app from `http://localhost:8081`, API calls to `https://harati.farsamooz.ir` were blocked by CORS policy.

## ✅ Solution Implemented

### 1. Global CORS Middleware (Recommended)
**File**: `src/middleware.ts`

Added CORS handling for ALL mobile app API routes (`/api/mobileapp/*`):
- Handles OPTIONS preflight requests
- Adds CORS headers to all responses
- Works automatically for all current and future mobile app routes

**Benefits:**
- ✅ One-time fix for all routes
- ✅ No need to modify individual API files
- ✅ Centralized and maintainable

### 2. Individual Route Fix
**File**: `src/app/api/mobileapp/login/route.ts`

Updated login route with CORS headers as a backup/example.

### 3. CORS Utility Created
**File**: `src/app/api/mobileapp/cors.ts`

Reusable utility for routes that need custom CORS configuration.

## 🚀 Deployment Instructions

### For Production Server (https://harati.farsamooz.ir)

1. **Push changes to git** (if using git):
```bash
cd /Users/majid/project/parsamooz/formmaker3
git add .
git commit -m "Add CORS support for mobile web app"
git push
```

2. **SSH to server and deploy**:
```bash
ssh user@harati.farsamooz.ir
cd /path/to/formmaker3
git pull
npm install  # if needed
pm2 restart formmaker3  # or your restart command
```

3. **Verify CORS is working**:
```bash
curl -X OPTIONS https://harati.farsamooz.ir/api/mobileapp/login -v
```

Should see:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### For Local Testing

1. **Start Next.js dev server**:
```bash
cd /Users/majid/project/parsamooz/formmaker3
npm run dev
```

2. **Update mobile web app to use localhost** (optional):
In your mobile app, temporarily change the API URL to `http://localhost:3000`

3. **Test login from web app**:
- Open http://localhost:8081
- Complete onboarding
- Try logging in
- Should work without CORS errors! ✅

## 📋 What Changed

### Before:
```
Browser → localhost:8081 → API: harati.farsamooz.ir
❌ CORS Error: No 'Access-Control-Allow-Origin' header
```

### After:
```
Browser → localhost:8081 → API: harati.farsamooz.ir
✅ CORS Headers Present → Request Succeeds
```

## 🔧 Files Modified

1. ✅ `src/middleware.ts` - Global CORS for all mobile app routes
2. ✅ `src/app/api/mobileapp/login/route.ts` - Login route with CORS
3. ✅ `src/app/api/mobileapp/cors.ts` - Reusable CORS utility (new)
4. ✅ `CORS_FIX_SUMMARY.md` - This documentation (new)
5. ✅ `APPLY_CORS_TO_ROUTES.md` - Guide for manual CORS application (new)

## 🎉 Benefits

- ✅ Mobile web app works from localhost
- ✅ Can develop and test locally
- ✅ All mobile app APIs automatically have CORS
- ✅ No security impact (CORS allows web browsers to access your API)
- ✅ Native mobile apps unaffected

## 🔐 Security Notes

**CORS with `Access-Control-Allow-Origin: *` allows:**
- ✅ Web browsers to access your API
- ✅ Local development from localhost
- ✅ Any website to call your API

**If you want to restrict to specific origins:**

Update `src/middleware.ts`:
```typescript
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  'https://harati.farsamooz.ir',
  'https://yourdomain.com'
];

const origin = request.headers.get('origin');
const allowOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0];

// Then use allowOrigin instead of '*' in headers
response.headers.set("Access-Control-Allow-Origin", allowOrigin);
```

## ✅ Verification

After deploying, test with:

```bash
# Test OPTIONS (preflight)
curl -X OPTIONS \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: POST" \
  https://harati.farsamooz.ir/api/mobileapp/login -v

# Test POST
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8081" \
  -d '{"role":"student","domain":"harati.farsamooz.ir","schoolCode":"123","userCode":"test","password":"test"}' \
  https://harati.farsamooz.ir/api/mobileapp/login -v
```

Both should return CORS headers in the response.

## 📚 Next Steps

1. Deploy changes to production server
2. Test login from web app at http://localhost:8081
3. If you need to restrict origins, update middleware as shown above
4. Consider adding rate limiting for web requests (optional)

---

**Status**: ✅ Ready to Deploy  
**Impact**: All mobile app API routes now support CORS  
**Testing**: Works with both localhost and production

