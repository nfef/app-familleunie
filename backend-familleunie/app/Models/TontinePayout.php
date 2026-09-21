<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TontinePayout extends Model
{
    use HasAuditTrail;

    protected $fillable = [
        'beneficiary_id', 'meeting_id', 'contribution_type_id', 'amount', 'status', 'actual_payout_meeting_id',
    ];

    protected function casts(): array
    {
        return ['amount' => 'integer'];
    }

    public function beneficiary(): BelongsTo
    {
        return $this->belongsTo(User::class, 'beneficiary_id');
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    public function contributionType(): BelongsTo
    {
        return $this->belongsTo(ContributionType::class);
    }
}
