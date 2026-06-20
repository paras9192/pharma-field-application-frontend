import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, LogIn, LogOut, CalendarDays } from 'lucide-react';
import { attendanceApi } from '@/api/attendance';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ListSkeleton } from '@/components/feedback/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import type { Attendance, AttendanceStatus } from '@/types/api';
import { type AxiosError } from 'axios';

export default function AttendancePage() {
  const isAdmin = useAuthStore(s => s.isAdmin());
  const [tab, setTab] = useState<'today' | 'history'>(isAdmin ? 'history' : 'today');
  const [gettingLocation, setGettingLocation] = useState(false);
  const qc = useQueryClient();

  const todayQuery = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceApi.today(),
    select: r => r.data.data,
    enabled: !isAdmin,
  });

  const historyQuery = useQuery({
    queryKey: ['attendance', 'history'],
    queryFn: () => attendanceApi.my({ limit: 30 }),
    select: r => r.data,
  });

  const adminListQuery = useQuery({
    queryKey: ['attendance', 'list'],
    queryFn: () => attendanceApi.dailyPresent(),
    select: r => r.data.data,
    enabled: isAdmin,
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
      {!isAdmin && (
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
      )}

      {/* Today Tab */}
      {!isAdmin && tab === 'today' && (
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
                      {today.checkInAddress && (
                        <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                          <MapPin size={12} /> {today.checkInAddress}
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

      {/* History / Admin view */}
      {(isAdmin || tab === 'history') && (
        <div className="space-y-3">
          {isAdmin ? (
            adminListQuery.isLoading ? (
              <ListSkeleton />
            ) : !adminListQuery.data?.length ? (
              <EmptyState icon={<CalendarDays size={40} />} title="No one present today" />
            ) : (
              adminListQuery.data.map(att => <AttendanceCard key={att.id} att={att} showUser />)
            )
          ) : (
            historyQuery.isLoading ? (
              <ListSkeleton />
            ) : !historyQuery.data?.data?.length ? (
              <EmptyState icon={<CalendarDays size={40} />} title="No attendance records" />
            ) : (
              historyQuery.data.data.map(att => <AttendanceCard key={att.id} att={att} />)
            )
          )}
        </div>
      )}
    </div>
  );
}

function AttendanceCard({ att, showUser }: { att: Attendance; showUser?: boolean }) {
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between">
        <div>
          {showUser && (
            <div className="font-medium text-slate-800">{att.user.name}</div>
          )}
          <div className="text-sm text-slate-500">{dayjs(att.date).format('MMM D, YYYY')}</div>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><LogIn size={12} className="text-green-500" /> {att.checkInTime ? dayjs(att.checkInTime).format('h:mm A') : '—'}</span>
            <span className="flex items-center gap-1"><LogOut size={12} className="text-red-400" /> {att.checkOutTime ? dayjs(att.checkOutTime).format('h:mm A') : '—'}</span>
            {att.workingHours && <span className="flex items-center gap-1"><Clock size={12} /> {att.workingHours}h</span>}
          </div>
        </div>
        <AttendanceStatusBadge status={att.status} />
      </div>
    </Card>
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
