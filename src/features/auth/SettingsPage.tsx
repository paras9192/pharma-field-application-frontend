import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { LogOut, Lock, User, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useShallow } from 'zustand/react/shallow';
import { authApi } from '@/api/auth';
import { usersApi } from '@/api/users';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type PasswordData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout, refreshToken } = useAuthStore(useShallow(s => ({
    user: s.user,
    logout: s.logout,
    refreshToken: s.refreshToken,
  })));
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordData) => usersApi.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully!');
      reset();
      setShowPasswordForm(false);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    },
  });

  const handleLogout = async () => {
    try { await authApi.logout(refreshToken ?? undefined); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'purple',
    ADMIN: 'info',
    MR: 'success',
    SALES_PERSON: 'warning',
  };

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800">Settings</h2>

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            {user?.role && (
              <Badge variant={roleColors[user.role] as 'purple' | 'info' | 'success' | 'warning'} className="mt-1">
                {user.role.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 space-y-2 text-sm">
          {user?.employeeCode && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Employee Code</span>
              <span className="font-medium text-slate-800">{user.employeeCode}</span>
            </div>
          )}
          {user?.phone && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="font-medium text-slate-800">{user.phone}</span>
            </div>
          )}
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
          <form onSubmit={handleSubmit(data => changePasswordMutation.mutate(data))} className="space-y-3 mt-3">
            <Input label="Current Password" type="password" required error={errors.currentPassword?.message} {...register('currentPassword')} />
            <Input label="New Password" type="password" required hint="Min 8 chars, upper, lower, number" error={errors.newPassword?.message} {...register('newPassword')} />
            <Input label="Confirm New Password" type="password" required error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" fullWidth loading={changePasswordMutation.isPending}>Update Password</Button>
          </form>
        )}
      </Card>

      {/* Account Actions */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Shield size={15} /> Account
        </h3>
        <div className="space-y-2 text-sm text-slate-500">
          <div>Role: <strong>{user?.role?.replace('_', ' ')}</strong></div>
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
