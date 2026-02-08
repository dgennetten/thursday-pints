# Deployment Guide for Dreamhost

## Quick Start - Initial Deployment

### Step 1: Extract Data from OneDrive

**Option A: Automatic (if OneDrive allows)**
```bash
npm run extract-data
```

**Option B: Manual (Recommended)**
1. Open your OneDrive spreadsheet in a browser
2. Go to **File → Download → Download as Excel** (or `.xlsx`)
3. Save the downloaded file as `scripts/spreadsheet.xlsx`
4. Run: `npm run extract-data`

This creates `public/data.json` with all your brewery visit data.

### Step 2: Build the Production App
```bash
npm run build
```

This creates a `dist/` folder with all static files ready for deployment.

### Step 3: Upload to Dreamhost

**Using FTP/SFTP (FileZilla, WinSCP, etc.)**
1. Connect to your Dreamhost server via FTP/SFTP
2. Navigate to your domain's public directory:
   ```
   /home/username/yourdomain.com/public_html/
   ```
3. Upload ALL contents of the `dist/` folder to `public_html/`
4. Make sure `data.json` is in the root (it should be at `public_html/data.json`)

**Using Dreamhost File Manager**
1. Log into Dreamhost panel
2. Go to **Files → WebFTP**
3. Navigate to `yourdomain.com/public_html/`
4. Upload all files from `dist/` folder
5. Ensure `data.json` is accessible at the root

### Step 4: Verify Deployment
1. Visit your domain: `https://yourdomain.com`
2. The app should load and display data from `data.json`
3. Check browser console (F12) for any errors

### Step 5: Set File Permissions (if needed)
```bash
# Via SSH or Dreamhost panel
chmod 644 public_html/data.json
chmod 755 public_html/
```

---

# Deployment Guide for Dreamhost

## Data Persistence Overview

### Current Implementation (localStorage)
- ✅ **Fast**: Data loads instantly from browser cache
- ✅ **Works offline**: Once loaded, works without internet
- ❌ **Not shared**: Each user/device has their own data
- ❌ **Not persistent**: Cleared when browser cache is cleared
- ❌ **Not synced**: Changes on one device don't appear on other devices

### Recommended Production Setup (with Backend)
- ✅ **Shared data**: All users see the same data
- ✅ **Persistent**: Data stored on server, survives browser clears
- ✅ **Auto-sync**: Can sync with OneDrive automatically
- ✅ **Reliable**: No CORS issues

## Deployment Steps

### 1. Build the React App

```bash
npm run build
```

This creates a `dist/` folder with static files.

### 2. Upload to Dreamhost

Upload the contents of `dist/` to your Dreamhost public directory:
- `/home/username/yourdomain.com/public_html/`

### 3. Set Up Backend Proxy (Optional but Recommended)

#### Option A: PHP Proxy (Easiest)

1. Upload `server/proxy.php` to your Dreamhost server:
   ```
   /home/username/yourdomain.com/public_html/api/proxy.php
   ```

2. Update the React app to use the proxy:
   - Create `.env.production` file:
     ```
     VITE_PROXY_URL=https://yourdomain.com/api/proxy.php
     ```
   - Rebuild: `npm run build`

3. Test the proxy:
   ```
   https://yourdomain.com/api/proxy.php?url=<onedrive-url>
   ```

#### Option B: Server-Side Sync (Best for Shared Data)

1. Set up a cron job to sync data periodically:
   ```bash
   # Edit crontab: crontab -e
   # Run every hour
   0 * * * * /usr/bin/php /home/username/yourdomain.com/server/sync-data.php
   ```

2. The script will:
   - Fetch Excel from OneDrive (no CORS!)
   - Parse and save to `public/data.json`
   - All users automatically get the latest data

### 4. Data Persistence Options

#### Option 1: Server-Side JSON File (Simplest)
- Upload Excel → Server parses → Saves to `public/data.json`
- All users load from same JSON file
- Update via cron job or admin upload

#### Option 2: Database (Most Flexible)
- Store visits in MySQL database
- Create API endpoints for CRUD operations
- Supports future features (user accounts, comments, etc.)

#### Option 3: Hybrid (Current + Server)
- Keep localStorage for speed
- Sync with server on load
- Server is "source of truth"

## Environment Variables

Create `.env.production` for production build:

```env
VITE_PROXY_URL=https://yourdomain.com/api/proxy.php
```

Then rebuild:
```bash
npm run build
```

## Testing After Deployment

1. **Test direct access**: Visit your domain
2. **Test upload**: Upload an Excel file
3. **Test proxy** (if configured): Check browser console for proxy requests
4. **Test persistence**: Clear browser cache, reload - data should come from server

## Troubleshooting

### CORS Errors
- ✅ Use backend proxy (Option A above)
- ✅ Use server-side sync (Option B above)

### Data Not Persisting
- Check if `public/data.json` exists and is accessible
- Verify cron job is running (check logs)
- Check file permissions on Dreamhost

### Proxy Not Working
- Verify PHP is enabled on Dreamhost
- Check file permissions (should be 644 or 755)
- Check error logs: `/home/username/logs/yourdomain.com/error.log`
