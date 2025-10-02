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
$authToken = (string)($input['auth_token'] ?? '');
$nickname = trim($input['nickname'] ?? '');
$title    = trim($input['title'] ?? '');
$author   = trim($input['author'] ?? '');
$subject  = trim($input['subject'] ?? '');
$condition= $input['condition'] ?? '';
$price    = $input['price_won'] ?? $input['price'] ?? null;
$price    = is_numeric($price) ? (int)$price : -1;
$contact  = trim($input['contact'] ?? '');
$content  = trim($input['content'] ?? '');

// Validate required fields
$errors = [];
if ($id <= 0) $errors['id'] = 'ID는 필수';

// Check if we have either password or auth token
$hasPassword = $password !== '' && strlen($password) >= 4;
$hasAuthToken = $authToken !== '';

if (!$hasPassword && !$hasAuthToken) {
	$errors['auth'] = '비밀번호 또는 인증 토큰이 필요합니다';
}

if ($nickname === '' || mb_strlen($nickname) < 2) $errors['nickname'] = '닉네임은 2자 이상';
if ($title === '' || mb_strlen($title) < 2) $errors['title'] = '제목은 2자 이상';
if ($subject === '') $errors['subject'] = '과목은 필수';
if (!in_array($condition, ['상','중','하'], true)) $errors['condition'] = '상태는 상/중/하';
if (!is_int($price) || $price < 0) $errors['price_won'] = '가격은 0 이상의 정수';
if ($contact === '') $errors['contact'] = '연락 수단 필수';
if ($content === '' || mb_strlen($content) < 5) $errors['content'] = '내용은 5자 이상';

if ($errors) {
	respond_json(['error'=>['code'=>'VALIDATION_ERROR','fields'=>$errors]], 422);
}

try {
	// Enhanced debugging - log all input data
	error_log("UPDATE DEBUG - Input data: " . json_encode([
		'id' => $id,
		'has_password' => $hasPassword,
		'has_auth_token' => $hasAuthToken,
		'nickname' => $nickname,
		'title' => $title
	]));
	
	// First, verify the post exists
	$stmt = $pdo->prepare('SELECT id, password_hash, nickname, title FROM posts WHERE id = ?');
	$stmt->execute([$id]);
	$post = $stmt->fetch();
	
	error_log("UPDATE DEBUG - DB result: " . json_encode($post));
	
	if (!$post) {
		respond_json(['error'=>['code'=>'NOT_FOUND','message'=>'게시글을 찾을 수 없습니다','_debug'=>['searched_id'=>$id]]], 404);
	}
	
	// Verify authentication (password or auth token)
	$authValid = false;
	
	if ($hasAuthToken) {
		// Validate auth token
		try {
			$decoded = base64_decode($authToken);
			$parts = explode(':', $decoded);
			if (count($parts) === 3 && $parts[0] == $id) {
				$tokenPassword = $parts[1];
				$timestamp = (int)$parts[2];
				$now = time() * 1000; // Convert to milliseconds
				
				// Check if token is not expired (30 minutes = 1800000 ms)
				if (($now - $timestamp) < 1800000) {
					// Verify the password in the token matches the stored password
					if ($tokenPassword === $post['password_hash']) {
						$authValid = true;
						error_log("UPDATE DEBUG - Auth token validation successful");
					} else {
						error_log("UPDATE DEBUG - Auth token password mismatch");
					}
				} else {
					error_log("UPDATE DEBUG - Auth token expired");
				}
			} else {
				error_log("UPDATE DEBUG - Invalid auth token format");
			}
		} catch (Exception $e) {
			error_log("UPDATE DEBUG - Auth token decode error: " . $e->getMessage());
		}
	} else if ($hasPassword) {
		error_log("UPDATE DEBUG - 비밀번호 직접 검증 시작");
		error_log("UPDATE DEBUG - 입력 비밀번호 길이: " . strlen($password));
		error_log("UPDATE DEBUG - 저장된 비밀번호 길이: " . strlen($post['password_hash']));
		
		// Check if stored password is hashed (starts with $2y$ for bcrypt)
		$isHashed = strpos($post['password_hash'], '$2y$') === 0;
		error_log("UPDATE DEBUG - 비밀번호 해시 여부: " . ($isHashed ? 'YES' : 'NO'));
		
		if ($isHashed) {
			// Use password_verify for hashed passwords
			$authValid = password_verify($password, $post['password_hash']);
			error_log("UPDATE DEBUG - password_verify 결과: " . ($authValid ? 'MATCH' : 'NO_MATCH'));
		} else {
			// Use plain text comparison for non-hashed passwords
			$authValid = ($password === $post['password_hash']);
			error_log("UPDATE DEBUG - 평문 비교 결과: " . ($authValid ? 'MATCH' : 'NO_MATCH'));
		}
	}
	
	if (!$authValid) {
		respond_json(['error'=>[
			'code'=>'UNAUTHORIZED',
			'message'=>'인증에 실패했습니다',
			'_debug'=>[
				'has_password'=>$hasPassword,
				'has_auth_token'=>$hasAuthToken,
				'post_id'=>$post['id']
			]
		]], 401);
	}
	
	// Update the post
	$sql = "UPDATE posts SET 
				nickname=?, title=?, author=?, subject=?, `condition`=?, 
				price_won=?, contact=?, content=?, updated_at=NOW()
			WHERE id=?";
	$stmt = $pdo->prepare($sql);
	$stmt->execute([$nickname, $title, $author, $subject, $condition, $price, $contact, $content, $id]);
	
	respond_json(['ok'=>true,'id'=>$id,'message'=>'게시글이 수정되었습니다']);
	
} catch (Throwable $e) {
	respond_json(['error'=>['code'=>'SERVER_ERROR','message'=>'서버 오류가 발생했습니다','details'=>$e->getMessage()]], 500);
}
