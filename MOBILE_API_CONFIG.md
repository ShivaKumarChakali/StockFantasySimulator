# Mobile App API Configuration

## Problem

When running the app as a mobile APK, API calls fail because:
- Relative URLs like `/api/stocks` try to connect to `localhost` or `file://`
- Mobile apps need absolute URLs pointing to your server

## Solution

### Option 1: Configure Server URL in Capacitor (Recommended)

Edit `capacitor.config.ts`:

```typescript
server: {
  androidScheme: 'https',
  // Set your production server URL here
  url: 'https://your-production-server.com',
  cleartext: false, // Use false for HTTPS
},
```

Then rebuild:
```bash
npm run build:mobile
npm run cap:sync
```

### Option 2: Use Environment Variable

1. **Create `.env` file** (for development):
```env
VITE_API_URL=http://192.168.1.100:8081
```

2. **For production build**, set environment variable:
```bash
VITE_API_URL=https://your-production-server.com npm run build:mobile
```

3. **Or in GitHub Actions**, add to workflow:
```yaml
env:
  VITE_API_URL: https://your-production-server.com
```

### Option 3: Development with Local Server

For testing on a physical device:

1. **Find your computer's IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or
   ipconfig getifaddr en0  # macOS
   ```

2. **Update `capacitor.config.ts`:**
   ```typescript
   server: {
     url: 'http://YOUR_IP:8081',  // e.g., 'http://192.168.1.100:8081'
     cleartext: true,
   },
   ```

3. **Start your server:**
   ```bash
   npm run dev
   ```

4. **Rebuild and sync:**
   ```bash
   npm run build:mobile
   npm run cap:sync
   ```

5. **Run on device** - the app will connect to your local server

## Current Status

✅ **API utility created** (`client/src/lib/api.ts`)
- Automatically detects mobile vs browser
- Uses environment variable if set
- Falls back to relative URLs in browser

✅ **Query client updated**
- All API calls now use `apiUrl()` helper
- Works in both web and mobile

## Next Steps

### For Production Deployment:

1. **Deploy your backend server** (Railway, Render, etc.)
2. **Update `capacitor.config.ts`:**
   ```typescript
   server: {
     url: 'https://your-production-server.com',
     cleartext: false,
   },
   ```
3. **Rebuild APK:**
   ```bash
   npm run build:mobile
   npm run cap:sync
   ```

### For Development Testing:

1. **Find your local IP** (see above)
2. **Update `capacitor.config.ts`** with your IP
3. **Rebuild and test**

## Troubleshooting

### "Failed to load stocks" Error

**Cause:** App can't reach the API server

**Fix:**
1. Check `capacitor.config.ts` has correct `server.url`
2. Ensure server is running and accessible
3. Check network connectivity on device
4. Verify CORS settings on server allow your domain

### "Network request failed"

**Cause:** Server URL is incorrect or server is down

**Fix:**
1. Verify server URL in `capacitor.config.ts`
2. Test server URL in browser: `https://your-server.com/api/stocks`
3. Check server logs for errors
4. Ensure server is publicly accessible (not just localhost)

### API calls work in browser but not in app

**Cause:** Browser uses relative URLs, mobile needs absolute URLs

**Fix:**
1. Set `server.url` in `capacitor.config.ts`
2. Rebuild: `npm run build:mobile && npm run cap:sync`
3. Reinstall app on device

## Testing

### Test API Connection

Add this to your app temporarily to debug:

```typescript
import { getApiBaseUrl, apiUrl } from "@/lib/api";

console.log("API Base URL:", getApiBaseUrl());
console.log("Stocks URL:", apiUrl("/api/stocks"));
```

### Verify Server is Accessible

1. **From device browser**, visit: `https://your-server.com/api/stocks`
2. **Should return JSON** with stock data
3. **If it works in browser but not app**, check Capacitor config

## Production Checklist

- [ ] Backend server deployed and accessible
- [ ] `capacitor.config.ts` has production `server.url`
- [ ] CORS configured to allow your domain
- [ ] HTTPS enabled (use `cleartext: false`)
- [ ] Tested API connectivity from mobile device
- [ ] Rebuilt APK with correct configuration




