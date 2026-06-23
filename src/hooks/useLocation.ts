import { useState, useCallback } from 'react';

export interface LocationState {
  lat: number | null;
  lng: number | null;
  capturedAt: string | null;
  loading: boolean;
  error: string | null;
}

export function useLocation(captureOnMount = true) {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    capturedAt: null,
    loading: captureOnMount,
    error: null,
  });

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, loading: false, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          capturedAt: new Date().toISOString(),
          loading: false,
          error: null,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location permission denied. Please enable location access and try again.',
          2: 'Location unavailable. Please check your GPS signal.',
          3: 'Location request timed out. Please try again.',
        };
        setState(s => ({
          ...s,
          loading: false,
          error: messages[err.code] ?? 'Failed to get location',
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, []);

  // Capture on first render if requested
  useState(() => {
    if (captureOnMount) capture();
  });

  return { ...state, retry: capture };
}
