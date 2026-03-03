<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meeting extends Model
{
    protected $fillable = ['cycle_id', 'meeting_date', 'notes'];

    protected function casts(): array
    {
        return ['meeting_date' => 'date'];
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(Cycle::class);
    }

    public function memberContributions(): HasMany
    {
        return $this->hasMany(MemberContribution::class);
    }

    public function tontinePayouts(): HasMany
    {
        return $this->hasMany(TontinePayout::class);
    }

    public function fundEntries(): HasMany
    {
        return $this->hasMany(FundEntry::class);
    }

    public function sanctions(): HasMany
    {
        return $this->hasMany(Sanction::class);
    }

    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    public function eventContributions(): HasMany
    {
        return $this->hasMany(EventContribution::class);
    }

    public function paidSanctions(): HasMany
    {
        return $this->hasMany(Sanction::class, 'payment_meeting_id');
    }

    public function repaidLoans(): HasMany
    {
        return $this->hasMany(Loan::class, 'repayment_meeting_id');
    }
}
