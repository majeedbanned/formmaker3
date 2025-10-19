# Applying CORS to Mobile App API Routes

## What Was Done

✅ **Login route updated** with CORS headers in all responses
✅ **CORS utility created** at `src/app/api/mobileapp/cors.ts`

## How to Apply CORS to Other Routes

You can apply CORS to other mobile app API routes in two ways:

### Method 1: Add Headers Directly (Simple)

Add this at the top of your route file:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  // ... your code
  return NextResponse.json(data, { headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
```

### Method 2: Use CORS Utility (Recommended)

Import the utility:

```typescript
import { corsHeaders, handleCORSPreflight } from '../cors';

export async function POST(request: NextRequest) {
  // ... your code
  return NextResponse.json(data, { headers: corsHeaders });
}

export async function OPTIONS(request: NextRequest) {
  return handleCORSPreflight();
}
```

## Routes That Need CORS

All routes in `/api/mobileapp/` should have CORS for web support:

- [x] `/api/mobileapp/login/route.ts` ✅ Done
- [ ] `/api/mobileapp/checkversion/route.ts`
- [ ] `/api/mobileapp/verify/route.ts`
- [ ] `/api/mobileapp/students/route.ts`
- [ ] `/api/mobileapp/attendance/today/route.ts`
- [ ] `/api/mobileapp/grades/student/route.ts`
- [ ] `/api/mobileapp/messages/inbox/route.ts`
- [ ] `/api/mobileapp/schedule/route.ts`
- [ ] `/api/mobileapp/agenda/route.ts`
- [ ] `/api/mobileapp/forms/route.ts`
- [ ] `/api/mobileapp/feedback/route.ts`
- [ ] All other mobile app routes...

## Quick Fix Script

Run this to update all routes at once:

```bash
cd /Users/majid/project/parsamooz/formmaker3

# Find all mobileapp route files
find src/app/api/mobileapp -name "route.ts" -type f
```

Then manually update each file with CORS headers, or continue using the login route as reference.

## Testing

After updating routes, test with:

```bash
# From web app at http://localhost:8081
curl -X OPTIONS http://localhost:3000/api/mobileapp/login -v
```

Should return headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Alternative: Next.js Middleware

For a global solution, you can add CORS middleware to `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply CORS to mobile app API routes
  if (request.nextUrl.pathname.startsWith('/api/mobileapp')) {
    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Add CORS headers to response
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/mobileapp/:path*',
};
```

This applies CORS to all mobile app routes automatically! ⚡

