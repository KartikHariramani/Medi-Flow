import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Home, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Users, 
  Shield, 
  BarChart3,
  Stethoscope,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../lib/auth';

const DashboardLayout = () => {
  const [user, setUser] = useState(auth.getUser());
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const role = user?.role || 'patient';

  // Navigation Links based on role
  const navItems = {
    patient: [
      { path: '/patient/home', label: 'Home', icon: Home },
      { path: '/patient/book', label: 'Book', icon: Calendar },
      { path: '/patient/token', label: 'Token', icon: Clock },
      { path: '/patient/reports', label: 'Reports', icon: FileText },
      { path: '/patient/profile', label: 'Profile', icon: User },
    ],
    doctor: [
      { path: '/doctor/dashboard', label: 'Dashboard', icon: Activity },
      { path: '/doctor/queue', label: 'Queue', icon: Users },
      { path: '/doctor/history', label: 'History', icon: FileText },
      { path: '/doctor/profile', label: 'Profile', icon: User },
    ],
    admin: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
      { path: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
      { path: '/admin/patients', label: 'Patients', icon: Users },
      { path: '/admin/settings', label: 'Settings', icon: Shield },
    ]
  };

  const currentNav = navItems[role] || [];

  return (
    <div className="min-h-screen bg-background-primary flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-surface border-b border-border p-4 flex justify-between items-center z-50 sticky top-0">
        <h1 className="text-xl font-display font-bold text-accent-primary">MediFlow</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-text-primary p-2">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* DESKTOP SIDEBAR & MOBILE MENU */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 768) && (
          <motion.aside 
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className={`fixed md:relative z-40 w-72 h-full bg-surface/50 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-2xl transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          >
            <div className="p-8 hidden md:block">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                   <Activity size={24} className="text-background-primary" />
                </div>
                <h1 className="text-2xl font-display font-bold text-white tracking-widest leading-none">
                  Health<span className="text-accent-primary">Q</span>
                </h1>
              </div>
              <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-bold ml-1">{role} Control Center</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
              {currentNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-gradient-to-r from-accent-primary/20 to-transparent text-accent-primary' 
                        : 'text-text-muted hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  {location.pathname === item.path && (
                    <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-accent-primary rounded-r-full shadow-[0_0_15px_rgba(0,229,255,0.8)]" />
                  )}
                  <item.icon size={20} className={`transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'text-accent-primary' : ''}`} />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="p-6 border-t border-white/5 bg-background-primary/30 mt-auto">
              <div className="flex items-center gap-4 p-3 mb-6 bg-white/2 rounded-2xl border border-white/5">
                <div className="h-12 w-12 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-xl flex items-center justify-center font-bold text-background-primary text-lg shadow-lg">
                  {user?.name?.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-text-primary truncate text-sm">{user?.name}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-tighter truncate opacity-60 font-mono italic">{role}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3 text-accent-emergency/80 hover:text-accent-emergency font-bold hover:bg-accent-emergency/10 rounded-2xl transition-all duration-300 border border-transparent hover:border-accent-emergency/10"
              >
                <LogOut size={20} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen overflow-y-auto pb-24 md:pb-8 bg-background-primary relative">
        {/* Background Gradients for Premium feel */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
           <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-primary/20 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-accent-secondary/10 rounded-full blur-[100px]"></div>
        </div>

        <motion.div
           key={location.pathname}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
           className="w-full h-full p-4 md:p-10 relative z-10"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* PATIENT BOTTOM NAVIGATION (Mobile Only) */}
      {role === 'patient' && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-xl border-t border-white/5 flex justify-around p-2 pb-6">
          {currentNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-accent-primary' : 'text-text-secondary'
                }`
              }
            >
              <item.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {location.pathname === item.path && (
                <motion.div layoutId="nav-dot" className="h-1 w-1 bg-accent-primary rounded-full mt-1" />
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
};

export default DashboardLayout;

