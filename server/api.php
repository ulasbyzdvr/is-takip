<?php
/**
 * İş Takip Uygulaması - Sunucu API
 * 
 * Kurulum:
 * 1. Bu dosyayı web hosting sunucunuzda bir klasöre yükleyin (örn: is-takip/api.php)
 * 2. Aşağıdaki API_KEY değerini güvenli bir anahtarla değiştirin
 * 3. data.json dosyasının yazılabilir olduğundan emin olun (chmod 666)
 * 4. Uygulamada sunucu URL'sini ve API anahtarını girin
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS isteğini handle et (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// API Anahtarı
define('API_KEY', 'O52E7jC7RyuCEjtkKw19KYW7YHTVvhBc');

// Veri dosyası yolu
define('DATA_FILE', __DIR__ . '/data.json');

// Hata mesajı fonksiyonu
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'message' => $message
    ]);
    exit();
}

// Başarı mesajı fonksiyonu
function sendSuccess($data = null, $message = 'İşlem başarılı') {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

// API anahtarı kontrolü
$apiKey = isset($_GET['api_key']) ? $_GET['api_key'] : (isset($_POST['api_key']) ? $_POST['api_key'] : null);
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['api_key'])) {
        $apiKey = $input['api_key'];
    }
}

if ($apiKey !== API_KEY) {
    sendError('Geçersiz API anahtarı', 401);
}

// İşlem tipini al
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : null);
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['action'])) {
        $action = $input['action'];
    }
}

if (!$action) {
    sendError('İşlem tipi belirtilmedi');
}

// Veri dosyasını oku
function readData() {
    if (!file_exists(DATA_FILE)) {
        return [
            'companies' => [],
            'works' => []
        ];
    }
    
    $content = file_get_contents(DATA_FILE);
    if ($content === false) {
        return [
            'companies' => [],
            'works' => []
        ];
    }
    
    $data = json_decode($content, true);
    if ($data === null) {
        return [
            'companies' => [],
            'works' => []
        ];
    }
    
    return [
        'companies' => isset($data['companies']) ? $data['companies'] : [],
        'works' => isset($data['works']) ? $data['works'] : []
    ];
}

// Veri dosyasına yaz
function writeData($companies, $works) {
    $data = [
        'companies' => $companies,
        'works' => $works,
        'last_updated' => date('Y-m-d H:i:s')
    ];
    
    $result = file_put_contents(DATA_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        sendError('Veri kaydedilemedi. Dosya yazma izinlerini kontrol edin.');
    }
    
    return true;
}

// Smart Merge: Timestamp bazlı çakışma çözümü (İki telefon desteği)
function smartMerge($serverItems, $clientItems) {
    $merged = [];
    
    // ID'ye göre index oluştur
    $serverMap = [];
    foreach ($serverItems as $item) {
        $serverMap[$item['id']] = $item;
    }
    
    $clientMap = [];
    foreach ($clientItems as $item) {
        $clientMap[$item['id']] = $item;
    }
    
    // Tüm unique ID'leri topla
    $allIds = array_unique(array_merge(array_keys($serverMap), array_keys($clientMap)));
    
    foreach ($allIds as $id) {
        $serverItem = isset($serverMap[$id]) ? $serverMap[$id] : null;
        $clientItem = isset($clientMap[$id]) ? $clientMap[$id] : null;
        
        if ($serverItem && $clientItem) {
            // Her iki tarafta da var - updatedAt'e göre karar ver
            $serverUpdatedAt = isset($serverItem['updatedAt']) ? $serverItem['updatedAt'] : $serverItem['createdAt'];
            $clientUpdatedAt = isset($clientItem['updatedAt']) ? $clientItem['updatedAt'] : $clientItem['createdAt'];
            
            // En yeni olanı al
            if (strtotime($clientUpdatedAt) > strtotime($serverUpdatedAt)) {
                $merged[] = $clientItem;
            } else {
                $merged[] = $serverItem;
            }
        } else if ($clientItem) {
            // Sadece client'ta var - client'ı al
            $merged[] = $clientItem;
        } else if ($serverItem) {
            // Sadece sunucuda var - sunucuyu al
            $merged[] = $serverItem;
        }
    }
    
    return $merged;
}

// İşlemleri handle et
switch ($action) {
    case 'upload':
        // POST isteği ile veri yükle
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['companies']) || !isset($input['works'])) {
            sendError('Eksik veri');
        }
        
        $clientCompanies = $input['companies'];
        $clientWorks = $input['works'];
        
        // Sunucudaki mevcut verileri oku
        $serverData = readData();
        
        // SMART MERGE: Timestamp bazlı çakışma çözümü (İki telefon desteği)
        $mergedCompanies = smartMerge($serverData['companies'], $clientCompanies);
        $mergedWorks = smartMerge($serverData['works'], $clientWorks);
        
        // Birleştirilmiş verileri kaydet
        writeData($mergedCompanies, $mergedWorks);
        
        sendSuccess([
            'companies' => $mergedCompanies,
            'works' => $mergedWorks
        ], 'Veriler başarıyla senkronize edildi');
        break;
        
    case 'download':
        // GET isteği ile veri indir
        $data = readData();
        sendSuccess($data, 'Veriler başarıyla indirildi');
        break;
        
    default:
        sendError('Geçersiz işlem tipi');
        break;
}
?>

