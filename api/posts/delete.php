<?php
require_once __DIR__ . '/../../config/db.php';

function respond_json($data, $code=200){
	header('Content-Type: application/json; charset=utf-8');
	http_response_code($code);
	echo json_encode($data, JSON_UNESCAPED_UNICODE);
	exit;
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	respond_json(['error'=>['code'=>'METHOD_NOT_ALLOWED','message'=>'POST method required']], 405);
}

// Detect json vs form
$raw = file_get_contents('php://input');
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($ctype, 'application/json') !== false;
$input = $isJson ? (json_decode($raw, true) ?: []) : $_POST;

$id = isset($input['id']) ? (int)$input['id'] : 0;
$password = (string)($input['password'] ?? '');
$verifyOnly = isset($input['verify_only']) && $input['verify_only'] === '1';

// Validate required fields
$errors = [];
if ($id <= 0) $errors['id'] = 'ID는 필수';
if ($password === '' || strlen($password) < 4) $errors['password'] = '비밀번호는 4자 이상';

if ($errors) {
	respond_json(['error'=>['code'=>'VALIDATION_ERROR','fields'=>$errors]], 422);
}

try {
	$startTime = microtime(true);
	error_log("[DELETE.PHP] === 처리 시작 ===");
	error_log("[DELETE.PHP] 요청 데이터: ID=$id, verify_only=$verifyOnly");
	
	// First, verify the post exists and password matches
	$queryStart = microtime(true);
	$stmt = $pdo->prepare('SELECT id, password_hash, title FROM posts WHERE id = ?');
	$stmt->execute([$id]);
	$post = $stmt->fetch();
	$queryTime = (microtime(true) - $queryStart) * 1000;
	error_log("[DELETE.PHP] DB 조회 완료: " . round($queryTime, 2) . "ms");
	
	if (!$post) {
		respond_json(['error'=>['code'=>'NOT_FOUND','message'=>'게시글을 찾을 수 없습니다']], 404);
	}
	
	error_log("[DELETE.PHP] 비밀번호 검증 시작");
	error_log("[DELETE.PHP] 입력 비밀번호 길이: " . strlen($password));
	error_log("[DELETE.PHP] 저장된 비밀번호 길이: " . strlen($post['password_hash']));
	error_log("[DELETE.PHP] 저장된 비밀번호 시작 문자: " . substr($post['password_hash'], 0, 10));
	
	// Check if stored password is hashed (starts with $2y$ for bcrypt)
	$isHashed = strpos($post['password_hash'], '$2y$') === 0;
	error_log("[DELETE.PHP] 비밀번호 해시 여부: " . ($isHashed ? 'YES' : 'NO'));
	
	$passwordMatch = false;
	if ($isHashed) {
		// Use password_verify for hashed passwords
		$passwordMatch = password_verify($password, $post['password_hash']);
		error_log("[DELETE.PHP] password_verify 결과: " . ($passwordMatch ? 'MATCH' : 'NO_MATCH'));
	} else {
		// Use plain text comparison for non-hashed passwords
		$passwordMatch = ($password === $post['password_hash']);
		error_log("[DELETE.PHP] 평문 비교 결과: " . ($passwordMatch ? 'MATCH' : 'NO_MATCH'));
	}
	
	if (!$passwordMatch) {
		error_log("[DELETE.PHP] 비밀번호 불일치 - 인증 실패");
		respond_json(['error'=>[
			'code'=>'UNAUTHORIZED',
			'message'=>'비밀번호가 일치하지 않습니다',
			'_debug'=>[
				'input_password_length'=>strlen($password),
				'stored_password_length'=>strlen($post['password_hash']),
				'is_hashed'=>$isHashed,
				'post_id'=>$post['id'],
				'verify_only'=>$verifyOnly,
				'password_starts_with'=>substr($post['password_hash'], 0, 10)
			]
		]], 401);
	}
	
	error_log("[DELETE.PHP] 비밀번호 검증 성공");
	
	// If verify_only flag is set, just return success without deleting
	if ($verifyOnly) {
		$totalTime = (microtime(true) - $startTime) * 1000;
		error_log("[DELETE.PHP] 비밀번호 검증 완료: " . round($totalTime, 2) . "ms");
		respond_json(['verified'=>true,'message'=>'비밀번호가 확인되었습니다','id'=>$id,'title'=>$post['title']]);
	}
	
	// Delete related comments first (if comments table exists)
	try {
		$stmt = $pdo->prepare('DELETE FROM comments WHERE post_id = ?');
		$stmt->execute([$id]);
	} catch (Throwable $e) {
		// Comments table might not exist yet, ignore error
	}
	
	// Delete the post
	$stmt = $pdo->prepare('DELETE FROM posts WHERE id = ?');
	$stmt->execute([$id]);
	
	respond_json(['ok'=>true,'id'=>$id,'message'=>'게시글이 삭제되었습니다','title'=>$post['title']]);
	
} catch (Throwable $e) {
	respond_json(['error'=>['code'=>'SERVER_ERROR','message'=>'서버 오류가 발생했습니다','details'=>$e->getMessage()]], 500);
}
