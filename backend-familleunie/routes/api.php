<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\TontineController;
use App\Http\Controllers\SanctionController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AssociationConfigController;
use App\Http\Controllers\FinancialReportController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Tontine Famille Unie
|--------------------------------------------------------------------------
*/

// ── Public ────────────────────────────────────────────────────────────────
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:5,1');

// ── Authenticated ─────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'force.password.change'])->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // Profile
    Route::put('/profile',                 [MemberController::class, 'updateProfile']);
    Route::post('/profile/avatar',          [MemberController::class, 'updateAvatar']);
    Route::post('/profile/change-password', [AuthController::class, 'changePassword']);

    // Membres
    Route::get('/members',      [MemberController::class, 'index']);
    Route::get('/members/{id}', [MemberController::class, 'show']);

    // Cycles & Réunions
    Route::get('/cycles',      [MeetingController::class, 'cycles']);
    Route::post('/cycles',     [MeetingController::class, 'storeCycle']);
    Route::patch('/cycles/{id}', [MeetingController::class, 'updateCycle']);
    Route::get('/meetings',    [MeetingController::class, 'index']);
    Route::post('/meetings',   [MeetingController::class, 'store']);
    Route::delete('/meetings/{id}', [MeetingController::class, 'destroy']);

    // Cotisations
    Route::get('/contributions/me',           [ContributionController::class, 'myContributions']);
    Route::get('/funds/me',                   [ContributionController::class, 'myFunds']);
    Route::get('/contributions/summary',      [ContributionController::class, 'summary']);
    Route::get('/contributions/report/{id}', [ContributionController::class, 'meetingReport']);
    Route::post('/contributions',             [ContributionController::class, 'store']);
    Route::post('/fund-entries',              [ContributionController::class, 'storeFundEntry']);

    // Sanctions
    Route::get('/sanctions', [SanctionController::class, 'index']);
    Route::post('/sanctions', [SanctionController::class, 'store']);
    Route::patch('/sanctions/{id}/pay', [SanctionController::class, 'markAsPaid']);

    // Prêts (Loans)
    Route::get('/loans', [LoanController::class, 'index']);
    Route::post('/loans', [LoanController::class, 'store']);
    Route::patch('/loans/{id}/pay', [LoanController::class, 'markAsPaid']);

    // Rapports (Reports)
    Route::get('/reports/me',     [ReportController::class, 'myReport']);
    Route::get('/reports/yearly', [ReportController::class, 'yearly']);
    Route::get('/reports/member/{userId}', [ReportController::class, 'memberReport']);
    Route::get('/financial-reports',       [FinancialReportController::class, 'index']);
    Route::get('/financial-reports/{id}',  [FinancialReportController::class, 'show']);

    // Événements
    Route::get('/event-types',          [EventController::class, 'types']);
    Route::get('/events',               [EventController::class, 'index']);
    Route::post('/events',              [EventController::class, 'store']);
    Route::post('/event-contributions', [EventController::class, 'storeContribution']);

    // Tontine / Payouts
    Route::get('/payouts',                    [TontineController::class, 'index']);
    Route::post('/payouts',                   [TontineController::class, 'store']);
    Route::patch('/payouts/{id}/mark-paid',   [TontineController::class, 'markPaid']);

    // Admin & Management
    Route::get('/admin/dashboard',             [AdminController::class, 'dashboard']);
    Route::get('/admin/contribution-types',    [AdminController::class, 'contributionTypes']);
    Route::post('/admin/contribution-types',   [AdminController::class, 'storeContributionType']);
    Route::delete('/admin/contribution-types/{id}', [AdminController::class, 'deleteContributionType']);
    Route::get('/admin/fund-types',            [AdminController::class, 'fundTypes']);
    Route::post('/admin/fund-types',           [AdminController::class, 'storeFundType']);
    Route::delete('/admin/fund-types/{id}',    [AdminController::class, 'deleteFundType']);
    Route::post('/admin/members',              [AdminController::class, 'storeMember']);
    Route::patch('/admin/members/{id}',        [AdminController::class, 'updateMember']);
    Route::patch('/admin/members/{id}/roles',  [AdminController::class, 'updateMemberRoles']);
    Route::patch('/admin/members/{id}/reset-password', [AdminController::class, 'resetMemberPassword']);

    // Subscriptions (Who participates in what)
    Route::get('/members/{id}/subscriptions', [MemberController::class, 'subscriptions']);
    Route::post('/members/{id}/subscriptions', [MemberController::class, 'updateSubscriptions']);

    // Attendance (Présences)
    Route::get('/meetings/{id}/attendance', [AttendanceController::class, 'index']);
    Route::post('/meetings/{id}/attendance', [AttendanceController::class, 'store']);

    // Configs
    Route::get('/admin/configs', [AssociationConfigController::class, 'index']);
    Route::post('/admin/configs', [AssociationConfigController::class, 'store']);
});
