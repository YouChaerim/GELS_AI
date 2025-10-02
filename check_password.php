<?php
// 비밀번호 확인 도구
require_once __DIR__ . '/config/db.php';

$id = $_GET['id'] ?? 1; // 게시글 ID

try {
    $stmt = $pdo->prepare('SELECT id, title, nickname, password_hash FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    
    if ($post) {
        echo "<h2>게시글 ID: {$post['id']}</h2>";
        echo "<h3>제목: {$post['title']}</h3>";
        echo "<h3>작성자: {$post['nickname']}</h3>";
        echo "<h3>저장된 비밀번호:</h3>";
        echo "<p style='background: #f0f0f0; padding: 10px; font-family: monospace;'>";
        echo htmlspecialchars($post['password_hash']);
        echo "</p>";
        echo "<p>길이: " . strlen($post['password_hash']) . " 문자</p>";
        
        $isHashed = strpos($post['password_hash'], '$2y$') === 0;
        echo "<p>해시 여부: " . ($isHashed ? '<strong style="color: green;">해시됨</strong>' : '<strong style="color: red;">평문</strong>') . "</p>";
        
        if (!$isHashed) {
            echo "<p style='color: red;'><strong>실제 비밀번호: {$post['password_hash']}</strong></p>";
        }
        
        echo "<hr>";
        echo "<h3>테스트:</h3>";
        echo "<form method='post'>";
        echo "<input type='hidden' name='id' value='{$post['id']}'>";
        echo "<input type='text' name='test_password' placeholder='비밀번호 입력' style='padding: 5px;'>";
        echo "<button type='submit' style='padding: 5px 10px;'>테스트</button>";
        echo "</form>";
        
        if ($_POST['test_password'] ?? false) {
            $testPw = $_POST['test_password'];
            echo "<h4>테스트 결과:</h4>";
            echo "<p>입력한 비밀번호: <code>{$testPw}</code></p>";
            
            if ($isHashed) {
                $match = password_verify($testPw, $post['password_hash']);
                echo "<p>password_verify 결과: " . ($match ? '<strong style="color: green;">일치</strong>' : '<strong style="color: red;">불일치</strong>') . "</p>";
            } else {
                $match = ($testPw === $post['password_hash']);
                echo "<p>평문 비교 결과: " . ($match ? '<strong style="color: green;">일치</strong>' : '<strong style="color: red;">불일치</strong>') . "</p>";
            }
        }
        
    } else {
        echo "<p style='color: red;'>게시글을 찾을 수 없습니다.</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>오류: " . $e->getMessage() . "</p>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
code { background: #f5f5f5; padding: 2px 4px; }
</style>

