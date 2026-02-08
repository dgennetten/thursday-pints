<?php
/**
 * OneDrive Proxy Endpoint
 * 
 * This PHP script acts as a proxy to fetch OneDrive files,
 * bypassing CORS restrictions. Place this in your Dreamhost
 * server's public directory.
 * 
 * Usage: GET /proxy.php?url=<onedrive-url>
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get the OneDrive URL from query parameter
$onedriveUrl = $_GET['url'] ?? '';

if (empty($onedriveUrl)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing url parameter']);
    exit;
}

// Validate URL
if (!filter_var($onedriveUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Only allow OneDrive URLs for security
if (strpos($onedriveUrl, 'onedrive.live.com') === false && 
    strpos($onedriveUrl, '1drv.ms') === false) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Only OneDrive URLs are allowed']);
    exit;
}

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $onedriveUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

// Execute request
$fileContent = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'cURL error: ' . $error]);
    exit;
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch file. HTTP ' . $httpCode]);
    exit;
}

// Set appropriate content type
if ($contentType) {
    header('Content-Type: ' . $contentType);
} else {
    // Default to Excel if content type not detected
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// Output the file content
echo $fileContent;
