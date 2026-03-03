<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = [
        'member_id', 'event_type_id', 'occurred_on', 'custom_amount', 'status', 'note',
    ];

    protected function casts(): array
    {
        return ['occurred_on' => 'date', 'custom_amount' => 'integer'];
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    public function eventType(): BelongsTo
    {
        return $this->belongsTo(EventType::class);
    }

    public function contributions(): HasMany
    {
        return $this->hasMany(EventContribution::class);
    }
}
