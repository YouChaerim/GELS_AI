<?php
// 디버깅을 위한 로그 함수
function dbDebugLog($message, $data = null) {
    error_log("[DB.PHP] " . $message . ($data ? " | Data: " . json_encode($data, JSON_UNESCAPED_UNICODE) : ""));
}

dbDebugLog("=== 데이터베이스 연결 시작 ===");

$env = include __DIR__ . '/env.php';
dbDebugLog("환경 설정 로드", [
    'DB_HOST' => $env['DB_HOST'],
    'DB_NAME' => $env['DB_NAME'],
    'DB_USER' => $env['DB_USER'],
    'DB_PASS' => '***' // 비밀번호는 로그에 남기지 않음
]);

$dsn = 'mysql:host=' . $env['DB_HOST'] . ';dbname=' . $env['DB_NAME'] . ';charset=utf8mb4';
dbDebugLog("DSN: " . $dsn);

$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $env['DB_USER'], $env['DB_PASS'], $options);
    dbDebugLog("데이터베이스 연결 성공");
    
    // 연결 테스트
    $testQuery = $pdo->query("SELECT 1 as test");
    $testResult = $testQuery->fetch();
    dbDebugLog("연결 테스트 결과", $testResult);
    
} catch (PDOException $e) {
    dbDebugLog("데이터베이스 연결 실패: " . $e->getMessage());
    throw $e;
}
