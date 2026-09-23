<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    use HasAuditTrail;

    protected $fillable = [
        'user_id',
        'parent_loan_id',
        'contracted_at',
        'amount',
        'interest',
        'repaid_amount',
        'due_date',
        'status',
        'paid_at',
        'meeting_id',
        'repayment_meeting_id',
    ];

    protected $appends = ['is_overdue'];

    protected function casts(): array
    {
        return [
            'contracted_at' => 'date:Y-m-d',
        ];
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'pending' && $this->due_date < date('Y-m-d');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'parent_loan_id');
    }

    public function renewals(): HasMany
    {
        return $this->hasMany(Loan::class, 'parent_loan_id');
    }
}
