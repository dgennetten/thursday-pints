import * as XLSX from 'xlsx';
import { Visit } from '../types';

// OneDrive sharing link - convert to direct download link
// Pattern: https://1drv.ms/x/c/... -> https://onedrive.live.com/download?resid=...&authkey=...
const ONEDRIVE_SHARING_LINK = 'https://1drv.ms/x/c/d16eda79b75a425c/IQBSKd91i0T5S50GEqU34yRsAahxmTOGgL1koXqWGDuy8WY';

// Backend proxy endpoint (if hosted on Dreamhost with proxy.php)
// Set this to your proxy URL, e.g., 'https://yourdomain.com/proxy.php'
// Leave empty to try direct access (will likely fail due to CORS)
const BACKEND_PROXY_URL = import.meta.env.VITE_PROXY_URL || '';

// Convert OneDrive sharing link to direct download link
// OneDrive sharing links can be converted to direct download links
function convertOneDriveLink(shareLink: string): string {
  // Extract the ID from the sharing link
  // Pattern: https://1drv.ms/x/c/{id1}/{id2}
  const match = shareLink.match(/\/c\/([^\/]+)\/([^\/\?]+)/);
  if (!match) {
    throw new Error('Invalid OneDrive sharing link format');
  }
  
  const fileId1 = match[1];
  const fileId2 = match[2];
  
  // Try different OneDrive URL formats
  // Format 1: Using both IDs with proper encoding
  // The sharing link format suggests we need both parts
  return `https://onedrive.live.com/download?resid=${fileId1}!${fileId2}&e=xlsx`;
}

// Note: CORS proxy functions are now integrated into fetchSpreadsheetData methods

// Parse Excel file and extract visits from first sheet
function parseExcelFile(buffer: ArrayBuffer): Visit[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  
  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1, // Use array of arrays format
    defval: '' // Default value for empty cells
  }) as any[][];
  
  // Find header row (look for common column names)
  let headerRowIndex = -1;
  const possibleHeaders = ['date', 'brewery', 'name', 'visit', 'closed'];
  
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
    // If no header found, assume first row is header
    headerRowIndex = 0;
  }
  
  const headers = jsonData[headerRowIndex] || [];
  const visits: Visit[] = [];
  
  // Find column indices
  const dateColIndex = headers.findIndex((h: any) => 
    String(h).toLowerCase().includes('date')
  );
  const breweryColIndex = headers.findIndex((h: any) => 
    String(h).toLowerCase().includes('brewery') || 
    String(h).toLowerCase().includes('name')
  );
  const closedColIndex = headers.findIndex((h: any) => 
    String(h).toLowerCase().includes('closed') ||
    String(h).toLowerCase().includes('status')
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
    
    if (!dateValue || !breweryValue) continue;
    
    // Parse date - handle various formats
    let dateStr: string;
    if (dateValue instanceof Date) {
      dateStr = dateValue.toISOString().split('T')[0];
    } else if (typeof dateValue === 'number') {
      // Excel serial date number
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
      dateStr = date.toISOString().split('T')[0];
    } else {
      // Try to parse as date string
      const date = new Date(String(dateValue));
      if (isNaN(date.getTime())) continue;
      dateStr = date.toISOString().split('T')[0];
    }
    
    const breweryName = String(breweryValue).trim();
    if (!breweryName) continue;
    
    // Check if closed
    const isClosed = closedValue ? 
      String(closedValue).toLowerCase().includes('closed') || 
      String(closedValue).toLowerCase().includes('yes') ||
      String(closedValue).toLowerCase() === 'true' : false;
    
    visits.push({
      date: dateStr,
      breweryName,
      isClosed: isClosed || undefined
    });
  }
  
  return visits;
}

// Fetch spreadsheet from OneDrive
export async function fetchSpreadsheetData(): Promise<Visit[]> {
  const errors: string[] = [];
  
  // Try multiple methods to access the OneDrive file
  const methods = [
    // Method 0: Backend proxy (if configured) - most reliable
    ...(BACKEND_PROXY_URL ? [() => {
      const downloadUrl = convertOneDriveLink(ONEDRIVE_SHARING_LINK);
      const proxyUrl = `${BACKEND_PROXY_URL}?url=${encodeURIComponent(downloadUrl)}`;
      return fetch(proxyUrl);
    }] : []),
    // Method 1: Direct download URL
    () => {
      const downloadUrl = convertOneDriveLink(ONEDRIVE_SHARING_LINK);
      return fetch(downloadUrl);
    },
    // Method 2: CORS proxy with direct URL
    () => {
      const downloadUrl = convertOneDriveLink(ONEDRIVE_SHARING_LINK);
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(downloadUrl)}`;
      return fetch(proxyUrl);
    },
    // Method 3: CORS proxy with sharing link (might redirect)
    () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(ONEDRIVE_SHARING_LINK)}`;
      return fetch(proxyUrl);
    },
    // Method 4: Alternative proxy service
    () => {
      const downloadUrl = convertOneDriveLink(ONEDRIVE_SHARING_LINK);
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(downloadUrl)}`;
      return fetch(proxyUrl);
    }
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      console.log(`Trying method ${i + 1} to fetch spreadsheet...`);
      const response = await methods[i]();
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        errors.push(`Method ${i + 1}: ${response.status} ${errorText}`);
        continue;
      }
      
      // Check if we got HTML (likely an error page) instead of Excel
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        if (text.includes('error') || text.includes('Error') || text.includes('sign in')) {
          errors.push(`Method ${i + 1}: Received HTML error page`);
          continue;
        }
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Check if we got a valid Excel file (starts with PK for ZIP-based formats)
      if (arrayBuffer.byteLength === 0) {
        errors.push(`Method ${i + 1}: Empty response`);
        continue;
      }
      
      // Try to parse the Excel file
      try {
        const visits = parseExcelFile(arrayBuffer);
        if (visits.length > 0) {
          console.log(`Successfully fetched ${visits.length} visits using method ${i + 1}`);
          return visits;
        } else {
          errors.push(`Method ${i + 1}: Parsed but no visits found`);
        }
      } catch (parseError) {
        errors.push(`Method ${i + 1}: Parse error - ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        continue;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Method ${i + 1}: ${errorMsg}`);
      console.warn(`Method ${i + 1} failed:`, error);
      continue;
    }
  }
  
  // All methods failed
  const errorMessage = `All methods failed to fetch spreadsheet:\n${errors.join('\n')}`;
  console.error(errorMessage);
  throw new Error(`Unable to access OneDrive file. This may be due to CORS restrictions or authentication requirements. Please check the browser console for details.`);
}

// Save visits to JSON file (for caching)
export function saveVisitsToJSON(visits: Visit[]): void {
  try {
    const json = JSON.stringify(visits, null, 2);
    localStorage.setItem('thursday-pints-visits', json);
    localStorage.setItem('thursday-pints-visits-timestamp', new Date().toISOString());
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Load visits from JSON cache (localStorage)
export function loadVisitsFromJSON(): Visit[] | null {
  try {
    const json = localStorage.getItem('thursday-pints-visits');
    if (!json) return null;
    
    const visits = JSON.parse(json) as Visit[];
    return visits;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

// Load visits from public/data.json file (fallback)
export async function loadVisitsFromPublicJSON(): Promise<Visit[] | null> {
  try {
    const response = await fetch('/data.json');
    if (!response.ok) return null;
    
    const visits = await response.json() as Visit[];
    return Array.isArray(visits) && visits.length > 0 ? visits : null;
  } catch (error) {
    console.error('Error loading from public/data.json:', error);
    return null;
  }
}

// Get last update timestamp
export function getLastUpdateTimestamp(): string | null {
  return localStorage.getItem('thursday-pints-visits-timestamp');
}

// Parse Excel file from File object (for manual upload)
export async function parseExcelFileFromUpload(file: File): Promise<Visit[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('Failed to read file'));
          return;
        }
        const visits = parseExcelFile(arrayBuffer);
        resolve(visits);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}
