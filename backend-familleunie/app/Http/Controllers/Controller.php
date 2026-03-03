<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Tontine Famille Unie API",
 *     version="1.0.0",
 *     description="API Laravel pour la gestion de la tontine Famille Unie",
 *     @OA\Contact(email="admin@familleunie.com")
 * )
 *
 * @OA\Server(
 *     url=L5_SWAGGER_CONST_HOST,
 *     description="Serveur local"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="Token",
 *     description="Entrez votre token Sanctum: Bearer {token}"
 * )
 */
abstract class Controller
{
}
