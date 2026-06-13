import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Activity, 
  AlertTriangle, 
  Stethoscope, 
  Coffee, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { auth } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const OnboardingQuestionnaire = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState({
    diabetes: null,
    cancer: null,
    hypertension: null,
    medication: null,
    medication_list: '',
    allergies: null,
    allergies_desc: '',
    surgeries: null,
    surgeries_desc: '',
    smoke_alcohol: null,
    symptoms: ''
  });

  const steps = [
    {
      id: 'diabetes',
      question: "Do you have diabetes?",
      icon: Activity,
      type: 'binary',
      field: 'diabetes'
    },
    {
      id: 'cancer',
      question: "Do you have cancer or a history of cancer?",
      icon: Heart,
      type: 'binary',
      field: 'cancer'
    },
    {
      id: 'hypertension',
      question: "Do you have hypertension or blood pressure issues?",
      icon: Activity,
      type: 'binary',
      field: 'hypertension'
    },
    {
      id: 'medication',
      question: "Are you currently on any medication?",
      icon: Stethoscope,
      type: 'binary_with_text',
      field: 'medication',
      textField: 'medication_list',
      placeholder: "Please list your medications..."
    },
    {
      id: 'allergies',
      question: "Do you have any known allergies?",
      icon: AlertTriangle,
      type: 'binary_with_text',
      field: 'allergies',
      textField: 'allergies_desc',
      placeholder: "Describe your allergies..."
    },
    {
      id: 'surgeries',
      question: "Have you had any surgeries in the past?",
      icon: Stethoscope,
      type: 'binary_with_text',
      field: 'surgeries',
      textField: 'surgeries_desc',
      placeholder: "Describe your surgeries..."
    },
    {
      id: 'smoke_alcohol',
      question: "Do you smoke or consume alcohol?",
      icon: Coffee,
      type: 'binary',
      field: 'smoke_alcohol'
    },
    {
      id: 'symptoms',
      question: "What current symptoms are you experiencing?",
      icon: FileText,
      type: 'text_only',
      field: 'symptoms',
      placeholder: "Describe your symptoms (e.g. fever, cough, pain)..."
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else handleSubmit();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const updateAnswer = (field, value) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedAnswers = steps.map(s => {
        let answer = answers[s.field] ? 'Yes' : 'No';
        if (s.type === 'text_only') answer = answers[s.field];
        else if (s.type === 'binary_with_text' && answers[s.field] && answers[s.textField]) {
          answer = `Yes: ${answers[s.textField]}`;
        }
        return { question: s.question, answer };
      });

      const res = await fetch(`${API_URL}/api/patients/me/questionnaire`, {
        method: 'POST',
        headers: {
          ...auth.getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });

      if (res.ok) {
        onComplete();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] bg-background-primary flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-accent-secondary/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-2xl bg-surface/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent-primary shadow-[0_0_15px_rgba(0,229,255,0.6)]"
          />
        </div>

        <div className="mb-12 flex justify-between items-center text-text-muted">
           <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Health Assessment • {step + 1}/{steps.length}</p>
           {step > 0 && (
             <button onClick={handleBack} className="flex items-center gap-2 text-xs hover:text-white transition-colors">
                <ChevronLeft size={16} /> Back
             </button>
           )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
             <div className="space-y-6">
                <div className="h-16 w-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
                   <currentStep.icon size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-display text-text-primary leading-tight">
                   {currentStep.question}
                </h2>
             </div>

             <div className="space-y-6">
                {(currentStep.type === 'binary' || currentStep.type === 'binary_with_text') && (
                  <div className="grid grid-cols-2 gap-4">
                     <button 
                      onClick={() => updateAnswer(currentStep.field, true)}
                      className={`py-6 rounded-3xl font-bold text-lg transition-all border-2 ${answers[currentStep.field] === true ? 'bg-accent-primary border-accent-primary text-background-primary shadow-[0_0_30px_rgba(0,229,255,0.3)]' : 'bg-white/5 border-transparent text-text-secondary hover:bg-white/10'}`}
                     >
                        Yes, I do
                     </button>
                     <button 
                      onClick={() => updateAnswer(currentStep.field, false)}
                      className={`py-6 rounded-3xl font-bold text-lg transition-all border-2 ${answers[currentStep.field] === false ? 'bg-accent-emergency border-accent-emergency text-white shadow-[0_0_30px_rgba(255,60,90,0.2)]' : 'bg-white/5 border-transparent text-text-secondary hover:bg-white/10'}`}
                     >
                        No, skip
                     </button>
                  </div>
                )}

                {((currentStep.type === 'binary_with_text' && answers[currentStep.field] === true) || currentStep.type === 'text_only') && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                     <textarea 
                      value={answers[currentStep.textField || currentStep.field]}
                      onChange={(e) => updateAnswer(currentStep.textField || currentStep.field, e.target.value)}
                      placeholder={currentStep.placeholder}
                      className="w-full bg-background-primary/50 border border-white/5 rounded-2xl p-6 text-sm text-text-primary outline-none focus:border-accent-primary/50 transition-all min-h-[120px] resize-none"
                     />
                  </motion.div>
                )}
             </div>

             <div className="pt-8">
                <button 
                  onClick={handleNext}
                  disabled={answers[currentStep.field] === null && currentStep.type !== 'text_only'}
                  className="w-full btn-primary py-6 text-xl shadow-[0_0_40px_rgba(0,229,255,0.2)] disabled:opacity-30 flex items-center justify-center gap-3 transition-all"
                >
                   {step === steps.length - 1 ? (
                     isSubmitting ? 'Finalizing Profile...' : 'Complete Assessment'
                   ) : (
                     <>Next Step <ChevronRight size={20} /></>
                   )}
                   {step === steps.length - 1 && !isSubmitting && <CheckCircle2 size={24} />}
                </button>
             </div>
          </motion.div>
        </AnimatePresence>

        <p className="mt-8 text-[10px] text-center text-text-muted uppercase tracking-widest opacity-50">
           Your data is encrypted & secure under HIPAA standards
        </p>
      </div>
    </div>
  );
};

export default OnboardingQuestionnaire;
