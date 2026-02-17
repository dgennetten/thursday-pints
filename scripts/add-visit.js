import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
};

const date = getArg('date');
const brewery = getArg('brewery');
const nextBrewery = getArg('next-brewery');
const notes = getArg('notes');

if (!date || !brewery) {
  console.error('Missing required arguments: date, brewery');
  process.exit(1);
}

// Check if date is less than a week old
const visitDate = new Date(date);
const today = new Date();
const daysDiff = Math.floor((today - visitDate) / (1000 * 60 * 60 * 24));
const isRecent = daysDiff < 7;

// Next Brewery is required only for recent visits
if (isRecent && !nextBrewery) {
  console.error('Error: next-brewery is required for recent visits (within the last week)');
  console.error(`Visit date: ${date} (${daysDiff} days ago)`);
  process.exit(1);
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(date)) {
  console.error(`Invalid date format: ${date}. Expected YYYY-MM-DD`);
  process.exit(1);
}

// Read existing data
const dataPath = join(__dirname, '../public/data.json');
const distDataPath = join(__dirname, '../dist/data.json');

let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (error) {
  console.error(`Error reading ${dataPath}:`, error.message);
  process.exit(1);
}

// Check if visit already exists for this date
const existingIndex = data.findIndex(visit => visit.date === date);
if (existingIndex !== -1) {
  console.log(`⚠️  Visit already exists for ${date}. Updating existing entry.`);
  // Update existing entry
  data[existingIndex].breweryName = brewery;
  
  // Only update nextBrewery if provided
  if (nextBrewery && nextBrewery.trim()) {
    data[existingIndex].nextBrewery = nextBrewery.trim();
  } else if (data[existingIndex].nextBrewery) {
    // Remove nextBrewery if not provided and it exists
    delete data[existingIndex].nextBrewery;
  }
  
  // Filter out "_No response_" and empty values
  const cleanNotes = notes && notes.trim() && notes.trim() !== '_No response_' ? notes.trim() : null;
  if (cleanNotes) {
    data[existingIndex].notes = cleanNotes;
  } else if (data[existingIndex].notes) {
    delete data[existingIndex].notes;
  }
} else {
  // Create new visit entry
  const newVisit = {
    date,
    breweryName: brewery
  };

  // Only add nextBrewery if provided
  if (nextBrewery && nextBrewery.trim()) {
    newVisit.nextBrewery = nextBrewery.trim();
  }

  // Filter out "_No response_" and empty values
  const cleanNotes = notes && notes.trim() && notes.trim() !== '_No response_' ? notes.trim() : null;
  if (cleanNotes) {
    newVisit.notes = cleanNotes;
  }

  // Add to beginning of array (newest first)
  data.unshift(newVisit);
}

// Write back to both public and dist
try {
  // Ensure dist directory exists
  const distDir = join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('Created dist directory');
  }
  
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(distDataPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`✅ ${existingIndex !== -1 ? 'Updated' : 'Added'} visit: ${date} - ${brewery}`);
} catch (error) {
  console.error(`Error writing data files:`, error.message);
  process.exit(1);
}
