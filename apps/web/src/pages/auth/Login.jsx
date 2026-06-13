import { FadeUp } from '../../components/SharedComponents';
import { Mail, Lock, LogIn, ArrowRight, Zap, User, Stethoscope, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

// ─── DEMO ACCOUNTS (instant login, no database needed) ────────────────────
const DEMO_USERS = {
  'patient@demo.com': {
    id: 'demo-patient-001',
    name: 'Aarav Patel',
    email: 'patient@demo.com',
    role: 'patient',
  },
  'doctor@demo.com': {
    id: 'demo-doctor-001',
    name: 'Dr. Arjun Mehta',
    email: 'doctor@demo.com',
    role: 'doctor',
    specialization: 'Cardiology',
  },
  'admin@demo.com': {
    id: 'demo-admin-001',
    name: 'Admin User',
    email: 'admin@demo.com',
    role: 'admin',
  },
};
const DEMO_PASSWORD = 'demo123';

const Login = () => {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fill demo credentials instantly
  const fillDemo = (demoRole) => {
    const emailMap = { patient: 'patient@demo.com', doctor: 'doctor@demo.com', admin: 'admin@demo.com' };
    setRole(demoRole);
    setEmail(emailMap[demoRole]);
    setPassword(DEMO_PASSWORD);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // ── STEP 1: Check demo bypass first ──────────────────────────────────
      const demoUser = DEMO_USERS[email.toLowerCase()];
      if (demoUser && password === DEMO_PASSWORD) {
        auth.setToken('demo-token-' + demoUser.id);
        auth.setUser(demoUser);
        navigate(
          demoUser.role === 'doctor' ? '/doctor/dashboard'
          : demoUser.role === 'admin' ? '/admin/dashboard'
          : '/patient/home'
        );
        return;
      }

      // ── STEP 2: Real Supabase login ───────────────────────────────────────
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) throw new Error(authError.message || 'Invalid email or password');

      const supabaseUser = authData.user;

      // Try to get profile from public.users table
      const { data: userProfile } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', supabaseUser.id)
        .single();

      const finalUser = userProfile || {
        id: supabaseUser.id,
        name: supabaseUser.user_metadata?.name || email.split('@')[0],
        email: supabaseUser.email,
        role: supabaseUser.user_metadata?.role || role,
      };

      auth.setToken(authData.session.access_token);
      auth.setUser(finalUser);

      navigate(
        finalUser.role === 'doctor' ? '/doctor/dashboard'
        : finalUser.role === 'admin' ? '/admin/dashboard'
        : '/patient/home'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <FadeUp>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display text-accent-primary mb-2">MediFlow</h1>
            <p className="text-text-secondary">Welcome back. Please login to your account.</p>
          </div>

          {/* ── Demo Quick Login Buttons ─────────────────────────────────── */}
          <div className="mb-4 p-4 rounded-xl border border-accent-primary/20 bg-accent-primary/5">
            <p className="text-xs font-bold text-accent-primary mb-3 flex items-center gap-1">
              <Zap size={12} /> DEMO MODE — Click to auto-fill credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => fillDemo('patient')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background-secondary hover:bg-surface border border-border hover:border-accent-primary/40 transition-all group"
              >
                <User size={18} className="text-accent-primary" />
                <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary">Patient</span>
              </button>
              <button
                onClick={() => fillDemo('doctor')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background-secondary hover:bg-surface border border-border hover:border-accent-primary/40 transition-all group"
              >
                <Stethoscope size={18} className="text-accent-primary" />
                <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary">Doctor</span>
              </button>
              <button
                onClick={() => fillDemo('admin')}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background-secondary hover:bg-surface border border-border hover:border-accent-primary/40 transition-all group"
              >
                <ShieldCheck size={18} className="text-accent-primary" />
                <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary">Admin</span>
              </button>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="flex bg-background-secondary rounded-lg p-1 mb-6">
              {['patient', 'doctor', 'admin'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 text-sm font-bold rounded-md capitalize transition-all ${
                    role === r
                      ? 'bg-surface text-accent-primary shadow'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              {error && (
                <div className="bg-accent-emergency/10 border border-accent-emergency/20 text-accent-emergency p-3 rounded-lg text-sm font-bold text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-text-secondary" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-text-secondary" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded bg-background-secondary border-border text-accent-primary focus:ring-accent-primary" />
                  <span className="text-sm text-text-secondary">Remember me</span>
                </label>
                <a href="#" className="text-sm font-bold text-accent-primary hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`btn-primary w-full mt-6 flex justify-center items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <a href="/register" className="font-bold text-accent-primary hover:underline inline-flex items-center gap-1">
                Create one now <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
};

export default Login;
