import Link from 'next/link';

export const metadata = { title: 'Confirmez votre inscription | Tontine Famille Unie' };

type Props = {
  searchParams: { email?: string };
};

export default function SignupConfirmationPage({ searchParams }: Props) {
  const email = searchParams.email;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4 py-10 text-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand">Presque terminé</p>
        <h1 className="mt-3 text-3xl font-semibold">Confirmez votre adresse email</h1>
        <p className="mt-4 text-white/70">
          Nous venons d&apos;envoyer un lien d&apos;activation à {email ? <span className="font-semibold">{email}</span> : 'votre adresse email'}.
          Cliquez sur le bouton dans cette boîte de réception pour valider votre compte, puis connectez-vous.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left text-sm text-white/70">
        <p className="font-semibold text-white">Pas de mail reçu ?</p>
        <ul className="mt-3 space-y-2 list-disc pl-4">
          <li>Vérifiez vos dossiers spam ou promotions.</li>
          <li>Assurez-vous d&apos;avoir saisi la bonne adresse.</li>
          <li>Revenez à l&apos;inscription pour renvoyer un nouveau lien si nécessaire.</li>
        </ul>
      </div>

      <Link href="/login" className="text-sm text-brand underline-offset-4 hover:underline">
        Retourner à la page de connexion
      </Link>
    </main>
  );
}
