'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProfile, uploadProfileAvatar } from '@/lib/api';
import clsx from 'clsx';
import { Camera, Upload, User } from 'lucide-react';

const schema = z.object({
  id: z.string(),
  full_name: z.string().min(3),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(6).nullable().optional(),
});

export type ProfileFormValues = z.infer<typeof schema>;

interface Props {
  defaultValues: ProfileFormValues;
  avatarUrl?: string | null;
}

export function ProfileForm({ defaultValues, avatarUrl }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormValues>({ resolver: zodResolver(schema), defaultValues });

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  // Sync previewUrl when avatarUrl prop changes (e.g. after initial server load)
  useEffect(() => {
    if (avatarUrl) {
      setPreviewUrl(avatarUrl);
    }
  }, [avatarUrl]);

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadProfileAvatar(file);
      setPreviewUrl(res.avatar_full_url);
      setMessage('Photo de profil mise à jour.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de l’envoi.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile({ full_name: values.full_name, phone: values.phone ?? undefined });
      setMessage('Profil mis à jour avec succès.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="space-y-8">
      {/* ── Avatar Section ── */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative group">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-xl bg-bg-light flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-16 w-16 text-ink-light" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                <div className="h-8 w-8 border-4 border-white border-t-transparent animate-spin rounded-full"></div>
              </div>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 flex gap-2">
            <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 active:scale-95">
              <Upload className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" onChange={onAvatarChange} />
            </label>
            <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-secondary text-white shadow-lg transition hover:scale-105 active:scale-95">
              <Camera className="h-5 w-5" />
              <input type="file" className="hidden" accept="image/*" capture="user" onChange={onAvatarChange} />
            </label>
          </div>
        </div>
        <p className="text-xs font-bold text-ink-muted uppercase tracking-widest">Photo de profil</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="text-sm font-semibold text-ink-muted">Nom complet</label>
          <Input {...register('full_name')} placeholder="Nom complet" />
          {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-muted">Email</label>
          <Input {...register('email')} type="email" placeholder="Email" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-ink-muted">Téléphone</label>
          <Input {...register('phone')} placeholder="Téléphone" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        {message && (
          <p className={clsx('text-sm font-extrabold text-center rounded-2xl p-3 bg-bg shadow-inner',
            message.includes('succès') || message.includes('mise à jour') ? 'text-green-600' : 'text-red-500')}>
            {message}
          </p>
        )}
        <div className="pt-4">
          <Button type="submit" className="w-full py-6 text-lg" disabled={loading || uploading}>
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
