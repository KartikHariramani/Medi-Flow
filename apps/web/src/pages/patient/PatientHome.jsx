import { useState, useEffect } from 'react';
import { FadeUp, TokenCard, SectionHeader } from '../../components/SharedComponents';
import OnboardingQuestionnaire from '../../components/OnboardingQuestionnaire';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Search, 
  FileText, 
  Activity, 
  ArrowRight,
  Stethoscope,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { auth } from '../../lib/auth';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const PatientHome = () => {
  const [user, setUser] = useState(auth.getUser());
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [queueStatus, setQueueStatus] = useState({ position: 0, token: 0, waitTime: 0 });
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const location = useLocation();

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
    "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", 
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  const getInitialTab = () => {
    if (location.pathname.includes('book')) return 'book';
    if (location.pathname.includes('token')) return 'token';
    if (location.pathname.includes('reports')) return 'reports';
    return 'home';
  };

  const activeTab = getInitialTab();

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const currentUser = auth.getUser();
      if (!currentUser) return;
      setUser(currentUser);
      
      // Check if questionnaire is completed
      try {
        const res = await fetch(`${API_URL}/api/patients/me`, { headers: auth.getAuthHeader() });
        const data = await res.json();
        if (data.patient && !data.patient.questionnaire_completed) {
          setShowQuestionnaire(true);
        }
      } catch (e) { console.error('Questionnaire check failed', e); }

      await fetchActiveAppointment();
      await fetchDoctors();
      setIsLoading(false);
    };
    initData();
  }, []);

  const fetchActiveAppointment = async () => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/active`, { headers: auth.getAuthHeader() });
      const data = await res.json();
      if (data.appointment) {
        setActiveAppointment(data.appointment);
        fetchQueuePosition(data.appointment.id);
        subscribeToAppointment(data.appointment.id);
      }
    } catch (err) { console.error(err); }
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_URL}/api/doctors`);
      const data = await res.json();
      setDoctors(data.doctors || []);
    } catch (err) { console.error(err); }
  };

  const fetchQueuePosition = async (appointmentId) => {
    try {
      const { data } = await supabase
        .from('queue')
        .select(`position, appointments!inner(token_number, estimated_wait_time)`)
        .eq('appointment_id', appointmentId)
        .single();
      if (data) {
        setQueueStatus({
          position: data.position,
          token: data.appointments.token_number,
          waitTime: data.appointments.estimated_wait_time || 0
        });
      }
    } catch (err) { console.error(err); }
  };

  const subscribeToAppointment = (appointmentId) => {
    supabase.channel(`queue-${appointmentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue', filter: `appointment_id=eq.${appointmentId}` }, 
      (p) => { if (p.new) setQueueStatus(prev => ({ ...prev, position: p.new.position })); })
      .subscribe();
      
    supabase.channel(`appt-${appointmentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${appointmentId}` }, 
      (p) => { 
        if (p.new.status === 'completed') {
          setActiveAppointment(null);
          setQueueStatus({ position: 0, token: 0, waitTime: 0 });
        } else {
          setActiveAppointment(prev => ({ ...prev, status: p.new.status }));
        }
      })
      .subscribe();
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return alert("Please select a time slot");
    setIsBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { ...auth.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          doctorId: selectedDoctor.id, 
          appointmentDate: bookingDate, 
          timeSlot: selectedSlot,
          symptoms: symptoms
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveAppointment(data.appointment);
        setSelectedDoctor(null);
        window.location.href = '/patient/token';
      } else {
        alert(data.error || "Booking failed");
      }
    } catch (err) { alert("Booking error"); }
    finally { setIsBooking(false); }
  };

  if (showQuestionnaire) {
    return <OnboardingQuestionnaire onComplete={() => setShowQuestionnaire(false)} />;
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4">
      {activeTab === 'home' && (
        <FadeUp>
          <div className="space-y-8">
            <SectionHeader title={`Hello, ${user?.name?.split(' ')[0]}`} subtitle="Experience frictionless healthcare" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div onClick={() => window.location.href='/patient/book'} className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-all border-accent-primary/20 bg-accent-primary/5">
                  <div className="h-12 w-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary mb-4">
                    <CalendarIcon size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-text-primary">New Appointment</h3>
                  <p className="text-xs text-text-secondary mt-1">Book your slot with a specialist</p>
               </div>
               
               <div onClick={() => window.location.href='/patient/token'} className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-all">
                  <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center text-text-primary mb-4">
                    <Activity size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-text-primary">Live Tracker</h3>
                  <p className="text-xs text-text-secondary mt-1">Monitor your queue position</p>
               </div>
            </div>

            {activeAppointment && (
              <div className="glass-card p-4 bg-accent-emergency/5 border-accent-emergency/20 animate-pulse flex items-center gap-4">
                <Clock className="text-accent-emergency" size={20} />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-accent-emergency uppercase tracking-widest">Active Consultation</p>
                  <p className="text-sm text-text-primary">Proceed to room #{activeAppointment.token_number}</p>
                </div>
                <ChevronRight size={18} className="text-text-muted" />
              </div>
            )}
          </div>
        </FadeUp>
      )}

      {activeTab === 'book' && (
        <FadeUp>
          <SectionHeader title="Select Specialist" subtitle="All departments operating at 100% capacity" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {doctors.map(doc => (
               <div key={doc.id} onClick={() => setSelectedDoctor(doc)} className="glass-card p-5 cursor-pointer hover:bg-white/5 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center font-bold text-xl text-accent-primary border border-white/5">
                      {doc.users.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-text-primary group-hover:text-accent-primary transition-colors text-lg">{doc.users.name}</h4>
                      <p className="text-xs text-text-secondary uppercase tracking-[0.2em]">{doc.specialization} • {doc.department}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
               </div>
             ))}
          </div>
        </FadeUp>
      )}

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {selectedDoctor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-background-primary/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-surface w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-white/10 p-8 shadow-2xl relative">
               <button onClick={() => setSelectedDoctor(null)} className="absolute right-6 top-6 text-text-muted hover:text-white">
                 <X size={24} />
               </button>
               
               <div className="flex items-center gap-4 mb-8">
                 <div className="h-16 w-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                    <Stethoscope size={32} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-display text-text-primary">Schedule Visit</h3>
                   <p className="text-sm text-text-secondary">Appointment with {selectedDoctor.users.name}</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-3 px-1">Select Date</label>
                   <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field bg-background-primary border-white/5 text-lg" 
                   />
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-3 px-1">Available Time Slots</label>
                   <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map(slot => (
                        <button 
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 rounded-xl font-bold text-xs transition-all ${selectedSlot === slot ? 'bg-accent-primary text-background-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-white/5 text-text-secondary hover:bg-white/10'}`}
                        >
                          {slot}
                        </button>
                      ))}
                   </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-3 px-1">Symptoms Summary</label>
                   <textarea 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Briefly describe your symptoms (e.g., fever, headache)..."
                    className="input-field bg-background-primary border-white/5 text-sm min-h-[80px] pt-3" 
                   />
                 </div>

                 <button 
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="btn-primary w-full py-5 text-lg shadow-[0_0_30px_rgba(0,229,255,0.3)] mt-4 disabled:opacity-50"
                 >
                   {isBooking ? 'Processing...' : 'Confirm Appointment'}
                 </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'token' && (
        <FadeUp>
          {activeAppointment ? (
            <div className="space-y-8">
              <SectionHeader title="Your Digital Token" subtitle={`Scheduled for ${activeAppointment.appointment_date} at ${activeAppointment.time_slot}`} />
              <TokenCard token={activeAppointment.token_number} isNext={queueStatus.position === 1} />
              
              <div className="glass-card p-6 space-y-6">
                 <div className="flex justify-between items-center text-center">
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Queue Pos</p>
                      <p className="text-3xl font-display text-text-primary">{queueStatus.position}</p>
                    </div>
                    <div className="h-10 w-[1px] bg-white/5"></div>
                    <div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Est. Wait</p>
                      <p className="text-3xl font-display text-text-primary">{queueStatus.waitTime}m</p>
                    </div>
                 </div>
                 
                 <div className="bg-background-primary/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                   <div className="h-10 w-10 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary">
                     <CalendarIcon size={18} />
                   </div>
                   <div className="text-sm">
                      <p className="text-text-muted text-xs">Date & Time</p>
                      <p className="font-bold text-text-primary">{new Date(activeAppointment.appointment_date).toLocaleDateString()} • {activeAppointment.time_slot}</p>
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 px-8 opacity-40">
              <Clock size={48} className="mx-auto mb-4" />
              <p className="font-bold text-xl mb-1">No Active Tokens</p>
              <p className="text-sm">Your scheduled visits will appear here.</p>
            </div>
          )}
        </FadeUp>
      )}
    </div>
  );
};

export default PatientHome;
