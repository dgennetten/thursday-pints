#!/usr/bin/env node

/**
 * One-time migration: reads public/data.json and public/breweries.json
 * and inserts all records into the MySQL thursdaypints database.
 *
 * Requires DB_PASSWORD in .env.local.
 * Safe to re-run — uses ON DUPLICATE KEY UPDATE (idempotent).
 *
 * Usage: npm run migrate-to-mysql
 */

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

config({ path: join(projectRoot, '.env.local') });

const DB_PASSWORD = process.env.DB_PASSWORD;
if (!DB_PASSWORD) {
  console.error('❌ DB_PASSWORD not set in .env.local');
  process.exit(1);
}

// Load JSON files
const visits    = JSON.parse(readFileSync(join(projectRoot, 'public/data.json'),      'utf8'));
const breweries = JSON.parse(readFileSync(join(projectRoot, 'public/breweries.json'), 'utf8'));

console.log(`📂 Loaded ${visits.length} visits and ${breweries.length} breweries from JSON\n`);

const connection = await mysql.createConnection({
  host:     'mysql.gennetten.com',
  user:     'dgennetten',
  password: DB_PASSWORD,
  database: 'thursdaypints',
  charset:  'utf8mb4',
});

console.log('✅ Connected to MySQL\n');

// --- Migrate visits ---
console.log('📤 Migrating visits...');
let visitInserted = 0;
let visitUpdated  = 0;

for (const v of visits) {
  const [result] = await connection.execute(
    `INSERT INTO visits (visit_date, brewery_name, is_closed, notes, next_brewery)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       brewery_name = VALUES(brewery_name),
       is_closed    = VALUES(is_closed),
       notes        = VALUES(notes),
       next_brewery = VALUES(next_brewery),
       updated_at   = NOW()`,
    [
      v.date,
      v.breweryName,
      v.isClosed ? 1 : 0,
      v.notes        ?? null,
      v.nextBrewery  ?? null,
    ]
  );
  if (result.affectedRows === 1) visitInserted++;
  else if (result.affectedRows === 2) visitUpdated++;
}

console.log(`   ✅ ${visitInserted} inserted, ${visitUpdated} updated\n`);

// --- Migrate breweries ---
console.log('📤 Migrating breweries...');
let brewInserted = 0;
let brewUpdated  = 0;

for (const b of breweries) {
  const [result] = await connection.execute(
    `INSERT INTO breweries (brewery_name, brewery_address, latitude, longitude, status)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       brewery_address = VALUES(brewery_address),
       latitude        = VALUES(latitude),
       longitude       = VALUES(longitude),
       status          = VALUES(status),
       updated_at      = NOW()`,
    [
      b.brewery_name,
      b.brewery_address,
      b.latitude,
      b.longitude,
      b.status,
    ]
  );
  if (result.affectedRows === 1) brewInserted++;
  else if (result.affectedRows === 2) brewUpdated++;
}

console.log(`   ✅ ${brewInserted} inserted, ${brewUpdated} updated\n`);

await connection.end();
console.log('✅ Migration complete!');
