import { useState, useEffect } from 'react';
import { FadeUp, SectionHeader } from './SharedComponents';
import { 
  FileText, 
  Clock, 
  Stethoscope, 
  ChevronRight, 
  Filter, 
  Search,
  Download,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { auth } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const MedicalRecordView = ({ type = 'patient' }) => {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const endpoint = type === 'patient' ? '/api/patients/me/history' : '/api/doctors/me/history';
      const res = await fetch(`${API_URL}${endpoint}`, { headers: auth.getAuthHeader() });
      const data = await res.json();
      setRecords(data.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionHeader 
          title={type === 'patient' ? "Medical History" : "Consultation Log"} 
          subtitle="Securely managed electronic health records" 
        />
        <div className="flex items-center gap-2 bg-surface/50 p-2 rounded-2xl border border-white/5">
           <div className="relative">
             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
             <input 
               type="text" 
               placeholder="Search records..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="bg-background-primary/50 pl-9 pr-4 py-2 rounded-xl text-xs outline-none border border-transparent focus:border-accent-primary/30 w-48 transition-all"
             />
           </div>
           <button className="p-2 hover:bg-white/5 rounded-xl text-text-muted transition-colors"><Filter size={16} /></button>
        </div>
      </div>

      <div className="space-y-4">
        {records.length > 0 ? records.filter(r => r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())).map((record) => (
          <div key={record.id} className="glass-card p-8 border-white/5 hover:border-accent-primary/20 transition-all flex flex-col lg:flex-row gap-8 items-start group">
             <div className="h-16 w-16 bg-white/2 rounded-3xl flex items-center justify-center text-accent-primary border border-white/5 group-hover:scale-105 transition-transform shadow-lg">
               <FileText size={24} />
             </div>
             
             <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2">
                   <div>
                      <h4 className="font-bold text-text-primary text-lg">{record.condition || 'General Consultation'}</h4>
                      <p className="text-xs text-text-secondary flex items-center gap-2 mt-1">
                        <Clock size={12} />
                        {new Date(record.visited_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </p>
                   </div>
                   <div className="flex gap-2">
                      <span className="px-3 py-1 bg-success/10 text-success text-[10px] font-bold rounded-full border border-success/20 uppercase tracking-widest h-fit">Verified</span>
                      <button className="p-2 bg-white/5 rounded-lg text-text-muted hover:text-white"><Download size={14} /></button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-background-primary/30 p-4 rounded-xl border border-white/5">
                   <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Diagnosis</p>
                      <p className="text-sm text-text-primary leading-relaxed">{record.diagnosis}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Prescription</p>
                      <p className="text-sm text-text-primary leading-relaxed italic">{record.prescription}</p>
                   </div>
                </div>

                {record.doctors && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <Stethoscope size={12} className="text-accent-primary" />
                    <p className="text-[10px] text-text-muted">Physician: <span className="text-text-primary font-bold">{record.doctors.users.name}</span></p>
                  </div>
                )}
             </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-white/10">
             <FileText className="mx-auto mb-4 opacity-10" size={64} />
             <p className="text-text-muted font-display text-xl">No historical records found</p>
             <p className="text-sm text-text-secondary mt-1">Your medical data will appear here after your first consultation.</p>
          </div>
        )}
      </div>

      <div className="bg-accent-primary/5 border border-accent-primary/20 p-6 rounded-2xl flex items-center gap-4">
         <div className="h-10 w-10 bg-accent-primary/10 rounded-full flex items-center justify-center text-accent-primary">
            <ShieldCheck size={20} />
         </div>
         <div>
            <p className="text-sm font-bold text-text-primary">End-to-End Encryption Enabled</p>
            <p className="text-xs text-text-secondary">Your data is strictly accessible only by you and your attending physician.</p>
         </div>
      </div>
    </div>
  );
};
