<?php
require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json; charset=utf-8');

// 디버깅을 위한 로그 함수
function debugLog($message, $data = null) {
    error_log("[SUBJECTS.PHP] " . $message . ($data ? " | Data: " . json_encode($data, JSON_UNESCAPED_UNICODE) : ""));
}

function respond($data, $code=200){ 
    debugLog("Responding with code: $code", $data);
    http_response_code($code); 
    echo json_encode($data, JSON_UNESCAPED_UNICODE); 
    exit; 
}

debugLog("=== SUBJECTS API 호출 시작 ===");
debugLog("Request Method: " . $_SERVER['REQUEST_METHOD']);
debugLog("Request URI: " . $_SERVER['REQUEST_URI']);

try {
	debugLog("=== 데이터베이스 연결 확인 ===");
	debugLog("PDO 연결 상태", ['connected' => isset($pdo)]);
	
	$sql = "SELECT LOWER(subject) AS subject, COUNT(*) AS count FROM posts GROUP BY LOWER(subject) ORDER BY subject ASC";
	debugLog("SQL: " . $sql);
	
	$items = $pdo->query($sql)->fetchAll();
	debugLog("Fetched subjects count: " . count($items));
	debugLog("Subjects data", $items);
	
	respond(['items'=>$items]);
} catch (Throwable $e) {
	debugLog("ERROR occurred: " . $e->getMessage());
	debugLog("ERROR trace: " . $e->getTraceAsString());
	respond(['error'=>['code'=>'SERVER_ERROR','message'=>$e->getMessage()]], 500);
}
