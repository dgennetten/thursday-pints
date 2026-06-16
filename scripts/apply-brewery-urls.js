#!/usr/bin/env node

/**
 * Adds website_url column (if missing) and applies URLs from data/brewery-websites.json.
 * Also updates public/breweries.json with website_url fields.
 *
 * Requires DB_PASSWORD in .env.local.
 *
 * Usage: node scripts/apply-brewery-urls.js
 */

import mysql from 'mysql2/promise';
import { readFileSync, writeFileSync } from 'fs';
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

const websites = JSON.parse(
  readFileSync(join(projectRoot, 'data/brewery-websites.json'), 'utf8')
);
const breweries = JSON.parse(
  readFileSync(join(projectRoot, 'public/breweries.json'), 'utf8')
);

for (const brewery of breweries) {
  const url = websites[brewery.brewery_name];
  if (url) brewery.website_url = url;
}

writeFileSync(
  join(projectRoot, 'public/breweries.json'),
  JSON.stringify(breweries, null, 2) + '\n',
  'utf8'
);
console.log(`📝 Updated public/breweries.json with website_url fields\n`);

const connection = await mysql.createConnection({
  host:     'mysql.gennetten.com',
  user:     'dgennetten',
  password: DB_PASSWORD,
  database: 'thursdaypints',
  charset:  'utf8mb4',
});

console.log('✅ Connected to MySQL\n');

try {
  await connection.execute(
    'ALTER TABLE breweries ADD COLUMN website_url VARCHAR(500) NULL AFTER status'
  );
  console.log('➕ Added website_url column\n');
} catch (err) {
  if (err.code === 'ER_DUP_FIELDNAME') {
    console.log('ℹ️  website_url column already exists\n');
  } else {
    throw err;
  }
}

let updated = 0;
for (const [name, url] of Object.entries(websites)) {
  const [result] = await connection.execute(
    'UPDATE breweries SET website_url = ? WHERE brewery_name = ?',
    [url, name]
  );
  if (result.affectedRows > 0) updated++;
}

console.log(`✅ Updated website_url for ${updated} breweries\n`);
await connection.end();
