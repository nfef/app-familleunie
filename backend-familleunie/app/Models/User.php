<?php

namespace App\Models;

use App\Models\Concerns\HasAuditTrail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasAuditTrail;

    protected $fillable = [
        'full_name',
        'email',
        'username',
        'phone',
        'password',
        'roles',
        'member_status',
        'status_note',
        'avatar_url',
        'must_change_password',
    ];

    public const MEMBER_STATUSES = ['active', 'pause', 'exclu', 'demissionnaire'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = ['avatar_full_url'];

    public function getAvatarFullUrlAttribute(): ?string
    {
        if (!$this->avatar_url) {
            return null;
        }
        return url('storage/' . $this->avatar_url);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(ContributionSubscription::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('member_status', 'active');
    }

    public function isActiveMember(): bool
    {
        return $this->member_status === 'active';
    }

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'roles'                => 'array',
            'must_change_password' => 'boolean',
        ];
    }

    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles ?? []);
    }

    public function hasAnyRole(array $roles): bool
    {
        return !empty(array_intersect($roles, $this->roles ?? []));
    }
}
