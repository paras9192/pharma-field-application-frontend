import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogOut, Lock, Shield, Phone, MapPin, Calendar, User as UserIcon,
  CheckCircle2, Circle, FileText, Upload, ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { useMyProfile, ME_QUERY_KEY, PROFILE_FIELD_LABELS } from '@/hooks/useMyProfile';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { CameraInput } from '@/components/common/CameraInput';
import { Skeleton } from '@/components/feedback/Skeleton';
import type { MyProfile, ProfileDocumentType, UpdateMePayload, Gender } from '@/types/api';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const phoneRe = /^\d{10}$/;
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().refine(v => !v || phoneRe.test(v), 'Enter a 10-digit phone'),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().max(255, 'Too long').optional(),
  bio: z.string().max(280, 'Max 280 characters').optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional().refine(v => !v || phoneRe.test(v), 'Enter a 10-digit phone'),
});
type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });
type PasswordData = z.infer<typeof passwordSchema>;

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(g => ({ value: g, label: g }));
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const KYC_DOCS: { type: ProfileDocumentType; label: string; field: keyof MyProfile }[] = [
  { type: 'aadhaar', label: 'Aadhaar', field: 'aadhaarUrl' },
  { type: 'pan', label: 'PAN', field: 'panUrl' },
  { type: 'tenth-marksheet', label: '10th Marksheet', field: 'tenthMarksheetUrl' },
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'purple', ADMIN: 'info', MR: 'success', SALES_PERSON: 'warning',
};

function apiErr(err: unknown, fallback: string) {
  return (err as AxiosError<{ error: { message: string } }>).response?.data?.error?.message || fallback;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { storeUser, setUser, logout, refreshToken } = useAuthStore(useShallow(s => ({
    storeUser: s.user,
    setUser: s.setUser,
    logout: s.logout,
    refreshToken: s.refreshToken,
  })));

  const { data: profile, isLoading } = useMyProfile();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Push freshly-saved profile into the cache + keep the header avatar/name in
  // sync (the auth store keeps `role` as a string, so only copy flat fields).
  const applyProfile = (p: MyProfile) => {
    queryClient.setQueryData(ME_QUERY_KEY, p);
    if (storeUser) {
      setUser({ ...storeUser, name: p.name, phone: p.phone, profilePhoto: p.profilePhoto, employeeCode: p.employeeCode });
    }
  };

  // ── Personal details form ──
  const formValues = useMemo<ProfileFormData>(() => ({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    dateOfBirth: profile?.dateOfBirth ?? '',
    gender: profile?.gender ?? '',
    bloodGroup: profile?.bloodGroup ?? '',
    address: profile?.address ?? '',
    bio: profile?.bio ?? '',
    emergencyContactName: profile?.emergencyContactName ?? '',
    emergencyContactPhone: profile?.emergencyContactPhone ?? '',
  }), [profile]);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: formValues,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMePayload) => usersApi.updateMe(data),
    onSuccess: (res) => { applyProfile(res.data.data); toast.success('Profile updated'); },
    onError: (err) => toast.error(apiErr(err, 'Failed to update profile')),
  });

  const onSaveProfile = (data: ProfileFormData) => {
    const payload: UpdateMePayload = {
      name: data.name,
      phone: data.phone || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: (data.gender || undefined) as Gender | undefined,
      bloodGroup: data.bloodGroup || undefined,
      address: data.address || undefined,
      bio: data.bio || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
    };
    updateMutation.mutate(payload);
  };

  // ── Photo upload ──
  const photoMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadPhoto(file),
    onSuccess: (res) => { applyProfile(res.data.data); toast.success('Photo updated'); },
    onError: (err) => toast.error(apiErr(err, 'Failed to upload photo')),
  });

  const handlePhoto = (file: File) => {
    if (file.size > MAX_FILE_SIZE) return toast.error('File must be under 10 MB');
    photoMutation.mutate(file);
  };

  // ── KYC document upload ──
  const docMutation = useMutation({
    mutationFn: ({ type, file }: { type: ProfileDocumentType; file: File }) => usersApi.uploadDocument(type, file),
    onSuccess: (res) => { applyProfile(res.data.data); toast.success('Document uploaded'); },
    onError: (err) => toast.error(apiErr(err, 'Failed to upload document')),
  });

  const handleDoc = (type: ProfileDocumentType, file: File) => {
    if (file.size > MAX_FILE_SIZE) return toast.error('File must be under 10 MB');
    docMutation.mutate({ type, file });
  };

  // ── Password ──
  const { register: regPwd, handleSubmit: submitPwd, reset: resetPwd, formState: { errors: pwdErrors } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordData) => usersApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => { toast.success('Password changed successfully!'); resetPwd(); setShowPasswordForm(false); },
    onError: (err) => toast.error(apiErr(err, 'Failed to change password')),
  });

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken ?? undefined); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const role = profile?.role.name ?? storeUser?.role;
  const missing = profile?.missingProfileFields ?? [];
  const requiredCount = Object.keys(PROFILE_FIELD_LABELS).length;
  const doneCount = requiredCount - missing.length;
  const pct = Math.round((doneCount / requiredCount) * 100);

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800">Settings</h2>

      {/* Profile header + photo */}
      <Card>
        <div className="flex items-center gap-4">
          {profile?.profilePhoto ? (
            <img src={profile.profilePhoto} alt={profile.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
          ) : (
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl">
              {(profile?.name ?? storeUser?.name)?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 truncate">{profile?.name ?? storeUser?.name}</div>
            <div className="text-sm text-slate-500 truncate">{profile?.email ?? storeUser?.email}</div>
            {role && (
              <Badge variant={roleColors[role] as 'purple' | 'info' | 'success' | 'warning'} className="mt-1">
                {role.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4">
          <div className="text-sm font-medium text-slate-700 mb-2">Profile photo</div>
          <CameraInput onCapture={handlePhoto} loading={photoMutation.isPending} />
        </div>
      </Card>

      {/* Completeness checklist */}
      {profile && !profile.profileComplete && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-700">Complete your profile</div>
            <span className="text-sm font-medium text-slate-500">{doneCount}/{requiredCount}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {Object.entries(PROFILE_FIELD_LABELS).map(([key, label]) => {
              const isMissing = missing.includes(key);
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  {isMissing
                    ? <Circle size={15} className="text-slate-300 flex-shrink-0" />
                    : <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />}
                  <span className={isMissing ? 'text-slate-500' : 'text-slate-400 line-through'}>{label}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Personal details */}
      <Card>
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
          <UserIcon size={16} /> Personal Details
        </div>

        {isLoading && !profile ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} height="h-11" rounded="rounded-xl" />)}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-3">
            <Input label="Full Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Phone" leftIcon={<Phone size={15} />} hint="10-digit number" error={errors.phone?.message} {...register('phone')} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Date of Birth" type="date" leftIcon={<Calendar size={15} />} error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
              <Select label="Gender" placeholder="Select" options={GENDERS} error={errors.gender?.message} {...register('gender')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select label="Blood Group" placeholder="Select" options={BLOOD_GROUPS} error={errors.bloodGroup?.message} {...register('bloodGroup')} />
              <Input label="Emergency Phone" error={errors.emergencyContactPhone?.message} {...register('emergencyContactPhone')} />
            </div>

            <Input label="Emergency Contact Name" error={errors.emergencyContactName?.message} {...register('emergencyContactName')} />
            <Input label="Address" leftIcon={<MapPin size={15} />} error={errors.address?.message} {...register('address')} />
            <Textarea label="Bio" hint="Max 280 characters" error={errors.bio?.message} {...register('bio')} />

            <Button type="submit" fullWidth loading={updateMutation.isPending} disabled={!isDirty}>
              Save Changes
            </Button>
          </form>
        )}
      </Card>

      {/* KYC documents */}
      <Card>
        <div className="flex items-center gap-2 font-semibold text-slate-700 mb-1">
          <FileText size={16} /> Documents (KYC)
        </div>
        <p className="text-xs text-slate-400 mb-3">Image or PDF, up to 10 MB each.</p>
        <div className="space-y-2">
          {KYC_DOCS.map(doc => (
            <DocumentRow
              key={doc.type}
              label={doc.label}
              url={profile?.[doc.field] as string | null | undefined}
              uploading={docMutation.isPending && docMutation.variables?.type === doc.type}
              disabled={docMutation.isPending}
              onPick={(file) => handleDoc(doc.type, file)}
            />
          ))}
        </div>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Lock size={16} /> Change Password
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(v => !v)}>
            {showPasswordForm ? 'Cancel' : 'Change'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={submitPwd(data => changePasswordMutation.mutate(data))} className="space-y-3 mt-3">
            <Input label="Current Password" type="password" required error={pwdErrors.currentPassword?.message} {...regPwd('currentPassword')} />
            <Input label="New Password" type="password" required hint="Min 8 chars, upper, lower, number" error={pwdErrors.newPassword?.message} {...regPwd('newPassword')} />
            <Input label="Confirm New Password" type="password" required error={pwdErrors.confirmPassword?.message} {...regPwd('confirmPassword')} />
            <Button type="submit" fullWidth loading={changePasswordMutation.isPending}>Update Password</Button>
          </form>
        )}
      </Card>

      {/* Account */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Shield size={15} /> Account
        </h3>
        <div className="space-y-2 text-sm text-slate-500">
          {profile?.employeeCode && <div>Employee Code: <strong className="text-slate-700">{profile.employeeCode}</strong></div>}
          <div>Role: <strong className="text-slate-700">{role?.replace('_', ' ')}</strong></div>
        </div>
      </Card>

      {/* Logout */}
      <Button variant="danger" fullWidth onClick={handleLogout}>
        <LogOut size={16} /> Sign Out
      </Button>

      <p className="text-center text-xs text-slate-400 pb-4">SRL PULSE v1.0 · Life is precious</p>
    </div>
  );
}

interface DocumentRowProps {
  label: string;
  url?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onPick: (file: File) => void;
}

function DocumentRow({ label, url, uploading, disabled, onPick }: DocumentRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = !!url;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${uploaded ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
        {uploaded ? <CheckCircle2 size={18} /> : <FileText size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {uploaded ? (
          <a href={url!} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1 hover:underline">
            View <ExternalLink size={11} />
          </a>
        ) : (
          <div className="text-xs text-slate-400">Not uploaded</div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ''; }}
      />
      <Button type="button" variant="outline" size="sm" disabled={disabled} loading={uploading} onClick={() => inputRef.current?.click()}>
        {!uploading && <Upload size={14} />} {uploaded ? 'Replace' : 'Upload'}
      </Button>
    </div>
  );
}
