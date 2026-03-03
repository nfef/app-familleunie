<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'interest',
        'due_date',
        'status',
        'paid_at',
        'meeting_id',
        'repayment_meeting_id',
    ];

    protected $appends = ['is_overdue'];

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === 'pending' && $this->due_date < date('Y-m-d');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
