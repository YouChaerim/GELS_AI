<?php
require_once __DIR__ . '/../../config/db.php';

function respond_json($data, $code=200){
	header('Content-Type: application/json; charset=utf-8');
	http_response_code($code);
	echo json_encode($data, JSON_UNESCAPED_UNICODE);
	exit;
}

// Detect json vs form
$raw = file_get_contents('php://input');
$ctype = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = stripos($ctype, 'application/json') !== false;
$input = $isJson ? (json_decode($raw, true) ?: []) : $_POST;

$nickname = trim($input['nickname'] ?? '');
$password = (string)($input['password'] ?? '');
$title    = trim($input['title'] ?? '');
$author   = trim($input['author'] ?? '');
$subject  = trim($input['subject'] ?? '');
$condition= $input['condition'] ?? '';
$price    = $input['price_won'] ?? $input['price'] ?? null;
$price    = is_numeric($price) ? (int)$price : -1;
$contact  = trim($input['contact'] ?? '');
$content  = trim($input['content'] ?? '');

$errors = [];
if ($nickname === '' || mb_strlen($nickname) < 2) $errors['nickname'] = '닉네임은 2자 이상';
if ($password === '' || strlen($password) < 4) $errors['password'] = '비밀번호는 4자 이상';
if ($title === '' || mb_strlen($title) < 2) $errors['title'] = '제목은 2자 이상';
if ($subject === '') $errors['subject'] = '과목은 필수';
if (!in_array($condition, ['상','중','하'], true)) $errors['condition'] = '상태는 상/중/하';
if (!is_int($price) || $price < 0) $errors['price_won'] = '가격은 0 이상의 정수';
if ($contact === '') $errors['contact'] = '연락 수단 필수';
if ($content === '' || mb_strlen($content) < 5) $errors['content'] = '내용은 5자 이상';

if ($errors) {
	if ($isJson) return respond_json(['error'=>['code'=>'VALIDATION_ERROR','fields'=>$errors],'_debug'=>['input'=>$input]], 422);
	// For form: log to console then show simple message
	echo "<!doctype html><meta charset='utf-8'><script>console.error('create:validation_error', " . json_encode($errors, JSON_UNESCAPED_UNICODE) . ", 'input', " . json_encode($input, JSON_UNESCAPED_UNICODE) . "); alert('입력 오류가 있습니다. 콘솔을 확인하세요.'); history.back();</script>";
	exit;
}

try {
	// TEMPORARY: Store password as plain text for debugging
	// TODO: Change back to password_hash() after testing
	$hash = $password; // Plain text storage (NOT SECURE - for testing only)
	$sql = "INSERT INTO posts (nickname,password_hash,title,author,subject,`condition`,price_won,contact,content)
				VALUES (?,?,?,?,?,?,?,?,?)";
	$stmt = $pdo->prepare($sql);
	$stmt->execute([$nickname,$hash,$title,$author,$subject,$condition,$price,$contact,$content]);
	$id = (int)$pdo->lastInsertId();
	if ($isJson) return respond_json(['ok'=>true,'id'=>$id,'_debug'=>['input'=>$input]], 201);
	// For form: redirect to main with success flag (absolute path to avoid subfolder issues)
	header('Location: /pages/index.html?created=1');
	exit;
} catch (Throwable $e) {
	if ($isJson) return respond_json(['error'=>['code'=>'SERVER_ERROR','message'=>'서버 오류'],'_debug'=>['exception'=>$e->getMessage()]], 500);
	echo "<!doctype html><meta charset='utf-8'><script>console.error('create:server_error', " . json_encode($e->getMessage(), JSON_UNESCAPED_UNICODE) . "); alert('서버 오류가 발생했습니다. 콘솔을 확인하세요.'); history.back();</script>";
	exit;
}
