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

  // Nếu đã đăng nhập → về dashboard
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
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

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <LogoIcon size={28} color="#FFF" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>HourLink</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Panel</div>
          </div>
        </div>

        <h1 className="login-title">Đăng nhập quản trị</h1>
        <p className="login-subtitle">
          Chỉ tài khoản có quyền ADMIN mới có thể truy cập.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={15} />
              <input
                id="admin-email"
                type="email"
                className="form-input"
                placeholder="admin@hourlink.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={15} />
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error */}
          {error && <div className="login-error">{error}</div>}

          {/* Submit */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
