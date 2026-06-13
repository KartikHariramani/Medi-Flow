import { FadeUp } from '../../components/SharedComponents';
import { Mail, Lock, UserPlus, User, ArrowRight, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    specialization: '',
    department: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      auth.setToken(data.token);
      auth.setUser(data.user);

      // Redirect based on role
      if (data.user.role === 'doctor') {
        navigate('/doctor/dashboard');
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
            <h1 className="text-4xl font-display text-accent-primary mb-2">Create Account</h1>
            <p className="text-text-secondary">Join MediFlow to manage your hospital visits efficiently.</p>
          </div>
          
          <div className="glass-card p-8">
            <div className="flex bg-background-secondary rounded-lg p-1 mb-6">
              {['patient', 'doctor'].map((r) => (
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

            <form className="space-y-4" onSubmit={handleRegister}>
              {error && (
                <div className="bg-accent-emergency/10 border border-accent-emergency/20 text-accent-emergency p-3 rounded-lg text-sm font-bold text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-text-secondary" />
                  </div>
                  <input 
                    type="text" 
                    className="input-field pl-11" 
                    placeholder="Enter your full name" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-secondary mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-text-secondary" />
                  </div>
                  <input 
                    type="email" 
                    className="input-field pl-11" 
                    placeholder="Enter your email address" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                    className="input-field pl-11" 
                    placeholder="Create a strong password" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Specialization</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Cardiology" 
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Department</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Surgery" 
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className={`btn-primary w-full mt-6 flex justify-center items-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Creating account...</span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <a href="/login" className="font-bold text-accent-primary hover:underline inline-flex items-center gap-1">
                Log in instead <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  );
};

export default Register;

