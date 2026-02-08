# CORS Limitation & Solutions

## The Problem

OneDrive blocks direct browser access to files due to CORS (Cross-Origin Resource Sharing) policies. This is a security feature that prevents websites from making unauthorized requests to other domains.

## Current Data Storage

**Important**: The app currently uses **browser localStorage**, which means:
- ✅ Data persists in YOUR browser on YOUR device
- ❌ Data is NOT shared across devices or users
- ❌ Data is NOT persistent if you clear browser cache
- ❌ Each user sees their own uploaded data

## Solutions for CORS

### Option 1: Backend Proxy (Recommended for Production)

Create a server-side endpoint that fetches the OneDrive file. The server isn't subject to CORS restrictions.

**Implementation Options:**

#### A. Node.js/Express Proxy (for Dreamhost)
```javascript
// server/proxy.js
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/fetch-spreadsheet', async (req, res) => {
  try {
    // Convert OneDrive link and fetch
    const onedriveUrl = 'https://onedrive.live.com/download?resid=...';
    const response = await fetch(onedriveUrl);
    const buffer = await response.buffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

#### B. PHP Proxy (Dreamhost-friendly)
```php
<?php
// api/fetch-spreadsheet.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

$onedriveUrl = 'https://onedrive.live.com/download?resid=...';
$file = file_get_contents($onedriveUrl);

if ($file === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch file']);
} else {
    echo $file;
}
?>
```

### Option 2: Server-Side Data Sync

Instead of fetching on-demand, set up a cron job or scheduled task that:
1. Fetches the Excel file from OneDrive (server-side, no CORS)
2. Parses it and saves to `public/data.json`
3. Updates automatically on a schedule

**Dreamhost Cron Job Example:**
```bash
# Run every hour
0 * * * * /usr/bin/php /home/username/thursday-pints/scripts/sync-data.php
```

### Option 3: Microsoft Graph API

Use Microsoft's official API with proper authentication:
- Requires OAuth setup
- More complex but official
- Best for production apps

## Data Persistence on Dreamhost

### Current State (localStorage)
- ❌ **Not persistent** across devices/users
- ✅ Works for single-user, single-device use

### Making It Persistent

To make data truly persistent and shared:

1. **Backend API + Database**
   - Store data in a database (MySQL on Dreamhost)
   - Create API endpoints to save/load data
   - All users see the same data

2. **Server-Side File Storage**
   - Upload Excel file to server
   - Parse and save to `public/data.json`
   - Update via admin interface or cron job

3. **Hybrid Approach** (Recommended)
   - Keep localStorage for fast loading
   - Sync with server on load/upload
   - Server stores the "source of truth"

## Recommended Setup for Dreamhost

1. **Deploy the React app** (static files in `dist/`)
2. **Create a PHP proxy** for OneDrive access
3. **Set up cron job** to sync data periodically
4. **Or create upload endpoint** to store Excel files server-side

Would you like me to implement any of these solutions?
