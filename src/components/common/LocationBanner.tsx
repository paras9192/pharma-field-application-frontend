import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import type { LocationState } from '@/hooks/useLocation';

interface LocationBannerProps {
  location: LocationState & { retry: () => void };
}

export function LocationBanner({ location }: LocationBannerProps) {
  if (location.loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
        <Loader2 size={13} className="animate-spin flex-shrink-0" />
        Getting your location…
      </div>
    );
  }

  if (location.error) {
    return (
      <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-amber-700 min-w-0">
          <AlertCircle size={13} className="flex-shrink-0" />
          <span className="truncate">{location.error}</span>
        </div>
        <button
          type="button"
          onClick={location.retry}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    );
  }

  if (location.lat && location.lng) {
    return (
      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2">
        <MapPin size={13} className="flex-shrink-0" />
        Location captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
      </div>
    );
  }

  return null;
}
