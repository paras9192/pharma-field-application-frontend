import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone required'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MR', 'ASM', 'ZSM', 'SALES_PERSON']),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

const editSchema = z.object({
  name: z.string().min(1, 'Name required'),
  phone: z.string().min(10, 'Phone required'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MR', 'ASM', 'ZSM', 'SALES_PERSON']),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const currentUserRole = useAuthStore(s => s.user?.role);

  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    select: r => r.data.data,
    enabled: isEdit,
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'MR' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (user && isEdit) {
      editForm.reset({
        name: user.name,
        phone: user.phone,
        role: user.role?.name as EditFormData['role'],
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
      employeeCode: data.employeeCode || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created!');
      navigate(`/users/${res.data.data.id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => usersApi.update(id!, {
      name: data.name,
      phone: data.phone,
      role: data.role,
      employeeCode: data.employeeCode || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated!');
      navigate(`/users/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update');
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
      const msg = err.response?.data?.error?.message || 'Failed to reset password';
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

  if (isEdit) {
    const { register, handleSubmit, formState: { errors } } = editForm;
    const canResetPassword = currentUserRole === 'SUPER_ADMIN' ||
      (currentUserRole === 'ADMIN' && user?.role?.name !== 'SUPER_ADMIN');

    return (
      <div className="p-4 max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
        <Card>
          <form onSubmit={handleSubmit(data => updateMutation.mutate(data))} className="space-y-4">
            <Input label="Full Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} />
            <Select
              label="Role"
              required
              options={[
                { value: 'MR', label: 'Medical Representative (MR)' },
                { value: 'ASM', label: 'Area Sales Manager (ASM)' },
                { value: 'ZSM', label: 'Zonal Sales Manager (ZSM)' },
                { value: 'SALES_PERSON', label: 'Sales Person' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
              ]}
              error={errors.role?.message}
              {...register('role')}
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

  const { register, handleSubmit, formState: { errors } } = createForm;
  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Add User</h2>
      <Card>
        <form onSubmit={handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
          <Input label="Full Name" required placeholder="Raj Sharma" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" required placeholder="raj@company.com" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" required placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Password" type="password" required placeholder="Min 8 chars, upper+lower+number" error={errors.password?.message} {...register('password')} />
          <Select
            label="Role"
            required
            options={[
              { value: 'MR', label: 'Medical Representative (MR)' },
              { value: 'ASM', label: 'Area Sales Manager (ASM)' },
              { value: 'ZSM', label: 'Zonal Sales Manager (ZSM)' },
              { value: 'SALES_PERSON', label: 'Sales Person' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'SUPER_ADMIN', label: 'Super Admin' },
            ]}
            error={errors.role?.message}
            {...register('role')}
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
