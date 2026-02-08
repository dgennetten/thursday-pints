# Thursday Pints - Brewery Visit Tracker

A read-only dashboard for tracking brewery visits by the Thursday Pints social club.

## Features

- **Total Breweries**: Displays the total number of unique breweries visited
- **Total Visits**: Shows the total number of visits across all breweries
- **Top 10 / Bottom 10 Toggle**: Switch between most visited and least visited breweries
- **Brewery Details**: Each entry shows:
  - Number of visits
  - Brewery name
  - Date of last visit
- **Mobile-First Design**: Responsive layout optimized for mobile devices

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- xlsx (Excel file parsing)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Data Loading

The app automatically loads data from your OneDrive Excel spreadsheet. Here's how it works:

### Automatic Data Sync

1. **On Launch**: The app loads data in this order:
   - First from browser localStorage (cached data)
   - Then from `public/data.json` (if localStorage is empty)
   - Finally, it syncs with the OneDrive spreadsheet

2. **Spreadsheet Format**: The app expects the first tab of your Excel file to have:
   - A header row with columns for Date and Brewery Name
   - Optional: A "Closed" or "Status" column to mark closed breweries
   - Data rows with visit dates and brewery names

3. **Data Caching**: 
   - Data is cached in browser localStorage for fast loading
   - The cache is automatically updated when the spreadsheet is synced
   - You can manually refresh using the "Refresh" button in the header

### Spreadsheet Location

The app is configured to fetch from:
```
https://1drv.ms/x/c/d16eda79b75a425c/IQBSKd91i0T5S50GEqU34yRsAahxmTOGgL1koXqWGDuy8WY
```

To change the spreadsheet URL, update `ONEDRIVE_SHARING_LINK` in `src/services/spreadsheetService.ts`.

### Troubleshooting

If the app cannot fetch from OneDrive (due to CORS restrictions), it will:
- Use cached data from localStorage
- Show a warning message
- Allow manual refresh via the Refresh button

**Note**: OneDrive sharing links may require authentication or a CORS proxy. If you encounter issues:
1. Ensure the OneDrive file is set to "Anyone with the link can view"
2. The app will attempt to use a CORS proxy as a fallback
3. You can manually update `public/data.json` as an alternative data source

## Project Structure

```
src/
  ├── components/              # React components
  │   ├── StatsCard.tsx
  │   ├── BreweryList.tsx
  │   └── ToggleButton.tsx
  ├── services/                 # Data services
  │   └── spreadsheetService.ts # OneDrive spreadsheet fetching and parsing
  ├── types.ts                  # TypeScript type definitions
  ├── data.ts                   # Sample data (fallback)
  ├── utils.ts                  # Utility functions for data processing
  ├── App.tsx                   # Main application component
  ├── main.tsx                  # Application entry point
  └── index.css                 # Global styles with Tailwind
public/
  └── data.json                 # Fallback data file (optional)
```

## Data Persistence

### Current Implementation (Development)
- Data is stored in **browser localStorage**
- ✅ Fast loading, works offline
- ❌ **Not shared** across devices or users
- ❌ **Not persistent** if browser cache is cleared
- Each user/device has their own separate data

### Production Deployment (Dreamhost)
For shared, persistent data across all users:

1. **Option 1: Backend Proxy** (See `CORS_SOLUTIONS.md`)
   - Upload `server/proxy.php` to your server
   - Set `VITE_PROXY_URL` environment variable
   - Bypasses CORS restrictions

2. **Option 2: Server-Side Sync** (Recommended)
   - Set up cron job to sync OneDrive → `public/data.json`
   - All users load from the same JSON file
   - Automatic updates on schedule

3. **Option 3: Database Backend**
   - Store data in MySQL database
   - Create API endpoints
   - Most flexible for future features

See `DEPLOYMENT.md` for detailed deployment instructions.

## CORS Limitations

OneDrive blocks direct browser access due to CORS. Solutions:
- ✅ Use backend proxy (PHP script provided)
- ✅ Server-side sync via cron job
- ✅ Manual upload (works immediately, no CORS)

See `CORS_SOLUTIONS.md` for detailed solutions.

## Notes

- The "Bottom 10 Visited" list automatically excludes closed breweries
- Dates are formatted as "Month Day, Year" (e.g., "Jan 4, 2024")
- The app is read-only and designed for viewing visit history
