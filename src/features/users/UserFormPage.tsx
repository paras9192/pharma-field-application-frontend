import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, AlertTriangle } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ROLE_OPTIONS, ROLE_SHORT_LABELS, canHaveManager, managerRolesFor } from '@/utils/roles';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import type { Role, User } from '@/types/api';

const ROLE_VALUES = ['SUPER_ADMIN', 'ADMIN', 'ZSM', 'ASM', 'MR', 'SALES_PERSON'] as const;

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  role: z.enum(ROLE_VALUES),
  managerId: z.string().optional(),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  role: z.enum(ROLE_VALUES),
  managerId: z.string().optional(),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

function apiMessage(err: AxiosError<{ error: { message: string } }>, fallback: string) {
  return err.response?.data?.error?.message || fallback;
}

/**
 * Eligible managers for the role currently picked in the form. The backend rejects
 * an MR under an MR, an ASM under an ASM, and any manager on a ZSM/Admin — so the
 * options are narrowed to what it will accept, and only active users are offered.
 * `excludeId` keeps a user from being offered as their own manager.
 */
function useEligibleManagers(role: Role, excludeId?: string, currentManager?: User['manager']) {
  const roles = managerRolesFor(role);

  const results = useQueries({
    queries: roles.map(r => ({
      queryKey: ['users', 'managers', r],
      queryFn: () => usersApi.list({ role: r, isActive: 'true', limit: 100 }),
      select: (res: { data: { data: User[] } }) => res.data.data,
      staleTime: 60_000,
    })),
  });

  // Only the first page of each manager role is fetched. Seed the user's existing
  // manager so that in a large org they can't be pushed off the list and then get
  // treated as invalid — that would silently clear a reporting line that was fine.
  const seed = currentManager && roles.includes(currentManager.role.name) ? [currentManager] : [];

  const byId = new Map<string, { id: string; name: string; role: { name: Role } }>();
  for (const m of [...seed, ...results.flatMap(r => r.data ?? [])]) {
    if (m.id !== excludeId) byId.set(m.id, m);
  }

  return {
    options: [...byId.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(m => ({
        value: m.id,
        label: `${m.name} · ${ROLE_SHORT_LABELS[m.role.name]}`,
      })),
    isLoading: results.some(r => r.isLoading),
  };
}

/**
 * Role + manager pair, shared by the create and edit forms. Controlled rather than
 * registered, so one component can serve both form shapes without casting.
 */
function RoleAndManagerFields({
  role, managerId, onRoleChange, onManagerChange, roleError, excludeId, currentManager,
}: {
  role: Role;
  managerId: string;
  onRoleChange: (role: Role) => void;
  onManagerChange: (managerId: string) => void;
  roleError?: string;
  excludeId?: string;
  currentManager?: User['manager'];
}) {
  const showManager = canHaveManager(role);
  const { options, isLoading } = useEligibleManagers(role, excludeId, currentManager);

  // Changing the role can invalidate the manager already picked — an MR under an ASM
  // who gets promoted to ASM, say, since an ASM can't report to an ASM. Drop the
  // stale selection so we never submit a pairing the backend would reject.
  const managerIsValid = options.some(o => o.value === managerId);
  useEffect(() => {
    if (isLoading) return;
    if (!managerId) return; // nothing to clear — and re-clearing would loop
    if (!showManager || !managerIsValid) onManagerChange('');
  }, [managerId, showManager, managerIsValid, isLoading, onManagerChange]);

  return (
    <>
      <Select
        label="Role"
        required
        options={ROLE_OPTIONS}
        error={roleError}
        value={role}
        onChange={e => onRoleChange(e.target.value as Role)}
      />

      {showManager && (
        <Select
          label="Reports To"
          placeholder={isLoading ? 'Loading managers…' : 'No manager'}
          options={options}
          value={managerId}
          onChange={e => onManagerChange(e.target.value)}
          hint={
            role === 'ASM'
              ? 'An ASM reports to a ZSM.'
              : 'An MR or Sales Person reports to an ASM or a ZSM.'
          }
        />
      )}
    </>
  );
}

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const currentUserRole = useAuthStore(s => s.user?.role);

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    select: r => r.data.data,
    enabled: isEdit,
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'MR', managerId: '' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: 'MR', managerId: '' },
  });

  useEffect(() => {
    if (user && isEdit) {
      editForm.reset({
        name: user.name,
        phone: user.phone,
        role: user.role.name,
        managerId: user.managerId ?? '',
        employeeCode: user.employeeCode ?? '',
        dateOfJoining: user.dateOfJoining ? user.dateOfJoining.split('T')[0] : '',
      });
    }
  }, [user, isEdit, editForm]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) => usersApi.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role: data.role,
      managerId: canHaveManager(data.role) ? (data.managerId || undefined) : undefined,
      employeeCode: data.employeeCode || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created!');
      navigate(`/users/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = apiMessage(err, 'Failed to create user');
      setFormError(msg);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => usersApi.update(id!, {
      name: data.name,
      phone: data.phone,
      role: data.role,
      // Explicit null clears the manager; omitted entirely for roles that cannot
      // have one, which the backend clears on its own when the rank changes.
      ...(canHaveManager(data.role) ? { managerId: data.managerId || null } : {}),
      employeeCode: data.employeeCode || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
    }),
    onSuccess: () => {
      // A role change can silently clear managerId server-side, so never trust the
      // local copy — refetch and let the detail page render what actually stuck.
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['users', 'managers'] });
      toast.success('User updated!');
      navigate(`/users/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      // Covers "Reassign this user's direct reports before changing their role."
      // A toast alone is too easy to miss for something that needs a follow-up action.
      const msg = apiMessage(err, 'Failed to update');
      setFormError(msg);
      toast.error(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => usersApi.resetPassword(id!, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setNewPassword('');
      setPasswordError('');
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = apiMessage(err, 'Failed to reset password');
      if (err.response?.status === 403) toast.error(msg);
      else setPasswordError(msg);
    },
  });

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8 || newPassword.length > 64) {
      setPasswordError('Password must be 8–64 characters');
      return;
    }
    setPasswordError('');
    resetPasswordMutation.mutate();
  };

  const errorBanner = formError && (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5">
      <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-700">{formError}</p>
    </div>
  );

  if (isEdit) {
    const { register, handleSubmit, watch, setValue, formState: { errors } } = editForm;
    const canResetPassword = currentUserRole === 'SUPER_ADMIN' ||
      (currentUserRole === 'ADMIN' && user?.role?.name !== 'SUPER_ADMIN');

    return (
      <div className="p-4 max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
        <Card>
          <form
            onSubmit={handleSubmit(data => { setFormError(''); updateMutation.mutate(data); })}
            className="space-y-4"
          >
            {errorBanner}
            <Input label="Full Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} />
            <RoleAndManagerFields
              role={watch('role')}
              managerId={watch('managerId') ?? ''}
              onRoleChange={r => setValue('role', r)}
              onManagerChange={m => setValue('managerId', m)}
              roleError={errors.role?.message}
              excludeId={id}
              currentManager={user?.manager}
            />
            <Input label="Employee Code" placeholder="EMP001" {...register('employeeCode')} />
            <Input label="Date of Joining" type="date" {...register('dateOfJoining')} />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" fullWidth loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Card>

        {canResetPassword && (
          <Card>
            <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <KeyRound size={15} /> Reset Password
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <Input
                label="New Password"
                type="password"
                required
                placeholder="Min 8 characters"
                hint="8–64 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                error={passwordError}
              />
              <Button type="submit" variant="outline" fullWidth loading={resetPasswordMutation.isPending}>
                Reset Password
              </Button>
            </form>
          </Card>
        )}
      </div>
    );
  }

  const { register, handleSubmit, watch, setValue, formState: { errors } } = createForm;
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Add User</h2>
      <Card>
        <form
          onSubmit={handleSubmit(data => { setFormError(''); createMutation.mutate(data); })}
          className="space-y-4"
        >
          {errorBanner}
          <Input label="Full Name" required placeholder="Raj Sharma" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" required placeholder="raj@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" required placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Password" type="password" required placeholder="Min 8 chars, upper+lower+number" error={errors.password?.message} {...register('password')} />
          <RoleAndManagerFields
            role={watch('role')}
            managerId={watch('managerId') ?? ''}
            onRoleChange={r => setValue('role', r)}
            onManagerChange={m => setValue('managerId', m)}
            roleError={errors.role?.message}
          />
          <Input label="Employee Code" placeholder="EMP002" {...register('employeeCode')} />
          <Input label="Date of Joining" type="date" {...register('dateOfJoining')} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" fullWidth loading={createMutation.isPending}>Add User</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
