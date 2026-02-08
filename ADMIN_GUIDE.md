# Admin Guide - Updating Thursday Pints Data

## Quick Update Process

### Step 1: Update Your OneDrive Spreadsheet
1. Open your OneDrive Excel file
2. Add new brewery visits, update brewery status (closed/open), etc.
3. Save the file (OneDrive auto-saves)

### Step 2: Extract Data Locally
On your local machine, run:
```bash
npm run extract-data
```

This script will:
- ✅ Try to automatically download from OneDrive
- ✅ If that fails, you can download the Excel file manually and save it as `scripts/spreadsheet.xlsx`, then run the command again
- ✅ Parse the Excel file and extract all visits
- ✅ Generate/update `public/data.json`

### Step 3: Upload to Dreamhost

**Option A: Using FTP/SFTP (FileZilla, WinSCP, etc.)**
1. Connect to your Dreamhost server
2. Navigate to: `/home/username/yourdomain.com/public_html/`
3. Upload the `public/data.json` file (overwrite the existing one)

**Option B: Using Dreamhost File Manager**
1. Log into Dreamhost panel
2. Go to **Files → WebFTP**
3. Navigate to `yourdomain.com/public_html/`
4. Click **Upload** and select your `public/data.json` file
5. Confirm overwrite if prompted

### Step 4: Verify Update
1. Visit your website: `https://yourdomain.com`
2. Hard refresh the page: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
3. Check that new data appears

---

## Detailed Instructions

### Initial Setup (One-Time)

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Test the Extraction Script**:
   ```bash
   npm run extract-data
   ```

   If it fails to fetch from OneDrive:
   - Manually download the Excel file from OneDrive
   - Save it as `scripts/spreadsheet.xlsx`
   - Run `npm run extract-data` again

### Regular Updates

Every time you want to update the website with new brewery visits:

1. **Update OneDrive** → Add new visits to your spreadsheet
2. **Extract Data** → Run `npm run extract-data`
3. **Upload JSON** → Upload `public/data.json` to Dreamhost
4. **Verify** → Check the website

---

## Troubleshooting

### Extraction Script Fails

**Error: "Failed to fetch from OneDrive"**
- Solution: Download the Excel file manually from OneDrive
- Save it as `scripts/spreadsheet.xlsx`
- Run `npm run extract-data` again

**Error: "Could not find date or brewery columns"**
- Check your Excel file has a header row
- Ensure columns are named with "date" and "brewery" or "name" in them
- Example headers: "Date", "Brewery Name", "Visit Date", etc.

**Error: "No visits found in spreadsheet"**
- Check that your data rows have both date and brewery name filled in
- Ensure the first sheet (tab) contains your data
- Verify there are no empty rows between header and data

### Upload Issues

**File won't upload to Dreamhost**
- Check file permissions (should be readable: 644)
- Verify you're uploading to the correct directory: `public_html/`
- Ensure the file is named exactly `data.json` (lowercase)

**Website shows old data after upload**
- Hard refresh: `Ctrl+F5` or `Cmd+Shift+R`
- Clear browser cache
- Check browser console (F12) for errors
- Verify the JSON file is valid at: `https://yourdomain.com/data.json`

### Data Not Appearing

**Check the JSON file directly:**
- Visit: `https://yourdomain.com/data.json`
- Should see JSON array of visits
- If you see 404, the file isn't in the right location

**Check browser console:**
- Press F12 → Console tab
- Look for errors loading data
- Check Network tab to see if `data.json` is loading

---

## File Locations Reference

### Local Development
- **Extraction Script**: `scripts/extract-data.js`
- **Output File**: `public/data.json`
- **Excel File** (if manual): `scripts/spreadsheet.xlsx`

### Dreamhost Server
- **Website Root**: `/home/username/yourdomain.com/public_html/`
- **Data File**: `/home/username/yourdomain.com/public_html/data.json`
- **Built App**: All files from `dist/` folder go in `public_html/`

---

## Automation (Future)

For automatic updates without manual steps, you can set up:

1. **Cron Job** on Dreamhost to fetch from OneDrive periodically
2. **GitHub Actions** to auto-deploy when you push updates
3. **Webhook** to trigger updates when OneDrive changes

See `DEPLOYMENT.md` for more advanced setup options.

---

## Quick Command Reference

```bash
# Extract data from OneDrive
npm run extract-data

# Build the app for production
npm run build

# Run development server (for testing)
npm run dev
```

---

## Need Help?

- Check `DEPLOYMENT.md` for deployment details
- Check `CORS_SOLUTIONS.md` for OneDrive access solutions
- Check browser console (F12) for error messages
