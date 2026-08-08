import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, AlertTriangle, FileText, Upload, ExternalLink } from 'lucide-react';
import { usersApi } from '@/api/users';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { ROLE_OPTIONS } from '@/utils/roles';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';
import type { Role, Gender, User, ProfileDocumentType } from '@/types/api';

const ROLE_VALUES = ['SUPER_ADMIN', 'ADMIN', 'ZSM', 'ASM', 'MR', 'SALES_PERSON'] as const;

const createSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  role: z.enum(ROLE_VALUES),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
});

// Admins edit the whole record, personal details included, so they can complete
// or correct a profile on a user's behalf. Matches the fields PATCH /users/:id
// accepts — the API rejects anything it does not whitelist.
const editSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a valid 10-digit phone number'),
  role: z.enum(ROLE_VALUES),
  isActive: z.boolean().optional(),
  employeeCode: z.string().optional(),
  dateOfJoining: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  address: z.string().max(255, 'Too long').optional(),
  bio: z.string().max(280, 'Max 280 characters').optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().trim().optional()
    .refine(v => !v || /^\d{10}$/.test(v), 'Enter a valid 10-digit phone number'),
});

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  .map(g => ({ value: g, label: g }));

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

function apiMessage(err: AxiosError<{ error: { message: string } }>, fallback: string) {
  return err.response?.data?.error?.message || fallback;
}

/**
 * Controlled rather than registered, so one component can serve both the create
 * and edit form shapes without casting. Role carries no reporting line: it only
 * decides which screens the user sees.
 */
function RoleField({
  role, onRoleChange, roleError,
}: {
  role: Role;
  onRoleChange: (role: Role) => void;
  roleError?: string;
}) {
  return (
    <Select
      label="Role"
      required
      options={ROLE_OPTIONS}
      error={roleError}
      value={role}
      onChange={e => onRoleChange(e.target.value as Role)}
    />
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
    defaultValues: { role: 'MR' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { role: 'MR' },
  });

  useEffect(() => {
    if (user && isEdit) {
      editForm.reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.name,
        isActive: user.isActive,
        employeeCode: user.employeeCode ?? '',
        // <input type="date"> needs a bare YYYY-MM-DD; the API returns a full ISO
        // datetime, which the date input cannot display (the field would go blank).
        dateOfJoining: user.dateOfJoining ? user.dateOfJoining.split('T')[0] : '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        gender: user.gender ?? '',
        bloodGroup: user.bloodGroup ?? '',
        address: user.address ?? '',
        bio: user.bio ?? '',
        emergencyContactName: user.emergencyContactName ?? '',
        emergencyContactPhone: user.emergencyContactPhone ?? '',
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
      const msg = apiMessage(err, 'Failed to create user');
      setFormError(msg);
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => usersApi.update(id!, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      isActive: data.isActive,
      employeeCode: data.employeeCode || undefined,
      dateOfJoining: data.dateOfJoining || undefined,
      // Empty strings are dropped rather than sent: the API validates gender as
      // an enum and the dates as date strings, so "" would be a 400.
      dateOfBirth: data.dateOfBirth || undefined,
      gender: (data.gender || undefined) as Gender | undefined,
      bloodGroup: data.bloodGroup || undefined,
      address: data.address || undefined,
      bio: data.bio || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated!');
      navigate(`/users/${id}`);
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
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
            <Input label="Email" type="email" required hint="This is the user's login" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} />
            <Select
              label="Status"
              options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              hint="An inactive user cannot log in."
              value={watch('isActive') ? 'true' : 'false'}
              onChange={e => setValue('isActive', e.target.value === 'true', { shouldDirty: true })}
            />
            <RoleField
              role={watch('role')}
              onRoleChange={r => setValue('role', r)}
              roleError={errors.role?.message}
            />
            <Input label="Employee Code" placeholder="EMP001" {...register('employeeCode')} />
            <Input label="Date of Joining" type="date" {...register('dateOfJoining')} />

            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 mt-2">Personal Details</h3>
              <div className="space-y-4">
                <Input label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register('dateOfBirth')} />
                <Select label="Gender" placeholder="Not set" options={GENDER_OPTIONS} {...register('gender')} />
                <Select label="Blood Group" placeholder="Not set" options={BLOOD_GROUP_OPTIONS} {...register('bloodGroup')} />
                <Input label="Address" error={errors.address?.message} {...register('address')} />
                <Textarea label="Bio" rows={3} hint="Max 280 characters" error={errors.bio?.message} {...register('bio')} />
                <Input label="Emergency Contact Name" error={errors.emergencyContactName?.message} {...register('emergencyContactName')} />
                <Input
                  label="Emergency Contact Phone"
                  type="tel"
                  placeholder="9876543210"
                  error={errors.emergencyContactPhone?.message}
                  {...register('emergencyContactPhone')}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" fullWidth onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" fullWidth loading={updateMutation.isPending}>Save Changes</Button>
            </div>
          </form>
        </Card>

        <UserFilesCard userId={id!} user={user} />

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
          <RoleField
            role={watch('role')}
            onRoleChange={r => setValue('role', r)}
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

const KYC_DOCS: { type: ProfileDocumentType; label: string; field: 'aadhaarUrl' | 'panUrl' | 'tenthMarksheetUrl' }[] = [
  { type: 'aadhaar', label: 'Aadhaar', field: 'aadhaarUrl' },
  { type: 'pan', label: 'PAN', field: 'panUrl' },
  { type: 'tenth-marksheet', label: '10th Marksheet', field: 'tenthMarksheetUrl' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB, matching the Settings uploader

/**
 * Photo and KYC uploads for the user being edited. These are separate endpoints
 * from PATCH /users/:id — each file is presigned and PUT to S3 first, so they
 * save immediately rather than waiting for "Save Changes".
 */
function UserFilesCard({ userId, user }: { userId: string; user?: User }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['user', userId] });
    qc.invalidateQueries({ queryKey: ['users'] });
  };

  const photoMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadPhotoFor(userId, file),
    onSuccess: () => { refresh(); toast.success('Photo updated'); },
    onError: (err: AxiosError<{ error: { message: string } }>) =>
      toast.error(apiMessage(err, 'Failed to upload photo')),
    onSettled: () => setBusy(null),
  });

  const docMutation = useMutation({
    mutationFn: ({ type, file }: { type: ProfileDocumentType; file: File }) =>
      usersApi.uploadDocumentFor(userId, type, file),
    onSuccess: () => { refresh(); toast.success('Document uploaded'); },
    onError: (err: AxiosError<{ error: { message: string } }>) =>
      toast.error(apiMessage(err, 'Failed to upload document')),
    onSettled: () => setBusy(null),
  });

  const pick = (accept: string, onFile: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) return toast.error('File must be under 10 MB');
      onFile(file);
    };
    input.click();
  };

  return (
    <Card>
      <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <FileText size={15} /> Photo &amp; Documents
      </h3>

      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={user?.name ?? ''} src={user?.profilePhoto} className="w-9 h-9 rounded-lg text-xs" />
          <span className="text-sm text-slate-700">Profile Photo</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={busy === 'photo'}
          onClick={() => pick('image/*', file => { setBusy('photo'); photoMutation.mutate(file); })}
        >
          <Upload size={14} /> {user?.profilePhoto ? 'Replace' : 'Upload'}
        </Button>
      </div>

      <div className="space-y-2">
        {KYC_DOCS.map(doc => {
          const url = user?.[doc.field];
          return (
            <div key={doc.type} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-slate-700">{doc.label}</div>
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 inline-flex items-center gap-1 hover:underline">
                    View <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Not uploaded</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={busy === doc.type}
                onClick={() => pick('image/*,application/pdf', file => {
                  setBusy(doc.type);
                  docMutation.mutate({ type: doc.type, file });
                })}
              >
                <Upload size={14} /> {url ? 'Replace' : 'Upload'}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
