import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// OneDrive sharing link
const ONEDRIVE_SHARING_LINK = 'https://1drv.ms/x/c/d16eda79b75a425c/IQBSKd91i0T5S50GEqU34yRsAahxmTOGgL1koXqWGDuy8WY';

// Convert OneDrive link to download URL
function convertOneDriveLink(shareLink) {
  const match = shareLink.match(/\/c\/([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    throw new Error('Invalid OneDrive sharing link format');
  }
  const fileId1 = match[1];
  const fileId2 = match[2];
  return `https://onedrive.live.com/download?resid=${fileId1}!${fileId2}&e=xlsx`;
}

// Parse Excel file (same logic as spreadsheetService.ts)
function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: ''
  });
  
  // Find header row
  let headerRowIndex = -1;
  const possibleHeaders = ['date', 'brewery', 'name', 'visit', 'closed', 'notes'];
  
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];
    if (Array.isArray(row)) {
      const rowText = row.map(cell => String(cell).toLowerCase()).join(' ');
      if (possibleHeaders.some(header => rowText.includes(header))) {
        headerRowIndex = i;
        break;
      }
    }
  }
  
  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }
  
  const headers = jsonData[headerRowIndex] || [];
  const visits = [];
  
  // Find column indices
  const dateColIndex = headers.findIndex((h) => 
    String(h).toLowerCase().includes('date')
  );
  const breweryColIndex = headers.findIndex((h) => 
    String(h).toLowerCase().includes('brewery') || 
    String(h).toLowerCase().includes('name')
  );
  const closedColIndex = headers.findIndex((h) => 
    String(h).toLowerCase().includes('closed') ||
    String(h).toLowerCase().includes('status')
  );
  const notesColIndex = headers.findIndex((h) => 
    String(h).toLowerCase().includes('notes') ||
    String(h).toLowerCase().includes('note')
  );
  
  if (dateColIndex === -1 || breweryColIndex === -1) {
    throw new Error('Could not find date or brewery columns in spreadsheet');
  }
  
  // Process data rows
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const dateValue = row[dateColIndex];
    const breweryValue = row[breweryColIndex];
    const closedValue = closedColIndex >= 0 ? row[closedColIndex] : null;
    const notesValue = notesColIndex >= 0 ? row[notesColIndex] : null;
    
    if (!dateValue || !breweryValue) continue;
    
    // Parse date
    let dateStr;
    if (dateValue instanceof Date) {
      dateStr = dateValue.toISOString().split('T')[0];
    } else if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      dateStr = date.toISOString().split('T')[0];
    } else {
      const date = new Date(String(dateValue));
      if (isNaN(date.getTime())) continue;
      dateStr = date.toISOString().split('T')[0];
    }
    
    const breweryName = String(breweryValue).trim();
    if (!breweryName) continue;
    
    const isClosed = closedValue ? 
      String(closedValue).toLowerCase().includes('closed') || 
      String(closedValue).toLowerCase().includes('yes') ||
      String(closedValue).toLowerCase() === 'true' : false;
    
    const notes = notesValue ? String(notesValue).trim() : null;
    
    visits.push({
      date: dateStr,
      breweryName,
      ...(isClosed && { isClosed: true }),
      ...(notes && notes.length > 0 && { notes })
    });
  }
  
  return visits;
}

// Main function
async function extractData() {
  try {
    console.log('🔄 Fetching Excel file from OneDrive...');
    
    // Try to fetch from OneDrive
    let arrayBuffer;
    try {
      const downloadUrl = convertOneDriveLink(ONEDRIVE_SHARING_LINK);
      console.log('📥 Downloading from:', downloadUrl);
      
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      arrayBuffer = await response.arrayBuffer();
    } catch (error) {
      console.error('❌ Failed to fetch from OneDrive:', error.message);
      console.log('\n💡 Alternative: Download the Excel file manually and save it as "spreadsheet.xlsx" in the scripts folder, then run this script again.');
      
      // Try local file as fallback
      const localFile = path.join(__dirname, 'spreadsheet.xlsx');
      if (fs.existsSync(localFile)) {
        console.log('📥 Found local file, using that instead...');
        const fileBuffer = fs.readFileSync(localFile);
        arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
      } else {
        process.exit(1);
      }
    }
    
    console.log('✅ File downloaded, parsing...');
    const visits = parseExcelFile(arrayBuffer);
    
    if (visits.length === 0) {
      throw new Error('No visits found in spreadsheet');
    }
    
    console.log(`✅ Parsed ${visits.length} visits`);
    
    // Write to public/data.json
    const outputPath = path.join(__dirname, '../public/data.json');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(visits, null, 2), 'utf-8');
    
    console.log(`\n✅ Success! Data extracted to: ${outputPath}`);
    console.log(`📊 Total visits: ${visits.length}`);
    
    if (visits.length > 0) {
      const dates = visits.map(v => v.date).sort();
      console.log(`📅 Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    }
    
    // Show unique breweries
    const uniqueBreweries = new Set(visits.map(v => v.breweryName));
    console.log(`🍺 Unique breweries: ${uniqueBreweries.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
extractData();
