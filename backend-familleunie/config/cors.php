<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Ce backend est appelé par un ou plusieurs frontends hébergés sur des
    | domaines distincts (app membres, back-office admin). CORS_ALLOWED_ORIGINS
    | doit lister ces domaines en production (jamais "*" une fois des cookies
    | ou credentials impliqués).
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', ''))
    ))) ?: ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
