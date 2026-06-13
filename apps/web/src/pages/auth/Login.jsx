import { FadeUp, SectionHeader } from '../../components/SharedComponents';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Login = () => {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      auth.setToken(data.token);
      auth.setUser(data.user);

      // Redirect based on role
      if (data.user.role === 'doctor') {
        navigate('/doctor/dashboard');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/patient/home');
      }
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

