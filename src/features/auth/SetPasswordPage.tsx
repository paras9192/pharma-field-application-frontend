import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, AlertCircle } from 'lucide-react';
import { authApi } from '@/api/auth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

export default function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);

  const mutation = useMutation({
    mutationFn: () => authApi.setPassword(token!, password),
    onSuccess: () => {
      toast.success('Password set! You can now log in.');
      navigate('/login', { replace: true });
    },
    onError: (err: AxiosError<{ error: { message: string } }>) => {
      const msg = err.response?.data?.error?.message || 'Something went wrong';
      if (err.response?.status === 403) {
        setInvalidLink(true);
      } else {
        setFieldError(msg);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters');
      return;
    }
    setFieldError('');
    mutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Invalid Link</h1>
          <p className="text-sm text-slate-500">This link is missing required information. Please use the link from your welcome email.</p>
        </div>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-3">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-amber-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Link Expired</h1>
          <p className="text-sm text-slate-500">
            This link has expired or already been used. Please contact your admin to send a new one.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <KeyRound size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Set your password</h1>
          <p className="text-sm text-slate-500">Choose a password to activate your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              required
              placeholder="Min 8 characters"
              hint="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={fieldError}
            />
            <Button type="submit" fullWidth loading={mutation.isPending}>
              Set Password & Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
