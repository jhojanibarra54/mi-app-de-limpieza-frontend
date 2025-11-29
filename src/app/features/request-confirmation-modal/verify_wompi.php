<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- CONFIGURACIÓN DE WOMPI ---
// ¡IMPORTANTE! Reemplaza estas llaves con las tuyas.
// Usa las llaves de PRUEBAS (test) mientras desarrollas.
$wompi_private_key_test = 'prv_test_xxxxxxxxxxxxxxxxxxxxxxxx';
$wompi_private_key_prod = 'prv_prod_xxxxxxxxxxxxxxxxxxxxxxxx';

// Cambia a 'prod' cuando pases a producción.
$environment = 'test';

$wompi_private_key = ($environment === 'test') ? $wompi_private_key_test : $wompi_private_key_prod;
$wompi_api_url = ($environment === 'test')
    ? 'https://sandbox.wompi.co/v1/transactions'
    : 'https://production.wompi.co/v1/transactions';
// --- FIN DE LA CONFIGURACIÓN ---


// Obtenemos los datos enviados desde la app Ionic
$data = json_decode(file_get_contents("php://input"));

// Verificamos que se haya enviado la referencia de pago
if (empty($data->reference)) {
    http_response_code(400); // Bad Request
    echo json_encode(["status" => "ERROR", "message" => "Falta la referencia de pago."]);
    exit();
}

$payment_reference = $data->reference;

// Construimos la URL para consultar la transacción en Wompi
$url_to_query = $wompi_api_url . '?reference=' . $payment_reference;

// Inicializamos cURL para hacer la petición a Wompi
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => $url_to_query,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        // Aquí usamos la llave PRIVADA para autenticarnos con Wompi.
        // Esto es lo que hace que la verificación sea segura.
        "Authorization: Bearer " . $wompi_private_key
    ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
    // Si hubo un error en la comunicación con Wompi
    http_response_code(500); // Internal Server Error
    echo json_encode(["status" => "ERROR", "message" => "Error de comunicación con Wompi: " . $err]);
    exit();
}

// Decodificamos la respuesta JSON de Wompi
$wompi_response = json_decode($response, true);

// Wompi devuelve un arreglo de transacciones en la propiedad 'data'.
// Normalmente solo habrá una, pero es bueno asegurarse.
if (isset($wompi_response['data']) && count($wompi_response['data']) > 0) {
    // Obtenemos la primera transacción del arreglo
    $transaction = $wompi_response['data'][0];

    // Obtenemos el estado final de la transacción
    $final_status = $transaction['status']; // Ej: "APPROVED", "DECLINED", "VOIDED", "ERROR"

    // Enviamos una respuesta simple a nuestra app Ionic con el estado
    http_response_code(200);
    echo json_encode(["status" => $final_status]);
} else {
    // Si Wompi no encontró ninguna transacción con esa referencia
    http_response_code(404); // Not Found
    echo json_encode(["status" => "NOT_FOUND", "message" => "No se encontró la transacción en Wompi."]);
}
?>