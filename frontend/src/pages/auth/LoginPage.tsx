import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/client';
import { Lock, Mail, AlertCircle, ArrowRight, Shield, User, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      login(res.data.token, {
        id: res.data.id,
        email: res.data.email,
        fullName: res.data.fullName,
        role: res.data.role,
        department: res.data.department,
        phone: res.data.phone,
        universityId: res.data.universityId,
        active: true,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Welcome back, ${res.data.fullName}!`);
      if (res.data.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from === '/login' ? '/dashboard' : from, { replace: true });
      }
    } catch (err: any) {
      let msg = 'Invalid email or password. Please try again.';
      if (err.response?.data?.message) {
        msg = err.response.data.message;
      } else if (!err.response) {
        msg = 'Cannot connect to server. If the backend is on Render free tier, please wait ~30 seconds for it to wake up.';
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 mx-auto">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">University Portal Sign In</h2>
          <p className="text-xs text-slate-500">
            Access campus classrooms, computer labs, and auditoriums
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                University Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@campus.edu"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 shadow-sm shadow-brand-500/20 transition flex items-center justify-center gap-2 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Demo Sign In (One-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@campus.edu')}
                className="p-2 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <div className="text-[10px] text-rose-500 truncate">Dr. Vance</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('faculty@campus.edu')}
                className="p-2 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <GraduationCap className="w-3 h-3" /> Faculty
                </div>
                <div className="text-[10px] text-indigo-500 truncate">Prof. Turing</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('student@campus.edu')}
                className="p-2 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 text-left transition"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <User className="w-3 h-3" /> Student
                </div>
                <div className="text-[10px] text-emerald-500 truncate">Sarah C.</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500">
          New to the university?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
