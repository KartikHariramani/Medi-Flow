import { motion } from 'framer-motion';

export const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export const TokenCard = ({ token, isNext }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`glass-card p-8 flex flex-col items-center justify-center relative overflow-hidden ${isNext ? 'border-accent-primary ring-2 ring-accent-primary/50' : ''}`}
  >
    {isNext && (
      <div className="absolute inset-0 bg-accent-primary/10 animate-pulse"></div>
    )}
    <h3 className="text-text-secondary font-body uppercase tracking-widest text-sm mb-2 z-10">Token Number</h3>
    <div className="text-7xl font-mono font-bold text-text-primary z-10">
      {token.toString().padStart(3, '0')}
    </div>
  </motion.div>
);

export const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-display text-text-primary mb-2">{title}</h2>
    {subtitle && <p className="text-text-secondary">{subtitle}</p>}
  </div>
);
