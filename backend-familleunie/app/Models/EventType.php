<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventType extends Model
{
    use HasAuditTrail;

    protected $fillable = ['label', 'category', 'amount_mode', 'default_amount'];

    protected function casts(): array
    {
        return ['default_amount' => 'integer'];
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
