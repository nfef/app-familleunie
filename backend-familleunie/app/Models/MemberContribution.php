<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberContribution extends Model
{
    protected $fillable = [
        'user_id', 'contribution_type_id', 'meeting_id', 'collection_meeting_id',
        'parts', 'unit_amount', 'total_amount', 'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'parts' => 'float',
            'unit_amount' => 'integer',
            'total_amount' => 'integer'
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contributionType(): BelongsTo
    {
        return $this->belongsTo(ContributionType::class);
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }
}
