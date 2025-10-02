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
if ($password === '' || strlen($password) < 4) $errors['password'] = '비밀번호는 4자 이상';
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
		'password' => $password,
		'nickname' => $nickname,
		'title' => $title
	]));
	
	// First, verify the post exists and password matches
	$stmt = $pdo->prepare('SELECT id, password_hash, nickname, title FROM posts WHERE id = ?');
	$stmt->execute([$id]);
	$post = $stmt->fetch();
	
	error_log("UPDATE DEBUG - DB result: " . json_encode($post));
	
	if (!$post) {
		respond_json(['error'=>['code'=>'NOT_FOUND','message'=>'게시글을 찾을 수 없습니다','_debug'=>['searched_id'=>$id]]], 404);
	}
	
	// TEMPORARY: Plain text comparison for debugging
	// TODO: Change back to password_verify() after testing
	if ($password !== $post['password_hash']) {
		respond_json(['error'=>[
			'code'=>'UNAUTHORIZED',
			'message'=>'비밀번호가 일치하지 않습니다',
			'_debug'=>[
				'input_password'=>$password,
				'stored_password'=>$post['password_hash'],
				'passwords_match'=>($password === $post['password_hash']),
				'input_password_length'=>strlen($password),
				'stored_password_length'=>strlen($post['password_hash']),
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
