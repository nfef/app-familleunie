<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EventContribution extends Model
{
    use HasAuditTrail;

    protected $fillable = ['event_id', 'contributor_id', 'amount', 'paid_at', 'meeting_id'];

    protected function casts(): array
    {
        return ['amount' => 'integer', 'paid_at' => 'datetime'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'contributor_id');
    }
}
