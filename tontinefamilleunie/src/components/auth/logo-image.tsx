'use client';

/**
 * Logo image with graceful fallback initials if /logo.png is missing.
 * Must be a Client Component because it uses the onError event handler.
 */
export function LogoImage() {
    return (
        <img
            src="/logo.png"
            alt="Logo Famille Unie"
            className="relative z-10 h-20 w-20 object-contain"
            onError={(e) => {
                // Hide the broken image — the parent already shows initials via CSS
                (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
        />
    );
}
