<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionSubscription extends Model
{
    protected $fillable = [
        'user_id', 
        'contribution_type_id', 
        'parts', 
        'is_active', 
        'suspension_reason'
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'parts' => 'float',
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
}
