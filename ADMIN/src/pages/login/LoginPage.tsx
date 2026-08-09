import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import LogoIcon from '@/components/ui/LogoIcon';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không đúng định dạng (VD: admin@hourlink.vn).');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err as Error)?.message
        || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-[38px] pr-3.5 py-2.5 bg-surface-2 border border-border rounded-md ' +
    'text-text text-[14px] outline-none focus:border-primary/50 ' +
    'placeholder:text-text-dim transition-colors';

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.08) 0%, transparent 60%),' +
          'radial-gradient(ellipse at 80% 20%, rgba(4,120,87,0.06) 0%, transparent 50%)',
      }}
    >
      <div className="w-full max-w-[400px] bg-surface border border-border rounded-2xl p-9 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#059669] to-primary flex items-center justify-center shadow-[0_4px_14px_rgba(16,185,129,0.4)] text-white shrink-0">
            <LogoIcon size={28} color="#FFF" />
          </div>
          <div>
            <div className="font-bold text-[18px] text-text">HourLink</div>
            <div className="text-[11px] text-text-muted">Admin Panel</div>
          </div>
        </div>

        <h1 className="text-[20px] font-bold text-text mb-1">Đăng nhập quản trị</h1>
        <p className="text-[13px] text-text-muted mb-7">
          Chỉ tài khoản có quyền ADMIN mới có thể truy cập.
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-[13px] font-medium text-text-muted">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" size={15} />
              <input
                id="admin-email"
                type="email"
                className={inputClass}
                placeholder="admin@hourlink.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-[13px] font-medium text-text-muted">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" size={15} />
              <input
                id="admin-password"
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/25 rounded-md px-3.5 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3 bg-primary text-white rounded-md text-[14px] font-semibold transition-all hover:bg-primary-hover hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
