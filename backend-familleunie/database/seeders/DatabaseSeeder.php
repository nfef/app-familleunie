<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Créer l'Administrateur principal
        User::updateOrCreate(
            ['email' => 'admin@familleunie.com'],
            [
                'full_name' => 'Super Admin',
                'password'  => \Illuminate\Support\Facades\Hash::make('password'),
                'roles'     => ['ADMIN', 'MEMBRE'],
                'phone'     => '+22500000000',
            ]
        );

        // Créer un cycle par défaut si aucun n'existe
        if (\App\Models\Cycle::count() === 0) {
            \App\Models\Cycle::create([
                'label'      => 'Saison ' . date('Y'),
                'start_date' => date('Y-m-d'),
                'is_active'  => true,
            ]);
        }

        // Types de caisse par défaut
        foreach (['Assurance', 'Fonds de caisse'] as $label) {
            \App\Models\FundType::updateOrCreate(
                ['label' => $label],
                ['is_active' => true]
            );
        }
    }
}
