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

// One ECG "beat" 120px wide on a baseline of y=40 — repeated to build a
// seamless heart-monitor line that scrolls by exactly one beat (see .animate-ecg).
const beat = (x: number) =>
  `M ${x},40 H ${x + 30} L ${x + 38},32 L ${x + 46},40 L ${x + 50},46 ` +
  `L ${x + 56},10 L ${x + 62},64 L ${x + 68},40 L ${x + 82},33 L ${x + 96},40 H ${x + 120}`;
const ecgPath = Array.from({ length: 10 }, (_, i) => beat(i * 120)).join(' ');

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

      {/* Left panel — animated brand showcase (desktop only) */}
      <div className="relative hidden lg:flex w-[45%] items-center justify-center overflow-hidden animate-login-gradient bg-[linear-gradient(135deg,#0DBBBD_0%,#0a8f91_36%,#0d3b4f_72%,#0f172a_100%)]">

        {/* Floating ambient orbs */}
        <div className="absolute -top-16 -left-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-14 -right-12 h-80 w-80 rounded-full bg-teal-300/20 blur-3xl animate-float-slower" />
        <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-cyan-200/10 blur-2xl animate-float" />

        {/* Ambient scrolling heartbeat line */}
        <div className="pointer-events-none absolute inset-x-0 bottom-20 h-20 overflow-hidden opacity-25">
          <svg width="1200" height="80" viewBox="0 0 1200 80" fill="none" className="animate-ecg">
            <path d={ecgPath} stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Centerpiece */}
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <div className="relative animate-float-slow">
            {/* glow ring */}
            <div className="absolute inset-0 -m-6 rounded-[2.25rem] bg-white/40 blur-2xl animate-glow" />
            {/* glass logo card */}
            <div className="relative rounded-[2rem] bg-white/95 p-10 shadow-2xl shadow-teal-950/40 ring-1 ring-white/50 backdrop-blur-xl">
              <img src={srlLogo} alt="SRL Life" className="w-52 object-contain" />
            </div>
          </div>

          <p
            className="mt-10 text-xs font-semibold uppercase tracking-[0.35em] text-teal-50/80 animate-fade-up"
            style={{ animationDelay: '0.25s' }}
          >
            SRL PULSE
          </p>
          <p
            className="mt-3 text-2xl font-light text-white/90 animate-fade-up"
            style={{ animationDelay: '0.4s' }}
          >
            Life is <span className="font-semibold">precious</span>
          </p>
        </div>
      </div>

      {/* Right side — mobile hero + form */}
      <div className="relative flex flex-1 flex-col w-full min-h-dvh lg:min-h-0">

        {/* Mobile brand hero (hidden on desktop, where the left panel takes over) */}
        <div className="safe-top relative flex shrink-0 flex-col items-center overflow-hidden px-6 pt-12 pb-8 animate-login-gradient bg-[linear-gradient(135deg,#0DBBBD_0%,#0a8f91_40%,#0d3b4f_78%,#0f172a_100%)] lg:hidden">
          {/* Floating orbs */}
          <div className="absolute -top-10 -left-8 h-40 w-40 rounded-full bg-white/10 blur-3xl animate-float-slow" />
          <div className="absolute -bottom-8 -right-8 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl animate-float-slower" />

          {/* Logo + tagline */}
          <div className="relative z-10 flex flex-col items-center text-center animate-fade-up">
            <div className="relative animate-bob">
              <div className="absolute inset-0 -m-4 rounded-[1.75rem] bg-white/40 blur-2xl animate-glow" />
              <div className="relative rounded-3xl bg-white/95 p-5 shadow-2xl shadow-teal-950/40 ring-1 ring-white/50 backdrop-blur-xl">
                <img src={srlLogo} alt="SRL Life" className="w-28 object-contain" />
              </div>
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-teal-50/80">
              SRL PULSE
            </p>
          </div>

          {/* Scrolling heartbeat line — in flow below the tagline, full-bleed */}
          <div className="pointer-events-none relative z-10 mt-5 h-20 w-screen overflow-hidden opacity-25">
            <svg width="1200" height="80" viewBox="0 0 1200 80" fill="none" className="animate-ecg">
              <path d={ecgPath} stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Form sheet — overlaps the hero on mobile, plain centered card on desktop */}
        <div className="relative z-10 -mt-8 flex flex-1 flex-col items-center justify-start rounded-t-[2rem] bg-white px-6 pt-9 pb-10 lg:mt-0 lg:justify-center lg:rounded-none lg:pt-10">
        <div className="w-full max-w-xs">

          <div className="mb-6 text-center lg:text-left animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="mb-1 text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-sm text-slate-400">Sign in to your account</p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 animate-fade-up"
            style={{ animationDelay: '0.2s' }}
          >
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

          <p
            className="mt-10 text-center text-xs text-slate-300 animate-fade-up"
            style={{ animationDelay: '0.3s' }}
          >
            SRL PULSE v1.0 · Life is precious
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
