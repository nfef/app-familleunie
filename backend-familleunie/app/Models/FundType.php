<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FundType extends Model
{
    protected $fillable = ['label', 'target_amount', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'target_amount' => 'integer'];
    }

    public function fundEntries(): HasMany
    {
        return $this->hasMany(FundEntry::class);
    }
}
