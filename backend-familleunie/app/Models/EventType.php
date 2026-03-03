<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventType extends Model
{
    protected $fillable = ['label', 'default_amount'];

    protected function casts(): array
    {
        return ['default_amount' => 'integer'];
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
