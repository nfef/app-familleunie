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
        // Le mot de passe vient de ADMIN_SEED_PASSWORD (.env) ; à défaut, un mot de passe
        // aléatoire est généré et affiché une seule fois dans la console.
        $adminPassword = env('ADMIN_SEED_PASSWORD') ?: \Illuminate\Support\Str::password(16);

        User::updateOrCreate(
            ['email' => 'admin@familleunie.com'],
            [
                'full_name'            => 'Super Admin',
                'password'             => \Illuminate\Support\Facades\Hash::make($adminPassword),
                'roles'                => ['ADMIN', 'MEMBRE'],
                'phone'                => '+22500000000',
                'must_change_password' => true,
            ]
        );

        if (!env('ADMIN_SEED_PASSWORD')) {
            $this->command?->warn("Mot de passe admin généré (à noter, non récupérable ensuite) : {$adminPassword}");
        }

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
