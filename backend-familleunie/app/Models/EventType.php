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

    /**
     * Part attendue par membre pour ce type d'événement.
     * - envelope   : $baseAmount (par défaut default_amount) divisé par le nombre de membres actifs
     * - per_member : $baseAmount tel quel
     */
    public function computeShare(int $activeMembersCount, ?int $baseAmount = null): int
    {
        $amount = $baseAmount ?? $this->default_amount;

        return ($this->amount_mode === 'envelope' && $activeMembersCount > 0)
            ? (int) round($amount / $activeMembersCount)
            : $amount;
    }
}
