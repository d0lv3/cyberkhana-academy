import React from 'react';
import { Check, Trash2, UserRound } from 'lucide-react';
import Avatar from '../ui/Avatar';
import CyberAvatar, { AVATAR_PRESETS, avatarValue } from '../ui/CyberAvatar';

interface AvatarPickerProps {
  /** Current selection: `avatar:<id>`, a photo URL, or '' for none. */
  value: string;
  onChange: (value: string) => void;
  /** Google's photo, if this account has one. Enables "use my photo". */
  googlePhotoUrl?: string;
  displayName: string;
  lang: 'en' | 'ar';
}

/**
 * Picture chooser for the profile editor.
 *
 * Every option is a tile in one grid — the photo sits alongside the built-ins
 * rather than behind a separate button, because "use my Google photo" and "use
 * the ghost one" are the same decision and belong in the same place. Removing
 * is the one action that is not a tile: it is a destructive verb, not another
 * picture, so it reads as a labelled control next to the preview.
 *
 * Selection only lifts state; the editor persists it on Save, so Cancel puts
 * the old picture back like every other field on the form.
 */
const AvatarPicker: React.FC<AvatarPickerProps> = ({
  value,
  onChange,
  googlePhotoUrl,
  displayName,
  lang,
}) => {
  const ar = lang === 'ar';
  const hasPhoto = Boolean(googlePhotoUrl);
  const photoSelected = Boolean(googlePhotoUrl) && value === googlePhotoUrl;

  const tileClass = (active: boolean) =>
    `group relative aspect-square overflow-hidden rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a859]/50 ${
      active
        ? 'border-[#00a859] ring-2 ring-[#00a859]/30'
        : 'border-[#263248] hover:border-[#3d4a63] hover:-translate-y-0.5'
    }`;

  const Tick = () => (
    <span className="absolute end-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00a859] text-white shadow">
      <Check size={11} strokeWidth={3} />
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Preview + the destructive action, kept out of the grid */}
      <div className="flex items-center gap-4">
        <Avatar
          avatarUrl={value}
          name={displayName}
          className="w-16 h-16 rounded-2xl"
          initialClassName="text-2xl"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#f3f6ff]">
            {ar ? 'صورتك' : 'Your picture'}
          </p>
          <p className="mt-0.5 text-xs text-[#8592ad]">
            {ar
              ? 'تظهر في ملفك الشخصي ولوحة المتصدرين.'
              : 'Shown on your profile and the leaderboard.'}
          </p>
        </div>
        {value !== '' && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#263248] px-2.5 py-1.5 touch:min-h-tap text-xs font-semibold text-[#8592ad] transition-colors hover:border-red-400/45 hover:text-red-400"
          >
            <Trash2 size={13} /> {ar ? 'إزالة' : 'Remove'}
          </button>
        )}
      </div>

      {/* Every choice, in one grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-7">
        {/* No picture — the initial, drawn the way it will actually appear */}
        <button
          type="button"
          onClick={() => onChange('')}
          aria-pressed={value === ''}
          title={ar ? 'بدون صورة' : 'No picture'}
          className={tileClass(value === '')}
        >
          <span className="flex h-full w-full items-center justify-center bg-[#0b1220] text-2xl font-black text-[#9fef00]">
            {(displayName || 'U').charAt(0).toUpperCase()}
          </span>
          {value === '' && <Tick />}
        </button>

        {/* Google's photo, when the account has one */}
        {hasPhoto && (
          <button
            type="button"
            onClick={() => onChange(googlePhotoUrl!)}
            aria-pressed={photoSelected}
            title={ar ? 'صورة Google' : 'Google photo'}
            className={tileClass(photoSelected)}
          >
            <img
              src={googlePhotoUrl}
              alt={ar ? 'صورة Google' : 'Google photo'}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/65 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#d2d7e3] backdrop-blur-sm">
              <UserRound size={9} /> {ar ? 'صورتي' : 'Photo'}
            </span>
            {photoSelected && <Tick />}
          </button>
        )}

        {AVATAR_PRESETS.map((preset) => {
          const presetValue = avatarValue(preset.id);
          const active = value === presetValue;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(presetValue)}
              aria-pressed={active}
              title={preset.label[lang]}
              className={tileClass(active)}
            >
              <CyberAvatar preset={preset} className="h-full w-full" />
              {active && <Tick />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AvatarPicker;
