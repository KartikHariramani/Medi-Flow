import { useState, useEffect } from 'react';
import { FadeUp, SectionHeader } from '../../components/SharedComponents';
import { motion, AnimatePresence } from 'framer-motion';
import * as history from '../../components/MedicalRecordSystem';
import { 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Stethoscope, 
  ChevronLeft,
  ChevronRight,
  Activity,
  Calendar,
  X // Added X for table row removal
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/auth';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', timing: '' }]);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'history'
  const location = useLocation();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (doctor) fetchAppointments();
  }, [currentDate, doctor]);

  const init = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctors/me`, { headers: auth.getAuthHeader() });
      const data = await res.json();
      if (data.doctor) {
        setDoctor(data.doctor);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctors/${doctor.id}/appointments?date=${currentDate}`, {
        headers: auth.getAuthHeader()
      });
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
        if (data.appointments.length > 0 && !selectedAppt) {
          setSelectedAppt(data.appointments[0]);
          setDiagnosis('');
          setMedicines([{ name: '', dosage: '', timing: '' }]);
        }
      }
    } catch (err) { console.error(err); }
  };

  const shiftDate = (days) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + days);
    setCurrentDate(d.toISOString().split('T')[0]);
  };

  const handleComplete = async () => {
    if (!selectedAppt || isCompleting) return;
    setIsCompleting(true);
    try {
      const res = await fetch(`${API_URL}/api/doctors/me/complete`, {
        method: 'POST',
        headers: { ...auth.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appointmentId: selectedAppt.id,
          diagnosis: diagnosis || "Consultation Completed",
          prescription: medicines.filter(m => m.name) // Pass the array of medicine objects
        })
      });
      if (res.ok) {
        setAppointments(prev => prev.map(a => a.id === selectedAppt.id ? { ...a, status: 'completed' } : a));
        setSelectedAppt(null);
        fetchAppointments();
      }
    } catch (err) { console.error(err); }
    finally { setIsCompleting(false); }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <p className="text-accent-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Physician Terminal</p>
           <h1 className="text-4xl font-display text-text-primary">Clinical Workspace</h1>
        </div>

        <div className="flex bg-surface/50 p-1.5 rounded-2xl border border-white/5 shadow-inner">
           <button 
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'logs' ? 'bg-accent-primary text-background-primary shadow-lg' : 'text-text-muted hover:text-white'}`}
           >
             <Clock size={18} />
             Daily Log
           </button>
           <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-3 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'history' ? 'bg-accent-primary text-background-primary shadow-lg' : 'text-text-muted hover:text-white'}`}
           >
             <FileText size={18} />
             Patient History
           </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <div className="glass-card p-8">
           <history.MedicalRecordView type="doctor" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Date Header Picker */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-surface p-6 rounded-3xl border border-white/5 gap-6">
            <div className="flex items-center gap-4">
               <div className="h-14 w-14 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                 <Calendar size={28} />
               </div>
               <div>
                 <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Medical Log</h3>
                 <h2 className="text-2xl font-display text-text-primary">{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
               </div>
            </div>

            <div className="flex items-center gap-2 bg-background-primary p-2 rounded-2xl border border-white/5">
               <button onClick={() => shiftDate(-1)} className="p-3 hover:bg-white/5 rounded-xl text-text-primary transition-all"><ChevronLeft size={20} /></button>
               <input 
                type="date" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent text-text-primary font-bold px-4 outline-none border-x border-white/5" 
               />
               <button onClick={() => shiftDate(1)} className="p-3 hover:bg-white/5 rounded-xl text-text-primary transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Appointments List */}
            <div className="lg:col-span-1 space-y-4">
               <div className="flex justify-between items-center px-2">
                 <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest">Appointments</h3>
                 <span className="text-xs bg-accent-primary/10 text-accent-primary px-3 py-1 rounded-full font-bold">{appointments.length} Total</span>
               </div>

               <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {appointments.map((appt) => (
                    <div 
                      key={appt.id} 
                      onClick={() => setSelectedAppt(appt)}
                      className={`p-5 rounded-2xl cursor-pointer border-2 transition-all relative group overflow-hidden ${selectedAppt?.id === appt.id ? 'bg-surface border-accent-primary shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'bg-background-secondary border-transparent hover:border-white/10'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-accent-primary font-mono bg-accent-primary/10 px-2 py-0.5 rounded">#{appt.token_number}</span>
                        <span className="text-[10px] text-text-muted font-bold">{appt.time_slot}</span>
                      </div>
                      <h4 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors truncate text-lg">{appt.patients.users.name}</h4>
                      <div className="flex justify-between items-center mt-2">
                         <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${appt.status === 'completed' ? 'bg-success/20 text-success' : 'bg-accent-warning/20 text-accent-warning'}`}>
                           {appt.status}
                         </span>
                         {appt.priority === 'emergency' && <AlertCircle size={14} className="text-accent-emergency animate-pulse" />}
                      </div>
                    </div>
                  ))}

                  {appointments.length === 0 && (
                    <div className="text-center py-20 bg-white/2 rounded-3xl border border-dashed border-white/10">
                       <Stethoscope className="mx-auto mb-4 opacity-10" size={48} />
                       <p className="text-text-muted">No appointments found.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Workspace: Consultation Area */}
            <div className="lg:col-span-2 space-y-6">
               <AnimatePresence mode="wait">
                 {selectedAppt ? (
                   <motion.div key={selectedAppt.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                     <div className="glass-card p-8 border-white/5 bg-gradient-to-br from-surface to-background-tertiary">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-white/5 pb-8 mb-8">
                           <div>
                              <p className="text-accent-primary text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Active Consultation</p>
                              <h2 className="text-4xl font-display text-text-primary">{selectedAppt.patients.users.name}</h2>
                              <p className="text-text-secondary mt-1 tracking-wide">{selectedAppt.time_slot} • Token #{selectedAppt.token_number}</p>
                           </div>
                           
                           {selectedAppt.status !== 'completed' && (
                             <button onClick={handleComplete} disabled={isCompleting} className="btn-primary shadow-[0_0_30px_rgba(0,229,255,0.4)] flex items-center gap-3 px-8">
                                {isCompleting ? <Clock className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                Complete Session
                             </button>
                           )}
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                           {/* CASE SNAPSHOT */}
                           <div className="p-6 bg-background-primary/50 rounded-3xl border border-white/5 relative group overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                 <FileText size={80} />
                              </div>
                              <p className="text-[10px] text-text-muted uppercase font-bold tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Activity size={12} className="text-accent-primary" /> Case Summary
                              </p>
                              <p className="text-text-primary leading-relaxed">{selectedAppt.symptoms || 'Patient reported no specific symptoms.'}</p>
                           </div>

                           {/* CLINICAL INPUTS */}
                           <div className="space-y-8">
                             <div>
                                <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest px-1 mb-4 flex items-center gap-2">
                                  <Stethoscope size={14} className="text-accent-secondary" /> Clinical Diagnosis
                                </h4>
                                <textarea 
                                  value={diagnosis}
                                  onChange={(e) => setDiagnosis(e.target.value)}
                                  className="w-full bg-background-primary/30 p-5 rounded-2xl border border-white/5 outline-none resize-none text-text-primary placeholder:text-text-muted focus:border-accent-primary/50 transition-all min-h-[100px]" 
                                  placeholder="Enter diagnosis and findings..."
                                ></textarea>
                             </div>

                             <div>
                                <div className="flex justify-between items-center mb-4 px-1">
                                   <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                     <Activity size={14} className="text-accent-primary" /> Prescription Table
                                   </h4>
                                   <button 
                                    onClick={() => setMedicines([...medicines, { name: '', dosage: '', timing: '' }])}
                                    className="text-[10px] font-bold text-accent-primary hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest"
                                   >
                                     + Add Row
                                   </button>
                                </div>
                                <div className="bg-background-primary/30 rounded-3xl border border-white/5 overflow-hidden shadow-inner">
                                   <table className="w-full text-left text-sm">
                                      <thead>
                                         <tr className="bg-white/2 text-[10px] uppercase tracking-widest text-text-muted border-b border-white/5">
                                            <th className="px-6 py-4 font-bold">Medicine Name</th>
                                            <th className="px-6 py-4 font-bold">Dosage</th>
                                            <th className="px-6 py-4 font-bold">Timing / Notes</th>
                                            <th className="px-6 py-4"></th>
                                         </tr>
                                      </thead>
                                      <tbody>
                                         {medicines.map((med, idx) => (
                                           <tr key={idx} className="border-b border-white/5 last:border-none hover:bg-white/2 transition-colors">
                                              <td className="px-4 py-2">
                                                 <input 
                                                  value={med.name} 
                                                  onChange={(e) => {
                                                    const newMeds = [...medicines];
                                                    newMeds[idx].name = e.target.value;
                                                    setMedicines(newMeds);
                                                  }}
                                                  className="bg-transparent w-full p-2 outline-none text-text-primary placeholder:opacity-20" 
                                                  placeholder="e.g. Paracetamol" 
                                                 />
                                              </td>
                                              <td className="px-4 py-2">
                                                 <input 
                                                  value={med.dosage} 
                                                  onChange={(e) => {
                                                    const newMeds = [...medicines];
                                                    newMeds[idx].dosage = e.target.value;
                                                    setMedicines(newMeds);
                                                  }}
                                                  className="bg-transparent w-full p-2 outline-none text-text-primary placeholder:opacity-20 font-mono text-xs" 
                                                  placeholder="500mg" 
                                                 />
                                              </td>
                                              <td className="px-4 py-2">
                                                 <input 
                                                  value={med.timing} 
                                                  onChange={(e) => {
                                                    const newMeds = [...medicines];
                                                    newMeds[idx].timing = e.target.value;
                                                    setMedicines(newMeds);
                                                  }}
                                                  className="bg-transparent w-full p-2 outline-none text-text-primary placeholder:opacity-20 italic text-xs" 
                                                  placeholder="After breakfast" 
                                                 />
                                              </td>
                                              <td className="px-4 py-2 text-right">
                                                 {medicines.length > 1 && (
                                                   <button onClick={() => setMedicines(medicines.filter((_, i) => i !== idx))} className="p-2 text-accent-emergency opacity-40 hover:opacity-100 transition-opacity">
                                                      <X size={14} />
                                                   </button>
                                                 )}
                                              </td>
                                           </tr>
                                         ))}
                                      </tbody>
                                   </table>
                                </div>
                             </div>
                           </div>
                        </div>
                     </div>
                   </motion.div>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-center p-20 glass-card grayscale border-dashed border-white/5 opacity-40 min-h-[500px]">
                      <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Stethoscope size={48} className="text-text-muted" />
                      </div>
                      <h2 className="text-2xl font-display text-white">Workspace Ready</h2>
                      <p className="text-sm max-w-xs mx-auto mt-2 text-text-secondary">Select a patient from the daily log to start high-priority consultation.</p>
                   </div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
