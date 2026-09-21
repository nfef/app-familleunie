<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Model;

class Sanction extends Model
{
    use HasAuditTrail;

    protected $fillable = [
        'user_id',
        'meeting_id',
        'payment_meeting_id',
        'label',
        'amount',
        'status',
        'paid_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function meeting()
    {
        return $this->belongsTo(Meeting::class);
    }
}
