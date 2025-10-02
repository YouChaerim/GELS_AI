<?php
// 데이터베이스 테스트 스크립트
require_once __DIR__ . '/config/db.php';

echo "<h1>데이터베이스 연결 테스트</h1>\n";

try {
    // 테이블 존재 확인
    echo "<h2>1. 테이블 존재 확인</h2>\n";
    $tables = $pdo->query("SHOW TABLES")->fetchAll();
    echo "<pre>";
    print_r($tables);
    echo "</pre>";
    
    // posts 테이블 구조 확인
    echo "<h2>2. posts 테이블 구조</h2>\n";
    try {
        $structure = $pdo->query("DESCRIBE posts")->fetchAll();
        echo "<pre>";
        print_r($structure);
        echo "</pre>";
    } catch (Exception $e) {
        echo "<p style='color: red;'>posts 테이블이 존재하지 않습니다: " . $e->getMessage() . "</p>";
    }
    
    // posts 테이블 데이터 개수 확인
    echo "<h2>3. posts 테이블 데이터 개수</h2>\n";
    try {
        $count = $pdo->query("SELECT COUNT(*) as count FROM posts")->fetch();
        echo "<p>총 게시글 수: " . $count['count'] . "</p>";
        
        if ($count['count'] > 0) {
            echo "<h2>4. 샘플 데이터 (최대 5개)</h2>\n";
            $samples = $pdo->query("SELECT * FROM posts LIMIT 5")->fetchAll();
            echo "<pre>";
            print_r($samples);
            echo "</pre>";
            
            echo "<h2>5. 과목별 통계</h2>\n";
            $subjects = $pdo->query("SELECT subject, COUNT(*) as count FROM posts GROUP BY subject ORDER BY count DESC")->fetchAll();
            echo "<pre>";
            print_r($subjects);
            echo "</pre>";
        }
    } catch (Exception $e) {
        echo "<p style='color: red;'>데이터 조회 실패: " . $e->getMessage() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>오류 발생: " . $e->getMessage() . "</p>";
}
?>
