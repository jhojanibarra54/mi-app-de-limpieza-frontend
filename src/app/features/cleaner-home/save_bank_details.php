<?php
// api/cleaner/save_bank_details.php

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

    $data = json_decode(file_get_contents("php://input"));

    // Validación simple de datos
    if (empty($data->bank_name) || empty($data->account_type) || empty($data->account_number) || empty($data->account_holder_name) || empty($data->account_holder_id)) {
        throw new Exception("Todos los campos son obligatorios.");
    }

    $database = new Database();
    $db = $database->getConnection();

    // Usamos INSERT ... ON DUPLICATE KEY UPDATE para crear o actualizar
    // Esto requiere que la columna `user_id` en `user_bank_details` sea UNIQUE
    $query = "
        INSERT INTO user_bank_details (user_id, bank_name, account_type, account_number, account_holder_name, account_holder_id)
        VALUES (:user_id, :bank_name, :account_type, :account_number, :account_holder_name, :account_holder_id)
        ON DUPLICATE KEY UPDATE
            bank_name = VALUES(bank_name),
            account_type = VALUES(account_type),
            account_number = VALUES(account_number),
            account_holder_name = VALUES(account_holder_name),
            account_holder_id = VALUES(account_holder_id)
    ";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':bank_name', $data->bank_name);
    $stmt->bindParam(':account_type', $data->account_type);
    $stmt->bindParam(':account_number', $data->account_number);
    $stmt->bindParam(':account_holder_name', $data->account_holder_name);
    $stmt->bindParam(':account_holder_id', $data->account_holder_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Datos bancarios guardados con éxito."]);
    } else {
        throw new Exception("No se pudieron guardar los datos bancarios.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error al guardar los datos.", "error" => $e->getMessage()]);
}
?>