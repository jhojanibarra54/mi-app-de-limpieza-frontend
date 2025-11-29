<?php
// api/cleaner/get_bank_details.php

require_once '../../config/bootstrap.php';
require_once '../../vendor/autoload.php';
include_once '../../config/database.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

set_json_content_type();

try {
    $jwt = get_jwt_from_header();
    if (!$jwt) {
        throw new Exception("Token no proporcionado.");
    }

    $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
    $user_id = $decoded->data->id;

    if ($decoded->data->role !== 'cleaner') {
        throw new Exception("Acceso denegado.");
    }

    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT bank_name, account_type, account_number, account_holder_name, account_holder_id FROM user_bank_details WHERE user_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $bank_details = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($bank_details ?: null); // Devuelve null si no hay datos

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al obtener los datos bancarios.", "error" => $e->getMessage()]);
}
?>