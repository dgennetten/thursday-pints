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

if (!date || !brewery || !nextBrewery) {
  console.error('Missing required arguments: date, brewery, next-brewery');
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
  data[existingIndex].nextBrewery = nextBrewery;
  if (notes && notes.trim()) {
    data[existingIndex].notes = notes.trim();
  } else if (data[existingIndex].notes) {
    delete data[existingIndex].notes;
  }
} else {
  // Create new visit entry
  const newVisit = {
    date,
    breweryName: brewery,
    nextBrewery: nextBrewery.trim()
  };

  if (notes && notes.trim()) {
    newVisit.notes = notes.trim();
  }

  // Add to beginning of array (newest first)
  data.unshift(newVisit);
}

// Write back to both public and dist
try {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(distDataPath, JSON.stringify(data, null, 2) + '\n');
  console.log(`✅ ${existingIndex !== -1 ? 'Updated' : 'Added'} visit: ${date} - ${brewery}`);
} catch (error) {
  console.error(`Error writing data files:`, error.message);
  process.exit(1);
}
