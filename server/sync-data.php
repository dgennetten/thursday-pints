<?php
/**
 * Data Sync Script
 * 
 * This script fetches data from OneDrive and saves it to public/data.json
 * Can be run via cron job or manually.
 * 
 * Cron setup (runs every hour):
 * 0 * * * * /usr/bin/php /home/username/thursday-pints/server/sync-data.php
 */

require_once __DIR__ . '/../vendor/autoload.php'; // If using Composer for xlsx parsing

// Configuration
$ONEDRIVE_URL = 'https://onedrive.live.com/download?resid=d16eda79b75a425c!IQBSKd91i0T5S50GEqU34yRsAahxmTOGgL1koXqWGDuy8WY&e=xlsx';
$OUTPUT_FILE = __DIR__ . '/../public/data.json';
$LOG_FILE = __DIR__ . '/sync.log';

function logMessage($message) {
    global $LOG_FILE;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
}

function fetchOneDriveFile($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error || $httpCode !== 200) {
        throw new Exception("Failed to fetch: $error (HTTP $httpCode)");
    }
    
    return $content;
}

function parseExcelFile($filePath) {
    // This is a simplified version - you'd need to install a PHP Excel library
    // Option: Use PhpSpreadsheet (composer require phpoffice/phpspreadsheet)
    // Or use the Node.js version and call it via exec
    
    // For now, return empty array - implement based on your PHP Excel library
    return [];
}

try {
    logMessage("Starting data sync...");
    
    // Fetch Excel file
    $excelContent = fetchOneDriveFile($ONEDRIVE_URL);
    
    // Save to temp file
    $tempFile = sys_get_temp_dir() . '/spreadsheet_' . time() . '.xlsx';
    file_put_contents($tempFile, $excelContent);
    
    // Parse Excel (implement based on your library)
    // $visits = parseExcelFile($tempFile);
    
    // For now, we'll need to use a different approach
    // Option 1: Use Node.js script via exec
    // Option 2: Use PhpSpreadsheet library
    // Option 3: Pre-convert Excel to JSON manually
    
    logMessage("Sync completed successfully");
    
    // Clean up
    unlink($tempFile);
    
} catch (Exception $e) {
    logMessage("Error: " . $e->getMessage());
    exit(1);
}
