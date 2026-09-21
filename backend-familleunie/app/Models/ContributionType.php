<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContributionType extends Model
{
    use HasAuditTrail;

    protected $fillable = ['label', 'amount', 'frequency', 'has_parts', 'is_mandatory', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'has_parts' => 'boolean',
            'is_mandatory' => 'boolean',
            'amount' => 'integer',
        ];
    }

    public function memberContributions(): HasMany
    {
        return $this->hasMany(MemberContribution::class);
    }
}
