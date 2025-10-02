<?php
require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json; charset=utf-8');

// 디버깅을 위한 로그 함수
function debugLog($message, $data = null) {
    error_log("[LIST.PHP] " . $message . ($data ? " | Data: " . json_encode($data, JSON_UNESCAPED_UNICODE) : ""));
}

function respond($data, $code=200){
	debugLog("Responding with code: $code", $data);
	http_response_code($code);
	echo json_encode($data, JSON_UNESCAPED_UNICODE);
	exit;
}

debugLog("=== API 호출 시작 ===");
debugLog("Request Method: " . $_SERVER['REQUEST_METHOD']);
debugLog("Request URI: " . $_SERVER['REQUEST_URI']);
debugLog("GET Parameters", $_GET);

$page = max(1, (int)($_GET['page'] ?? 1));
$size = min(50, max(5, (int)($_GET['size'] ?? 20)));
$offset = ($page - 1) * $size;

$q = trim($_GET['q'] ?? '');
$subject = trim($_GET['subject'] ?? '');
$condition = trim($_GET['condition'] ?? '');
$min = isset($_GET['min_price']) && is_numeric($_GET['min_price']) ? (int)$_GET['min_price'] : null;
$max = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? (int)$_GET['max_price'] : null;
$sort = $_GET['sort'] ?? 'created_at';
$order = strtolower($_GET['order'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';
$allowedSort = ['created_at','price_won','views'];
if (!in_array($sort, $allowedSort, true)) $sort = 'created_at';

debugLog("Parsed parameters", [
    'page' => $page,
    'size' => $size,
    'offset' => $offset,
    'q' => $q,
    'subject' => $subject,
    'condition' => $condition,
    'min' => $min,
    'max' => $max,
    'sort' => $sort,
    'order' => $order
]);

$where = [];
$params = [];
if ($subject !== '') { $where[] = 'LOWER(subject) = ?'; $params[] = mb_strtolower($subject, 'UTF-8'); }
if ($condition !== '') { $where[] = '`condition` = ?'; $params[] = $condition; }
if ($min !== null) { $where[] = 'price_won >= ?'; $params[] = $min; }
if ($max !== null) { $where[] = 'price_won <= ?'; $params[] = $max; }
if ($q !== '') { $where[] = '(title LIKE ? OR author LIKE ? OR subject LIKE ?)'; $params[] = "%$q%"; $params[] = "%$q%"; $params[] = "%$q%"; }
$whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

debugLog("WHERE clause", ['where' => $where, 'params' => $params]);
debugLog("WHERE SQL: " . $whereSql);

try {
	debugLog("=== 데이터베이스 연결 확인 ===");
	debugLog("PDO 연결 상태", ['connected' => isset($pdo)]);
	
	$countSql = "SELECT COUNT(*) FROM posts $whereSql";
	debugLog("Count SQL: " . $countSql);
	$stmt = $pdo->prepare($countSql);
	$stmt->execute($params);
	$total = (int)$stmt->fetchColumn();
	debugLog("Total count: " . $total);
	
	$sql = "SELECT id,title,author,subject,`condition` AS cond,price_won,nickname,created_at,views
				FROM posts $whereSql ORDER BY $sort $order LIMIT $offset, $size";
	debugLog("Main SQL: " . $sql);
	$stmt = $pdo->prepare($sql);
	$stmt->execute($params);
	$items = $stmt->fetchAll();
	debugLog("Fetched items count: " . count($items));
	debugLog("Sample items", array_slice($items, 0, 2)); // 처음 2개만 로그
	
	respond(['items'=>$items,'total'=>$total,'page'=>$page,'size'=>$size]);
} catch (Throwable $e) {
	debugLog("ERROR occurred: " . $e->getMessage());
	debugLog("ERROR trace: " . $e->getTraceAsString());
	respond(['error'=>['code'=>'SERVER_ERROR','message'=>$e->getMessage()]], 500);
}
