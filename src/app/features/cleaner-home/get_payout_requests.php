<?php
// api/admin/get_payout_requests.php

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../vendor/autoload.php';
include_once __DIR__ . '/../../config/database.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

set_json_content_type();

try {
    $jwt = get_jwt_from_header();
    if (!$jwt) {
        throw new Exception("Token no proporcionado.");
    }

    $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));

    if ($decoded->data->role !== 'admin') {
        throw new Exception("Acceso denegado.");
    }

    $database = new Database();
    $db = $database->getConnection();

    // Obtenemos las solicitudes pendientes y unimos con la tabla de usuarios para obtener el nombre
    $query = "
        SELECT pr.id, pr.user_id, pr.amount, pr.status, pr.bank_details_snapshot, pr.created_at, u.name as cleaner_name
        FROM payout_requests pr
        JOIN users u ON pr.user_id = u.id
        WHERE pr.status = 'pending'
        ORDER BY pr.created_at ASC
    ";
    $stmt = $db->prepare($query);
    $stmt->execute();

    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($requests);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener las solicitudes de retiro.", "error" => $e->getMessage()]);
}
?>