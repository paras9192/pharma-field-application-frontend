import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { attendanceApi } from '@/api/attendance';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { Attendance, AttendanceStatus } from '@/types/api';
import { type AxiosError } from 'axios';

// History defaults to the current month; admins get every user's records over
// the same range, everyone else is pinned to their own by the API.
const startOfMonth = () => dayjs().startOf('month').format('YYYY-MM-DD');
const todayStr = () => dayjs().format('YYYY-MM-DD');

const RANGE_PRESETS: { label: string; range: () => [string, string] }[] = [
  { label: 'This month', range: () => [startOfMonth(), todayStr()] },
  { label: 'Last 30 days', range: () => [dayjs().subtract(29, 'day').format('YYYY-MM-DD'), todayStr()] },
  { label: 'Last month', range: () => {
    const m = dayjs().subtract(1, 'month');
    return [m.startOf('month').format('YYYY-MM-DD'), m.endOf('month').format('YYYY-MM-DD')];
  } },
];

export default function AttendancePage() {
  const isAdmin = useAuthStore(s => s.isAdmin());
  const [tab, setTab] = useState<'today' | 'history'>('today');
  const [from, setFrom] = useState(startOfMonth);
  const [to, setTo] = useState(todayStr);
  const [gettingLocation, setGettingLocation] = useState(false);
  const qc = useQueryClient();

  const todayQuery = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.today(),
    select: r => r.data.data,
  });

  // One endpoint for every role: /attendance/list returns the whole company for
  // Admin/Super Admin and just the caller's own records for everyone else.
  const historyQuery = useQuery({
    queryKey: ['attendance', 'history', from, to],
    queryFn: () => attendanceApi.list({ from, to, limit: 100 }),
    select: r => r.data,
    enabled: tab === 'history',
  });

  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Checked in successfully!');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Check-in failed');
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Checked out successfully!');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Check-out failed');
    },
  });

  const getLocation = () => new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleCheckIn = async () => {
    setGettingLocation(true);
    try {
      const coords = await getLocation();
      await checkInMutation.mutateAsync({
        lat: coords.latitude,
        lng: coords.longitude,
        address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      });
    } catch {
      toast.error('Could not get location. Please enable GPS.');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCheckOut = async () => {
    setGettingLocation(true);
    try {
      const coords = await getLocation();
      await checkOutMutation.mutateAsync({
        lat: coords.latitude,
        lng: coords.longitude,
        address: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      });
    } catch {
      toast.error('Could not get location. Please enable GPS.');
    } finally {
      setGettingLocation(false);
    }
  };

  const today = todayQuery.data;
  const isBusy = gettingLocation || checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Attendance</h2>
        <p className="text-sm text-slate-400">{dayjs().format('dddd, MMMM D')}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['today', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Today Tab */}
      {tab === 'today' && (
        <div className="space-y-4">
          {todayQuery.isLoading ? (
            <ListSkeleton count={1} />
          ) : (
            <>
              {/* Check-in/out card */}
              <Card>
                <div className="text-center py-4">
                  {today ? (
                    <div className="space-y-3">
                      <AttendanceStatusBadge status={today.status} />
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-green-50 rounded-xl p-3">
                          <div className="text-green-600 font-medium flex items-center gap-1 justify-center">
                            <LogIn size={14} /> Check In
                          </div>
                          <div className="text-slate-800 font-semibold mt-1">
                            {today.checkInTime ? dayjs(today.checkInTime).format('h:mm A') : '—'}
                          </div>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3">
                          <div className="text-slate-500 font-medium flex items-center gap-1 justify-center">
                            <LogOut size={14} /> Check Out
                          </div>
                          <div className="text-slate-800 font-semibold mt-1">
                            {today.checkOutTime ? dayjs(today.checkOutTime).format('h:mm A') : '—'}
                          </div>
                        </div>
                      </div>
                      {today.workingHours && (
                        <div className="text-center text-sm text-slate-500">
                          <Clock size={14} className="inline mr-1" />
                          Working hours: <strong>{today.workingHours}h</strong>
                        </div>
                      )}
                      {(today.checkInAddress || today.checkOutAddress) && (
                        <div className="space-y-1 text-left">
                          <LocationLine label="In" address={today.checkInAddress} />
                          <LocationLine label="Out" address={today.checkOutAddress} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl mb-2">🏢</div>
                      <div className="font-semibold text-slate-700">Not checked in yet</div>
                      <div className="text-sm text-slate-400">Tap below to start your workday</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-3">
                  {!today ? (
                    <Button fullWidth loading={isBusy} onClick={handleCheckIn}>
                      <LogIn size={16} /> Check In
                    </Button>
                  ) : !today.checkOutTime ? (
                    <Button variant="danger" fullWidth loading={isBusy} onClick={handleCheckOut}>
                      <LogOut size={16} /> Check Out
                    </Button>
                  ) : (
                    <div className="text-center text-sm text-slate-500 py-2">
                      ✅ Workday complete
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* History — date-wise, all users for admins, own records for everyone else */}
      {tab === 'history' && (
        <div className="space-y-3">
          <Card padding="sm">
            <div className="flex gap-3">
              <Input
                label="From"
                type="date"
                value={from}
                max={to}
                onChange={e => setFrom(e.target.value)}
              />
              <Input
                label="To"
                type="date"
                value={to}
                min={from}
                max={todayStr()}
                onChange={e => setTo(e.target.value)}
              />
            </div>
            <div className="flex gap-2 mt-3">
              {RANGE_PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => { const [f, t] = p.range(); setFrom(f); setTo(t); }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {isAdmin && (
              <p className="text-xs text-slate-400 mt-3">Showing every employee's records for this range.</p>
            )}
          </Card>

          {historyQuery.isLoading ? (
            <ListSkeleton />
          ) : !historyQuery.data?.data?.length ? (
            <EmptyState icon={<CalendarDays size={40} />} title="No attendance records in this range" />
          ) : (
            historyQuery.data.data.map(att => (
              <AttendanceCard key={att.id} att={att} showUser={isAdmin} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AttendanceCard({ att, showUser }: { att: Attendance; showUser?: boolean }) {
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {showUser && (
            <div className="font-medium text-slate-800">{att.user.name}</div>
          )}
          <div className="text-sm text-slate-500">{dayjs(att.date).format('MMM D, YYYY')}</div>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><LogIn size={12} className="text-green-500" /> {att.checkInTime ? dayjs(att.checkInTime).format('h:mm A') : '—'}</span>
            <span className="flex items-center gap-1"><LogOut size={12} className="text-red-400" /> {att.checkOutTime ? dayjs(att.checkOutTime).format('h:mm A') : '—'}</span>
            {att.workingHours && <span className="flex items-center gap-1"><Clock size={12} /> {att.workingHours}h</span>}
          </div>
          {(att.checkInAddress || att.checkOutAddress) && (
            <div className="mt-2 space-y-1">
              <LocationLine label="In" address={att.checkInAddress} />
              <LocationLine label="Out" address={att.checkOutAddress} />
            </div>
          )}
        </div>
        <AttendanceStatusBadge status={att.status} />
      </div>
    </Card>
  );
}

/**
 * Where a check-in or check-out happened. The API only ever returns the
 * reverse-geocoded address — raw lat/lng are stripped from every response
 * server-side — so there is nothing to fall back to when it's missing.
 */
function LocationLine({ label, address }: { label: 'In' | 'Out'; address: string | null }) {
  if (!address) return null;
  return (
    <div className="flex items-start gap-1.5 text-xs text-slate-400">
      <MapPin size={12} className="mt-0.5 shrink-0" />
      <span className="min-w-0">
        <span className="font-medium text-slate-500">{label}:</span> {address}
      </span>
    </div>
  );
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const map: Record<AttendanceStatus, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
    PRESENT: { variant: 'success', label: 'Present' },
    HALF_DAY: { variant: 'warning', label: 'Half Day' },
    ABSENT: { variant: 'danger', label: 'Absent' },
    LEAVE: { variant: 'default', label: 'Leave' },
  };
  const { variant, label } = map[status] ?? { variant: 'default', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
