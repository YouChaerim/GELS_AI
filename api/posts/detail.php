<?php
require_once __DIR__ . '/../../config/db.php';
header('Content-Type: application/json; charset=utf-8');

function respond($data, $code=200){
	http_response_code($code);
	echo json_encode($data, JSON_UNESCAPED_UNICODE);
	exit;
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$inc = isset($_GET['inc']) && (int)$_GET['inc'] === 1;
if ($id <= 0) respond(['error'=>['code'=>'BAD_REQUEST','message'=>'invalid id']], 400);

try {
	if ($inc){
		$stmt = $pdo->prepare('UPDATE posts SET views = views + 1 WHERE id = ?');
		$stmt->execute([$id]);
	}
	$stmt = $pdo->prepare('SELECT id,nickname,title,author,subject,`condition` AS cond,price_won,contact,content,views,created_at,updated_at,comment_count FROM posts WHERE id = ?');
	$stmt->execute([$id]);
	$item = $stmt->fetch();
	if (!$item) respond(['error'=>['code'=>'NOT_FOUND','message'=>'not found']], 404);
	respond(['item'=>$item]);
} catch (Throwable $e) {
	respond(['error'=>['code'=>'SERVER_ERROR','message'=>$e->getMessage()]], 500);
}
