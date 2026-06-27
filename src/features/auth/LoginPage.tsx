import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import srlLogo from '@/assets/logo.png';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { type AxiosError } from 'axios';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.login(data.email, data.password);
      const { accessToken, refreshToken, user } = res.data.data;
      setAuth({ user, accessToken, refreshToken });
      navigate('/', { replace: true });
    } catch (err) {
      const error = err as AxiosError<{ error: { message: string } }>;
      toast.error(error.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col lg:flex-row">

      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col items-center justify-center w-2/5 bg-slate-50 border-r border-slate-100 p-12">
        <img src={srlLogo} alt="SRL Life" className="w-60 object-contain" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white w-full min-h-dvh lg:min-h-0 px-6 py-10">
        <div className="w-full max-w-xs">

          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={srlLogo} alt="SRL Life" className="w-40 object-contain" />
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@srllife.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(p => !p)} className="p-1">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" fullWidth loading={isSubmitting} className="mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-center text-slate-300 text-xs mt-10">
            SRL PULSE v1.0 · Life is precious
          </p>
        </div>
      </div>
    </div>
  );
}
