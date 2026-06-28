import { useState } from 'react';
import { BACKEND_ORIGIN } from '@/api/axios';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  /** Sizing + rounding for the avatar, e.g. "w-8 h-8 rounded-full". */
  className?: string;
  /** Background + text colour for the initials fallback. */
  fallbackClassName?: string;
}

function resolveUrl(src?: string | null): string | null {
  if (!src) return null;
  // profilePhoto may be a full URL (cloud storage) or a path served by the API.
  if (/^(https?:|data:|blob:)/.test(src)) return src;
  return `${BACKEND_ORIGIN}${src}`;
}

export function Avatar({
  name,
  src,
  className = 'w-10 h-10 rounded-full',
  fallbackClassName = 'bg-blue-100 text-blue-600',
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const url = !failed ? resolveUrl(src) : null;
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'avatar'}
        onError={() => setFailed(true)}
        className={`${className} object-cover bg-slate-100`}
      />
    );
  }

  return (
    <div className={`${className} ${fallbackClassName} flex items-center justify-center font-semibold`}>
      {initial}
    </div>
  );
}
