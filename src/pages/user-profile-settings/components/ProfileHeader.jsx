// src/pages/user-profile-settings/components/ProfileHeader.jsx
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const MAX_MB = 5;
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatCurrencyFromCents(amountCents) {
  return `$${(Number(amountCents || 0) / 100).toFixed(2)}`;
}

const ProfileHeader = ({ user, onImageUpload }) => {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const profileStats = [
    {
      label: 'Dispensados',
      value: `${Number(user?.totalLitersDispensed || 0).toFixed(0)}L`,
      icon: 'Droplets',
      accent: 'text-sky-700',
      chip: 'bg-sky-100',
    },
    {
      label: 'Saldo extra',
      value: formatCurrencyFromCents(user?.totalBonusEarnedCents),
      icon: 'Gift',
      accent: 'text-emerald-700',
      chip: 'bg-emerald-100',
    },
    {
      label: 'Transacciones',
      value: Number(user?.transactionCount || 0),
      icon: 'Receipt',
      accent: 'text-indigo-700',
      chip: 'bg-indigo-100',
    },
  ];

  const handleImageUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    // Validaciones básicas
    if (!VALID_TYPES.includes(file.type)) {
      window.showToast?.('Solo JPG, PNG o WEBP.', 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      window.showToast?.(`Máximo ${MAX_MB} MB.`, 'error');
      return;
    }

    try {
      setIsImageUploading(true);
      await onImageUpload?.(file); // el padre hace el upload real a Clerk
      window.showToast?.('Foto de perfil actualizada correctamente', 'success');
    } catch (e) {
      window.showToast?.(e?.message || 'No se pudo actualizar la foto', 'error');
    } finally {
      setIsImageUploading(false);
      // Limpia el input para poder re-subir el mismo archivo si se quiere
      event.target.value = '';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_34%),linear-gradient(135deg,_#f7fbff_0%,_#eef7ff_45%,_#f9fdff_100%)] p-6 mb-6 shadow-[0_20px_60px_rgba(30,64,175,0.08)]">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden bg-white border-4 border-white shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <Image
              src={user?.profileImage}
              alt={`Foto de perfil de ${user?.name}`}
              className="w-full h-full object-cover"
            />
          </div>

            <label className="absolute -bottom-2 -right-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isImageUploading}
              />
              <div
                className={`
                  w-11 h-11 rounded-2xl bg-[#1E3F7A] text-white flex items-center justify-center
                  shadow-[0_10px_24px_rgba(30,63,122,0.35)] transition-all duration-200
                  ${isImageUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:bg-[#17325f]'}
                `}
              >
                {isImageUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon name="Camera" size={16} />
                )}
              </div>
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm">
              <Icon name="Sparkles" size={14} />
              Tu cuenta
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{user?.name}</h1>
            <p className="mt-2 text-lg text-slate-700">{user?.email}</p>
            <p className="mt-1 text-sm text-slate-500">Miembro desde {user?.memberSince}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-3 sm:justify-start">
              {profileStats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[132px] rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${stat.chip}`}>
                      <Icon name={stat.icon} size={15} className={stat.accent} />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {stat.label}
                    </span>
                  </div>
                  <p className={`mt-2 text-2xl font-black ${stat.accent}`}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[1.75rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur sm:max-w-[320px]">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Dias contigo</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{Number(user?.membershipDays || 0)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Puntos del mes</p>
            <p className="mt-2 text-2xl font-black text-sky-700">{user?.monthlyProgress?.points || 0}</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-[linear-gradient(135deg,_#1e3f7a_0%,_#42b9d4_100%)] p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80">Nivel actual</p>
            <p className="mt-2 text-lg font-black">{user?.monthlyProgress?.pointsLabel || 'Sin beneficio'}</p>
            <p className="mt-1 text-sm text-white/80">
              Asi va tu progreso de recompensas este mes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
