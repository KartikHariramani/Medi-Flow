import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Activity, 
  Clock, 
  ChevronRight, 
  Stethoscope, 
  TrendingUp, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="relative overflow-hidden bg-background-primary text-text-primary">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-emergency/5 blur-[100px] rounded-full animate-pulse delay-700" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,229,255,0.4)]">
            <Stethoscope className="text-background-primary" size={24} />
          </div>
          <span className="text-2xl font-display font-bold tracking-tight">MediFlow</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-text-muted">
           <a href="#features" className="hover:text-accent-primary transition-colors">Platform</a>
           <a href="#demo" className="hover:text-accent-primary transition-colors">Case Studies</a>
           <a href="/login" className="btn-primary py-2 px-6">Launch App</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8 max-w-7xl mx-auto text-center lg:text-left flex flex-col lg:flex-row items-center gap-20">
        <div className="flex-1 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-bold uppercase tracking-widest"
          >
             <Activity size={14} />
             Live Queue Intelligence V2.0 Available
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl font-display font-black leading-[1.1] tracking-tight"
          >
            Digital Resilience for <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">Modern Healthcare</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-secondary max-w-xl leading-relaxed"
          >
            Transforming patient throughput with AI-driven waiting time predictions, real-time consultation workspaces, and automated medical logic. Experience the future of hospital administration.
          </motion.p>
          
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col sm:flex-row gap-4"
          >
            <button 
              onClick={() => window.location.href = '/login'}
              className="btn-primary group flex items-center justify-center gap-2"
            >
              Get Started Now
              <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </button>
            <button className="px-8 py-4 rounded-full border border-white/10 font-bold hover:bg-white/5 transition-colors">
              Schedule Demo
            </button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 relative"
        >
          <div className="absolute inset-0 bg-accent-primary/10 blur-[100px] rounded-full" />
          <div className="glass-card p-4 relative border-white/5 shadow-2xl">
             <img 
               src="https://images.unsplash.com/photo-1576091160550-217359f4ecf8?auto=format&fit=crop&q=80&w=1200" 
               alt="Healthcare Dashboard"
               className="rounded-xl w-full h-auto grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
             />
             <div className="absolute -bottom-6 -left-6 glass-card p-6 bg-surface/90 border-accent-primary/30 hidden sm:block">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-success/20 rounded-lg flex items-center justify-center text-success">
                   <TrendingUp size={20} />
                 </div>
                 <div>
                   <p className="text-[10px] text-text-muted font-bold uppercase">System Uptime</p>
                   <p className="text-xl font-display font-bold">99.98%</p>
                 </div>
               </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="relative z-10 py-32 px-8 bg-surface/20">
        <div className="max-w-7xl mx-auto space-y-20">
           <div className="text-center space-y-4">
             <h2 className="text-4xl font-display font-bold">Comprehensive Control</h2>
             <p className="text-text-secondary max-w-2xl mx-auto">Three specialized panels working in perfect harmony to eliminate bottlenecks and human error.</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <FeatureCard 
               icon={Smartphone} 
               title="Patient Portal" 
               desc="Intuitive mobile interface for appointment scheduling, live token tracking, and digital reports." 
               color="accent-primary"
             />
             <FeatureCard 
               icon={ShieldCheck} 
               title="Admin Hub" 
               desc="Central command center for doctor verification, operations analytics, and platform governance." 
               color="success"
             />
             <FeatureCard 
               icon={Activity} 
               title="Doctor Workspace" 
               desc="High-density environment for consultation management, medical history, and real-time queueing." 
               color="accent-emergency"
             />
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-white/5 text-center text-sm text-text-muted font-bold">
        <p>© 2026 MediFlow Intelligent Care Systems. Built for the future of medicine.</p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, color }) => (
  <div className="glass-card p-8 border-white/5 space-y-6 hover:translate-y-[-8px] transition-all duration-300 group">
    <div className={`h-14 w-14 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} border border-${color}/20 group-hover:scale-110 transition-transform`}>
      <Icon size={28} />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
    </div>
    <ul className="space-y-2 pt-4 border-t border-white/5">
       <li className="flex items-center gap-2 text-xs text-text-muted font-bold">
         <CheckCircle2 size={14} className="text-success" />
         Real-time Synchronization
       </li>
       <li className="flex items-center gap-2 text-xs text-text-muted font-bold">
         <CheckCircle2 size={14} className="text-success" />
         Low Latency API
       </li>
    </ul>
  </div>
);

export default LandingPage;

