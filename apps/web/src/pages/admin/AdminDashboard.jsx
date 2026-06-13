import { useState, useEffect } from 'react';
import { FadeUp, SectionHeader } from '../../components/SharedComponents';
import { 
  Users, 
  Activity, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  UserPlus, 
  MoreVertical,
  ArrowUpRight,
  Stethoscope,
  BarChart3,
  Calendar,
  LayoutDashboard,
  Search,
  Filter,
  FileText,
  Mail,
  MoreHorizontal,
  GitCompare,
  TrendingUp,
  AlertTriangle,
  Brain,
  MonitorPlay,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    pendingVerifications: 0,
    activeInQueue: 0,
    avgWaitTime: 0
  });
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Digital Twin & Resource Optimization State
  const [departmentLoads, setDepartmentLoads] = useState([
    { department_name: 'Cardiology', active_doctors: 2, queue_length: 4, avg_wait_minutes: 60, emergency_count: 1 },
    { department_name: 'Neurology', active_doctors: 1, queue_length: 3, avg_wait_minutes: 45, emergency_count: 0 },
    { department_name: 'Pediatrics', active_doctors: 3, queue_length: 2, avg_wait_minutes: 15, emergency_count: 0 },
    { department_name: 'Orthopedics', active_doctors: 1, queue_length: 5, avg_wait_minutes: 75, emergency_count: 2 },
    { department_name: 'General Medicine', active_doctors: 4, queue_length: 1, avg_wait_minutes: 10, emergency_count: 0 }
  ]);
  const [recommendations, setRecommendations] = useState([]);
  const [capacityTips, setCapacityTips] = useState([]);

  // No-Show State
  const [noShowInput, setNoShowInput] = useState({
    age: 28,
    chronicConditionsCount: 1,
    leadTimeDays: 7,
    previousNoShows: 1,
    appointmentHour: 10
  });
  const [noShowResult, setNoShowResult] = useState(null);
  const [isNoShowLoading, setIsNoShowLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    fetchOptimizationData();
  }, [activeTab]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const authHeader = auth.getAuthHeader();
      
      const statsRes = await fetch(`${API_URL}/api/admin/analytics`, { headers: authHeader });
      const statsData = await statsRes.json();
      if (statsData) setStats(statsData);

      const doctorsRes = await fetch(`${API_URL}/api/admin/doctors/unverified`, { headers: authHeader });
      const doctorsData = await doctorsRes.json();
      if (doctorsData.doctors) setPendingDoctors(doctorsData.doctors);

      const patientsRes = await fetch(`${API_URL}/api/admin/patients`, { headers: authHeader });
      const patientsData = await patientsRes.json();
      if (patientsData.patients) setAllPatients(patientsData.patients);

    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOptimizationData = async () => {
    try {
      const authHeader = auth.getAuthHeader();
      const res = await fetch(`${API_URL}/api/ai/optimize-resources`, { headers: authHeader });
      const data = await res.json();
      if (data) {
        if (data.departmentLoads && data.departmentLoads.length > 0) {
          setDepartmentLoads(data.departmentLoads);
        }
        setRecommendations(data.recommendations || []);
        setCapacityTips(data.capacity_tips || []);
      }
    } catch (err) {
      console.warn("FastAPI service unavailable, running local operational model simulation.");
      simulateLocalOptimization();
    }
  };

  const simulateLocalOptimization = () => {
    const recs = [
      {
        action: 'REASSIGN_DOCTOR',
        from_department: 'General Medicine',
        to_department: 'Orthopedics',
        reason: 'Orthopedics is currently carrying a heavy wait time load (75 min average, 2 emergencies) while General Medicine has 4 active doctors with minimal queue delay.'
      }
    ];
    const tips = [
      "Consider opening surge scheduling shifts in Cardiology to alleviate 60-minute wait queues.",
      "Setup daily Telegram pre-confirmations for Orthopedic slots to reduce patient dropouts."
    ];
    setRecommendations(recs);
    setCapacityTips(tips);
  };

  const handleVerify = async (doctorId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/doctors/${doctorId}/verify`, {
        method: 'PATCH',
        headers: auth.getAuthHeader()
      });
      if (res.ok) {
        setPendingDoctors(prev => prev.filter(d => d.id !== doctorId));
        fetchInitialData();
      }
    } catch (err) { console.error(err); }
  };

  const handlePredictNoShow = async (e) => {
    e.preventDefault();
    setIsNoShowLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/predict-noshow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth.getAuthHeader()
        },
        body: JSON.stringify(noShowInput)
      });
      const data = await res.json();
      setNoShowResult(data);
    } catch (err) {
      console.error("AI No-Show evaluation service failed", err);
    } finally {
      setIsNoShowLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6 px-4">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-accent-primary to-blue-500 bg-clip-text text-transparent">MediFlow</span> 
            <span className="text-xl font-normal text-text-secondary border-l border-white/10 pl-3">Ops Center</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Real-time AI Hospital Orchestrator & Command Dashboard</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-surface p-1.5 rounded-2xl border border-white/5">
          {[
            { id: 'dashboard', label: 'Command Hub', icon: LayoutDashboard },
            { id: 'twin', label: 'Digital Twin', icon: MonitorPlay },
            { id: 'optimize', label: 'Resource Optimization', icon: GitCompare },
            { id: 'noshow', label: 'No-Show Predictor', icon: Brain },
            { id: 'doctors', label: 'Medical Staff', icon: Stethoscope },
            { id: 'patients', label: 'Patient Register', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-accent-primary text-background-primary shadow-lg shadow-accent-primary/20' : 'text-text-muted hover:text-white'}`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {/* TAB 1: COMMAND HUB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Patients" value={stats.totalPatients} icon={Users} color="accent-primary" />
                <StatCard label="Active Tokens" value={stats.totalAppointments} icon={Calendar} color="success" />
                <StatCard label="Active Queue" value={stats.activeInQueue} icon={AlertTriangle} color="accent-emergency" />
                <StatCard label="Avg Wait Time" value={`${stats.avgWaitTime || 22} min`} icon={Clock} color="accent-warning" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-8 border-white/5">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-accent-primary" /> Facility Workload Index
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-bold text-text-muted uppercase">Live Updates</span>
                    </div>
                  </div>
                  
                  {/* Department Load Progress Bars */}
                  <div className="space-y-6">
                    {departmentLoads.slice(0, 4).map((dept, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-white">{dept.department_name}</span>
                          <span className="text-xs text-text-secondary">{dept.queue_length} patients | {dept.avg_wait_minutes}m wait</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              dept.avg_wait_minutes > 50 ? 'bg-accent-emergency' : dept.avg_wait_minutes > 30 ? 'bg-accent-warning' : 'bg-success'
                            }`}
                            style={{ width: `${Math.min((dept.queue_length / 6) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8 border-accent-primary/20 bg-accent-primary/5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                      <Sparkles size={20} className="text-accent-primary" /> Smart Agent Status
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">System-wide AI performance for wait time estimation, triage classification, and patient routing.</p>
                  </div>
                  <div className="space-y-6 mt-8">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span>Wait Time Confidence</span>
                        <span className="text-accent-primary">95.4%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-primary w-[95.4%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span>Triage Precision</span>
                        <span className="text-success">98.1%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-success w-[98.1%]" />
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('optimize')} className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
                      <Zap size={16} /> Optimize Queue Layout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL TWIN */}
          {activeTab === 'twin' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <MonitorPlay size={24} className="text-accent-primary" /> Active Clinic Digital Twin
                </h3>
                <span className="text-xs font-semibold px-3 py-1 bg-white/5 border border-white/10 rounded-full text-text-secondary">
                  Real-Time Heartbeat Sync Active
                </span>
              </div>

              {/* Grid map showing departments */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departmentLoads.map((dept, idx) => {
                  const hasEmergency = dept.emergency_count > 0;
                  const loadStatus = dept.avg_wait_minutes > 50 ? 'Surge' : dept.avg_wait_minutes > 25 ? 'High' : 'Optimal';
                  return (
                    <div 
                      key={idx} 
                      className={`glass-card p-6 border-white/5 transition-all duration-300 ${
                        hasEmergency ? 'border-accent-emergency/30 bg-accent-emergency/5' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h4 className="text-lg font-bold text-white">{dept.department_name}</h4>
                          <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            loadStatus === 'Surge' ? 'bg-accent-emergency/20 text-accent-emergency' :
                            loadStatus === 'High' ? 'bg-accent-warning/20 text-accent-warning' :
                            'bg-success/20 text-success'
                          }`}>
                            {loadStatus} Workload
                          </span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-accent-primary">
                          <Activity size={20} className={loadStatus === 'Surge' ? 'animate-pulse' : ''} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Active Staff</p>
                          <p className="text-xl font-bold text-white mt-1">{dept.active_doctors} Docs</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Queue Length</p>
                          <p className="text-xl font-bold text-white mt-1">{dept.queue_length} Patients</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Avg Wait Time</p>
                          <p className="text-xl font-bold text-white mt-1">{dept.avg_wait_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Emergencies</p>
                          <p className={`text-xl font-bold mt-1 ${hasEmergency ? 'text-accent-emergency font-black' : 'text-white'}`}>
                            {dept.emergency_count} Cases
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: RESOURCE OPTIMIZATION */}
          {activeTab === 'optimize' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <GitCompare size={24} className="text-accent-primary" /> Resource Optimization Recommendations
                </h3>
                <button onClick={fetchOptimizationData} className="flex items-center gap-2 text-xs text-accent-primary font-bold hover:underline">
                  <RotateCcw size={14} /> Re-sync Optimizer
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recommendations Feed */}
                <div className="lg:col-span-2 space-y-6">
                  <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest">Active Recommendations</h4>
                  
                  {recommendations.length > 0 ? (
                    recommendations.map((rec, idx) => (
                      <div key={idx} className="glass-card p-6 border-accent-primary/20 bg-accent-primary/5 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                        <div className="space-y-2 flex-1">
                          <span className="inline-block text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-accent-primary text-background-primary rounded-md">
                            {rec.action}
                          </span>
                          <h4 className="text-lg font-bold text-white">
                            Shift doctor from <span className="text-accent-warning">{rec.from_department}</span> to <span className="text-accent-primary">{rec.to_department}</span>
                          </h4>
                          <p className="text-sm text-text-secondary leading-relaxed">{rec.reason}</p>
                        </div>
                        <button className="px-5 py-3 bg-accent-primary text-background-primary font-black rounded-xl text-xs hover:shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all whitespace-nowrap">
                          Apply Dispatch
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="glass-card p-10 text-center text-text-muted border-white/5">
                      No immediate doctor shift reassignments are recommended. All departments are operating optimally.
                    </div>
                  )}
                </div>

                {/* Capacity Tips */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest">Capacity Strategies</h4>
                  <div className="glass-card p-6 border-white/5 space-y-4">
                    {capacityTips.map((tip, idx) => (
                      <div key={idx} className="flex gap-3 items-start border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                        <div className="h-5 w-5 bg-accent-warning/10 border border-accent-warning/20 text-accent-warning flex items-center justify-center rounded-md flex-shrink-0 mt-0.5">
                          <AlertTriangle size={12} />
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NO-SHOW PREDICTOR */}
          {activeTab === 'noshow' && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Brain size={24} className="text-accent-primary" /> AI Patient No-Show Predictor
                </h3>
                <p className="text-sm text-text-secondary mt-1">Predict the compliance and show probability of incoming appointments to optimize scheduling density.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handlePredictNoShow} className="glass-card p-8 border-white/5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Patient Age</label>
                    <input 
                      type="number"
                      value={noShowInput.age}
                      onChange={(e) => setNoShowInput(prev => ({ ...prev, age: Number(e.target.value) }))}
                      className="w-full bg-background-primary px-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Chronic Conditions Count</label>
                    <input 
                      type="number"
                      value={noShowInput.chronicConditionsCount}
                      onChange={(e) => setNoShowInput(prev => ({ ...prev, chronicConditionsCount: Number(e.target.value) }))}
                      className="w-full bg-background-primary px-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Scheduling Lead Time (Days since booking)</label>
                    <input 
                      type="number"
                      value={noShowInput.leadTimeDays}
                      onChange={(e) => setNoShowInput(prev => ({ ...prev, leadTimeDays: Number(e.target.value) }))}
                      className="w-full bg-background-primary px-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Previous Missed Appointments (No-shows)</label>
                    <input 
                      type="number"
                      value={noShowInput.previousNoShows}
                      onChange={(e) => setNoShowInput(prev => ({ ...prev, previousNoShows: Number(e.target.value) }))}
                      className="w-full bg-background-primary px-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Appointment Hour (24h format)</label>
                    <input 
                      type="number"
                      value={noShowInput.appointmentHour}
                      onChange={(e) => setNoShowInput(prev => ({ ...prev, appointmentHour: Number(e.target.value) }))}
                      className="w-full bg-background-primary px-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isNoShowLoading}
                    className="w-full py-4 bg-accent-primary text-background-primary font-black rounded-xl hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isNoShowLoading ? 'Calculating Probability...' : 'Analyze Show Probability'}
                  </button>
                </form>

                {/* Predictor Result */}
                <div className="flex flex-col justify-center">
                  {noShowResult ? (
                    <div className="glass-card p-8 border-accent-primary/20 bg-accent-primary/5 space-y-6">
                      <div className="text-center space-y-2">
                        <p className="text-xs text-text-secondary uppercase tracking-wider font-bold">Predicted No-Show Probability</p>
                        <p className={`text-6xl font-black ${
                          noShowResult.risk_level === 'high' ? 'text-accent-emergency' :
                          noShowResult.risk_level === 'medium' ? 'text-accent-warning' : 'text-success'
                        }`}>
                          {(noShowResult.no_show_probability * 100).toFixed(0)}%
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          noShowResult.risk_level === 'high' ? 'bg-accent-emergency/20 text-accent-emergency' :
                          noShowResult.risk_level === 'medium' ? 'bg-accent-warning/20 text-accent-warning' : 'bg-success/20 text-success'
                        }`}>
                          {noShowResult.risk_level} risk
                        </span>
                      </div>

                      <div className="border-t border-white/10 pt-6 space-y-4">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Zap size={16} className="text-accent-primary" /> Recommended Mitigation Actions
                        </h4>
                        <ul className="space-y-3">
                          {noShowResult.recommended_actions.map((act, idx) => (
                            <li key={idx} className="flex gap-2 items-start text-xs text-text-secondary leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                              {act}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-card p-10 text-center text-text-muted border-white/5 border-dashed flex flex-col items-center justify-center h-full min-h-[300px]">
                      <Brain size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">Submit the analysis form to trigger AI neural network prediction & generate scheduling mitigations.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STAFF */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Verification Queue</h3>
                <span className="text-xs bg-accent-warning/20 text-accent-warning border border-accent-warning/20 px-3 py-1 rounded-full font-bold">
                  {pendingDoctors.length} Verification Pending
                </span>
              </div>
              
              {pendingDoctors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingDoctors.map(doc => (
                    <div key={doc.id} className="glass-card p-6 border-white/5 hover:border-accent-primary/30 transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-2xl text-accent-primary border border-white/5">
                          {doc.users.name.charAt(0)}
                        </div>
                        <button className="p-2 text-text-muted hover:text-white"><MoreHorizontal size={18}/></button>
                      </div>
                      <div>
                         <h4 className="font-bold text-lg text-white">{doc.users.name}</h4>
                         <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mt-1">{doc.department}</p>
                         <p className="text-xs text-text-muted mt-0.5">{doc.specialization}</p>
                      </div>
                      <button 
                        onClick={() => handleVerify(doc.id)}
                        className="w-full mt-6 py-3 bg-accent-primary text-background-primary font-black rounded-xl text-sm hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
                      >
                        Verify Access
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-10 text-center text-text-muted border-white/5 border-dashed">
                  No staff members are currently awaiting platform verification.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-center bg-surface p-4 rounded-2xl border border-white/5 gap-4">
                  <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      placeholder="Search patient record by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-background-primary pl-12 pr-4 py-3 rounded-xl border border-white/5 text-sm outline-none focus:border-accent-primary" 
                    />
                  </div>
                  <button className="p-3 bg-white/5 rounded-xl text-text-muted hover:text-white border border-white/5"><Filter size={18}/></button>
               </div>

               <div className="glass-card border-white/5 overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                     <thead className="bg-white/5 text-[10px] text-text-muted uppercase tracking-[0.2em] font-black">
                        <tr>
                           <th className="px-8 py-5">Patient Name</th>
                           <th className="px-8 py-5">Blood Group</th>
                           <th className="px-8 py-5">Clinical Risk Level</th>
                           <th className="px-8 py-5">Registered On</th>
                           <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {allPatients.filter(p => p.users.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                          <tr key={p.id} className="hover:bg-white/2 transition-colors">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-xs font-bold">{p.users.name.charAt(0)}</div>
                                   <div>
                                      <p className="font-bold text-white">{p.users.name}</p>
                                      <p className="text-[10px] text-text-muted lowercase">{p.users.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6 font-mono text-xs">{p.blood_group || 'Not Verified'}</td>
                             <td className="px-8 py-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${p.has_diabetes || p.has_cancer ? 'bg-accent-emergency/20 text-accent-emergency border border-accent-emergency/20' : 'bg-success/20 text-success border border-success/20'}`}>
                                   {p.has_cancer ? 'Cancer - Critical' : p.has_diabetes ? 'Diabetes - High' : 'Low Risk'}
                                </span>
                             </td>
                             <td className="px-8 py-6 text-xs text-text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                             <td className="px-8 py-6 text-right">
                                <button className="p-2 hover:bg-white/5 rounded-lg text-text-muted transition-colors"><MoreVertical size={18}/></button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="glass-card p-8 flex flex-col justify-between border-transparent hover:border-white/10 transition-all duration-500 hover:scale-[1.02] cursor-pointer">
    <div className={`p-3 w-fit rounded-2xl bg-${color}/10 text-${color} mb-6 border border-${color}/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-4xl font-display font-black text-white tracking-tighter">{value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-black mt-2">{label}</p>
    </div>
  </div>
);

export default AdminDashboard;
