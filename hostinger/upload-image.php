<?php
declare(strict_types=1);

/**
 * Shrimp.News featured image upload endpoint for Hostinger.
 *
 * Repository path : hostinger/upload-image.php
 * Deploy to       : public_html/api/upload-image.php
 * Upload storage  : public_html/uploads/articles/  (../uploads/articles/ from api/)
 *
 * Set UPLOAD_SECRET below to the same value as Vercel/local HOSTINGER_UPLOAD_SECRET.
 */

// ---------------------------------------------------------------------------
// REQUIRED: set this to the same secret used in HOSTINGER_UPLOAD_SECRET
// ---------------------------------------------------------------------------
const UPLOAD_SECRET = 'REPLACE_WITH_THE_SAME_VALUE_AS_HOSTINGER_UPLOAD_SECRET';
// ---------------------------------------------------------------------------

const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
];

/** Origins allowed for optional direct browser CORS access. */
const ALLOWED_ORIGINS = [
    'https://shrimp.news',
    'https://www.shrimp.news',
];

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function applyCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!is_string($origin) || $origin === '') {
        return;
    }

    if (!in_array($origin, ALLOWED_ORIGINS, true)) {
        return;
    }

    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Upload-Secret');
}

applyCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'error'   => 'Method not allowed.',
    ]);
}

$providedSecret = $_SERVER['HTTP_X_UPLOAD_SECRET'] ?? '';
if (
    !is_string($providedSecret)
    || $providedSecret === ''
    || UPLOAD_SECRET === 'REPLACE_WITH_THE_SAME_VALUE_AS_HOSTINGER_UPLOAD_SECRET'
    || !hash_equals(UPLOAD_SECRET, $providedSecret)
) {
    respond(401, [
        'success' => false,
        'error'   => 'Unauthorized upload request.',
    ]);
}

if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
    respond(400, [
        'success' => false,
        'error'   => 'No file was uploaded.',
    ]);
}

$file = $_FILES['file'];

if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    respond(400, [
        'success' => false,
        'error'   => 'Upload failed. Please try again.',
    ]);
}

$tmpPath = $file['tmp_name'] ?? '';
if (!is_string($tmpPath) || $tmpPath === '' || !is_uploaded_file($tmpPath)) {
    respond(400, [
        'success' => false,
        'error'   => 'Invalid uploaded file.',
    ]);
}

$size = (int) ($file['size'] ?? 0);
if ($size <= 0 || $size > MAX_BYTES) {
    respond(400, [
        'success' => false,
        'error'   => 'Image must be 5 MB or smaller.',
    ]);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($tmpPath);
if (!is_string($mime) || !isset(ALLOWED_MIME[$mime])) {
    respond(400, [
        'success' => false,
        'error'   => 'Only JPG, JPEG, PNG, and WebP images are allowed.',
    ]);
}

$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false) {
    respond(400, [
        'success' => false,
        'error'   => 'Uploaded file is not a valid image.',
    ]);
}

$originalName = basename((string) ($file['name'] ?? 'image'));
$originalName = str_replace("\0", '', $originalName);
$baseName = pathinfo($originalName, PATHINFO_FILENAME);
$baseName = preg_replace('/[^a-zA-Z0-9._-]+/', '-', (string) $baseName) ?? 'image';
$baseName = trim($baseName, '.-_');
if ($baseName === '') {
    $baseName = 'image';
}
$baseName = substr($baseName, 0, 80);

$extension = ALLOWED_MIME[$mime];
$uploadDir = __DIR__ . '/../uploads/articles';

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    respond(500, [
        'success' => false,
        'error'   => 'Upload directory is not available.',
    ]);
}

$realUploadDir = realpath($uploadDir);
if ($realUploadDir === false || !is_dir($realUploadDir)) {
    respond(500, [
        'success' => false,
        'error'   => 'Upload directory is not available.',
    ]);
}

$attempts = 0;
$destination = '';

do {
    $attempts++;
    $random = bin2hex(random_bytes(8));
    $filename = sprintf('%s-%s-%s.%s', (string) time(), $random, $baseName, $extension);
    $filename = str_replace(['/', '\\', "\0", '..'], '', $filename);
    $destination = $realUploadDir . DIRECTORY_SEPARATOR . $filename;
} while (file_exists($destination) && $attempts < 5);

if ($destination === '' || file_exists($destination)) {
    respond(500, [
        'success' => false,
        'error'   => 'Could not generate a unique filename.',
    ]);
}

if (!move_uploaded_file($tmpPath, $destination)) {
    respond(500, [
        'success' => false,
        'error'   => 'Could not save the uploaded image.',
    ]);
}

$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$publicUrl = $scheme . '://' . $host . '/uploads/articles/' . rawurlencode($filename);

respond(201, [
    'success'  => true,
    'url'      => $publicUrl,
    'filename' => $filename,
]);
