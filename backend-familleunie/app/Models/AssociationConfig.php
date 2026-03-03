<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AssociationConfig extends Model
{
    protected $fillable = [
        'key', 'value', 'type', 'group', 'label',
    ];

    /**
     * Helper to get a config value
     */
    public static function get(string $key, $default = null)
    {
        $config = self::where('key', $key)->first();
        if (!$config) return $default;

        switch ($config->type) {
            case 'int':
            case 'integer':
                return (int) $config->value;
            case 'boolean':
            case 'bool':
                return filter_var($config->value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
            case 'array':
                return json_decode($config->value, true);
            default:
                return $config->value;
        }
    }

    public static function set(string $key, $value, string $type = 'string', string $group = 'general', string $label = null)
    {
        $val = is_array($value) ? json_encode($value) : (string) $value;
        return self::updateOrCreate(
            ['key' => $key],
            ['value' => $val, 'type' => $type, 'group' => $group, 'label' => $label]
        );
    }
}
