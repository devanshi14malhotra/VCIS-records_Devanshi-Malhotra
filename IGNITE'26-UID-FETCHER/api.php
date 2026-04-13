<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse($statusCode, $payload)
{
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

function getDbConnection()
{
    $localConfigPath = __DIR__ . '/config.php';
    $parentConfigPath = dirname(__DIR__) . '/config.php';

    if (file_exists($localConfigPath)) {
        require_once $localConfigPath;
    } elseif (file_exists($parentConfigPath)) {
        require_once $parentConfigPath;
    }

    $host = defined('DB_HOST') ? DB_HOST : getenv('DB_HOST');
    $user = defined('DB_USER') ? DB_USER : getenv('DB_USER');
    $pass = defined('DB_PASS') ? DB_PASS : getenv('DB_PASS');
    $name = defined('DB_NAME') ? DB_NAME : getenv('DB_NAME');
    $port = defined('DB_PORT') ? (int) DB_PORT : (int) getenv('DB_PORT');

    if (!$host || !$user || !$name) {
        jsonResponse(500, [
            'success' => false,
            'error' => 'Database credentials are not configured. Add config.php in synergy root or set DB_* environment variables.'
        ]);
    }

    if (!$port) {
        $port = 3306;
    }

    $conn = mysqli_connect($host, $user, $pass, $name, $port);
    if (!$conn) {
        jsonResponse(500, [
            'success' => false,
            'error' => 'Database connection failed.'
        ]);
    }

    mysqli_set_charset($conn, 'utf8mb4');
    return $conn;
}

function rowHasColumn($conn, $columnName)
{
    $escaped = mysqli_real_escape_string($conn, $columnName);
    $result = mysqli_query($conn, "SHOW COLUMNS FROM `2026_Participants` LIKE '{$escaped}'");
    if (!$result) {
        return false;
    }

    $exists = mysqli_num_rows($result) > 0;
    mysqli_free_result($result);
    return $exists;
}

$conn = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'update') {
    $method = 'PUT';
}

if ($method === 'GET') {
    $uid = isset($_GET['uid']) ? trim($_GET['uid']) : '';
    if ($uid === '') {
        jsonResponse(400, ['success' => false, 'error' => 'UID or Enrollment Number is required.']);
    }

    $trackingColumns = [
        'Undertaking',
        'CertificateIssued',
        'Attendance',
        'PrizeMoneySent'
    ];

    $selectTracking = [];
    foreach ($trackingColumns as $column) {
        if (rowHasColumn($conn, $column)) {
            $selectTracking[] = "`{$column}`";
        } else {
            $selectTracking[] = "0 AS `{$column}`";
        }
    }

    $winnerColumns = [
        'WinnerFormRank',
        'BankName',
        'AccountNumber',
        'IFSCCode',
        'RefereeVerified',
        'PrizeAmount'
    ];

    $selectWinner = [];
    foreach ($winnerColumns as $column) {
        if (rowHasColumn($conn, $column)) {
            $selectWinner[] = "`{$column}`";
        } else {
            $selectWinner[] = "NULL AS `{$column}`";
        }
    }

    $query = 'SELECT UID, EnrollmentNo, Name, Affiliation, Course, MobileNo, EmailID, Sports, TeamRole, CaptainUID, TotalAmount, TransactionID, CreatedAt, '
        . implode(', ', $selectTracking)
        . ', '
        . implode(', ', $selectWinner)
        . ' FROM `2026_Participants` WHERE UID = ? OR EnrollmentNo = ? LIMIT 1';
    $stmt = mysqli_prepare($conn, $query);

    if (!$stmt) {
        jsonResponse(500, ['success' => false, 'error' => 'Failed to prepare lookup query.']);
    }

    mysqli_stmt_bind_param($stmt, 'ss', $uid, $uid);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = $result ? mysqli_fetch_assoc($result) : null;

    if (!$row) {
        mysqli_stmt_close($stmt);
        jsonResponse(404, ['success' => false, 'error' => 'No participant found for the provided value.']);
    }

    foreach (['Undertaking', 'CertificateIssued', 'Attendance', 'PrizeMoneySent'] as $key) {
        if (!isset($row[$key])) {
            $row[$key] = 0;
        }
    }

    mysqli_stmt_close($stmt);
    jsonResponse(200, ['success' => true, 'participant' => $row]);
}

if ($method === 'PUT') {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    if (!is_array($data)) {
        jsonResponse(400, ['success' => false, 'error' => 'Invalid JSON payload.']);
    }

    $uid = isset($data['UID']) ? trim((string) $data['UID']) : '';
    if ($uid === '') {
        jsonResponse(400, ['success' => false, 'error' => 'UID is required for status update.']);
    }

    $requiredColumns = ['Undertaking', 'CertificateIssued', 'Attendance', 'PrizeMoneySent'];
    foreach ($requiredColumns as $column) {
        if (!rowHasColumn($conn, $column)) {
            jsonResponse(400, [
                'success' => false,
                'error' => 'Column ' . $column . ' is missing. Run schema.sql before updates.'
            ]);
        }
    }

    $undertaking = isset($data['Undertaking']) ? (int) $data['Undertaking'] : 0;
    $certificate = isset($data['CertificateIssued']) ? (int) $data['CertificateIssued'] : 0;
    $attendance = isset($data['Attendance']) ? (int) $data['Attendance'] : 0;
    $prizeMoney = isset($data['PrizeMoneySent']) ? (int) $data['PrizeMoneySent'] : 0;

    $query = 'UPDATE `2026_Participants` SET Undertaking = ?, CertificateIssued = ?, Attendance = ?, PrizeMoneySent = ? WHERE UID = ? OR EnrollmentNo = ? LIMIT 1';
    $stmt = mysqli_prepare($conn, $query);

    if (!$stmt) {
        jsonResponse(500, ['success' => false, 'error' => 'Failed to prepare update query.']);
    }

    mysqli_stmt_bind_param($stmt, 'iiiiss', $undertaking, $certificate, $attendance, $prizeMoney, $uid, $uid);
    mysqli_stmt_execute($stmt);

    if (mysqli_stmt_affected_rows($stmt) < 0) {
        mysqli_stmt_close($stmt);
        jsonResponse(500, ['success' => false, 'error' => 'Status update failed.']);
    }

    mysqli_stmt_close($stmt);
    jsonResponse(200, ['success' => true, 'message' => 'Status updated successfully.']);
}

jsonResponse(405, ['success' => false, 'error' => 'Method not allowed.']);
