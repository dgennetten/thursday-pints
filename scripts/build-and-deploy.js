#!/usr/bin/env node

/**
 * Build and Deploy Script
 * 
 * This script:
 * 1. Builds the application using npm run build
 * 2. Deploys the dist/ folder to Dreamhost via FTP
 * 
 * Requires .env.local file with:
 * - SFTP_HOST
 * - SFTP_USERNAME
 * - SFTP_PASSWORD
 * - FTP_REMOTE_PATH (optional, defaults to /thursdaypints.com/)
 */

import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import ftp from 'basic-ftp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = join(projectRoot, '.env.local');
  
  if (!existsSync(envPath)) {
    console.error('❌ Error: .env.local file not found!');
    console.error('   Please create .env.local based on .env.local.example');
    process.exit(1);
  }
  
  // Load .env.local file
  const result = config({ path: envPath });
  
  if (result.error) {
    console.error('❌ Error loading .env.local file:');
    console.error(`   ${result.error.message}`);
    process.exit(1);
  }
  
  // Return the parsed environment variables
  return result.parsed || {};
}

// Validate required environment variables
function validateEnv(env) {
  const required = ['SFTP_HOST', 'SFTP_USERNAME', 'SFTP_PASSWORD'];
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Error: Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    process.exit(1);
  }
}

// Build the application
function build() {
  console.log('📦 Building application...');
  try {
    execSync('npm run build', {
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('✅ Build completed successfully\n');
  } catch (error) {
    console.error('❌ Build failed!');
    process.exit(1);
  }
}

// Verify dist directory exists
function verifyDist() {
  const distPath = join(projectRoot, 'dist');
  
  if (!existsSync(distPath)) {
    console.error('❌ Error: dist/ directory not found!');
    console.error('   Build may have failed. Please check the build output.');
    process.exit(1);
  }
  
  const dataJsonPath = join(distPath, 'data.json');
  if (!existsSync(dataJsonPath)) {
    console.warn('⚠️  Warning: dist/data.json not found!');
    console.warn('   The deployment will continue, but data.json may be missing.');
  } else {
    const stats = statSync(dataJsonPath);
    console.log(`📄 Found dist/data.json (${stats.size} bytes)`);
  }
}

// Deploy to FTP server
async function deploy(env) {
  const serverDir = env.FTP_REMOTE_PATH || '/thursdaypints.com/';
  const localDir = join(projectRoot, 'dist');
  
  console.log('🚀 Deploying to FTP server...');
  console.log(`   Server: ${env.SFTP_HOST}`);
  console.log(`   Remote directory: ${serverDir}`);
  console.log(`   Local directory: ${localDir}\n`);
  
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    // Connect to FTP server
    console.log('📡 Connecting to FTP server...');
    await client.access({
      host: env.SFTP_HOST,
      user: env.SFTP_USERNAME,
      password: env.SFTP_PASSWORD,
      secure: false
    });
    console.log('✅ Connected to FTP server\n');
    
    // Change to server directory
    console.log(`📁 Changing to directory: ${serverDir}`);
    await client.cd(serverDir);
    console.log('✅ Changed to target directory\n');
    
    // Upload all files from dist/
    console.log('📤 Uploading files...');
    await client.uploadFromDir(localDir);
    console.log('✅ Files uploaded successfully\n');
    
    // Verify data.json was uploaded
    if (existsSync(join(localDir, 'data.json'))) {
      console.log('🔍 Verifying data.json upload...');
      const serverSize = await client.size('data.json');
      const localStats = statSync(join(localDir, 'data.json'));
      
      if (serverSize === localStats.size) {
        console.log(`✅ data.json verified (${serverSize} bytes)`);
      } else {
        console.warn(`⚠️  Warning: File size mismatch!`);
        console.warn(`   Local: ${localStats.size} bytes`);
        console.warn(`   Server: ${serverSize} bytes`);
      }
    }
    
    console.log('\n✅ Deployment completed successfully!');
    console.log(`🌐 Your site should be live at: https://thursdaypints.com`);
    
  } catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error(`   Error: ${error.message}`);
    if (error.code) {
      console.error(`   Code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    client.close();
  }
}

// Main execution
async function main() {
  console.log('🔨 Build and Deploy Script\n');
  console.log('=' .repeat(50) + '\n');
  
  // Load and validate environment
  const env = loadEnv();
  validateEnv(env);
  
  // Build
  build();
  
  // Verify dist
  verifyDist();
  
  // Deploy
  await deploy(env);
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ All done!');
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
