# Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Step 1: Extract Data (2 minutes)

**Download your Excel file:**
1. Open OneDrive spreadsheet
2. File → Download → Download as Excel
3. Save as `scripts/spreadsheet.xlsx` in the `scripts/` folder

**Run extraction:**
```bash
npm run extract-data
```

✅ Creates `public/data.json` with all your data

---

### Step 2: Build App (1 minute)

```bash
npm run build
```

✅ Creates `dist/` folder ready for deployment

---

### Step 3: Deploy to Dreamhost (2 minutes)

**Upload files:**
1. Connect to Dreamhost via FTP or File Manager
2. Navigate to `yourdomain.com/public_html/`
3. Upload ALL files from `dist/` folder
4. Ensure `data.json` is in the root

**Verify:**
- Visit `https://yourdomain.com`
- Should see your brewery data!

---

## 📝 Regular Updates

When you add new brewery visits:

1. **Update OneDrive** spreadsheet
2. **Download Excel** → Save as `scripts/spreadsheet.xlsx`
3. **Extract**: `npm run extract-data`
4. **Upload** `public/data.json` to Dreamhost
5. **Done!** Website updates immediately

---

## 📚 Full Documentation

- **ADMIN_GUIDE.md** - Detailed admin update instructions
- **DEPLOYMENT.md** - Complete deployment guide
- **CORS_SOLUTIONS.md** - OneDrive access solutions

---

## ⚡ Quick Commands

```bash
# Extract data from Excel
npm run extract-data

# Build for production
npm run build

# Run development server
npm run dev
```
