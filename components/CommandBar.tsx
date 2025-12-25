import React, { useState, useRef, useEffect } from 'react';
import { Terminal, CornerDownLeft, Sparkles, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandBarProps {
  onAddGoal: (text: string, withAI: boolean) => void;
  selectedParentTitle?: string | null;
}

const CommandBar: React.FC<CommandBarProps> = ({ onAddGoal, selectedParentTitle }) => {
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Listen for global / key to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '/' && document.activeElement !== inputRef.current) {
            e.preventDefault();
            inputRef.current?.focus();
            setInput((prev) => (prev.startsWith('/') ? prev : '/' + prev));
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Detect AI command
  useEffect(() => {
    if (input.trim().startsWith('/ai')) {
        setIsAiMode(true);
    } else {
        setIsAiMode(false);
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Strip command for AI
    let finalInput = input;
    let useAi = false;

    if (input.trim().startsWith('/ai')) {
        finalInput = input.replace('/ai', '').trim();
        useAi = true;
    }

    if (!finalInput) return;

    onAddGoal(finalInput, useAi);
    setInput('');
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-80 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={handleSubmit} className="relative group">
           <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isAiMode ? 'text-brand-500' : 'text-slate-400'}`}>
             {isAiMode ? <Sparkles size={20} className="animate-pulse" /> : <Terminal size={20} />}
           </div>
           
           <input
             ref={inputRef}
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             className={`
                w-full pl-12 pr-12 py-4 bg-slate-50 border-2 rounded-xl text-lg font-mono text-slate-800 placeholder-slate-400 outline-none transition-all duration-300 shadow-sm
                ${isAiMode ? 'border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100' : 'border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100'}
             `}
             placeholder={selectedParentTitle 
                ? `Add subgoal to "${selectedParentTitle}"... (Type /ai for magic)` 
                : "Create new goal... (Type /ai to auto-breakdown)"
             }
           />

           <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <span className="text-xs font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">⏎</span>
           </div>
        </form>
        
        <AnimatePresence>
            {selectedParentTitle && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-10 left-0 flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-t-lg border border-b-0 border-slate-200"
                >
                    <CornerDownLeft size={12} />
                    <span>Attached to: <span className="font-semibold text-slate-700">{selectedParentTitle}</span></span>
                    <span className="text-[10px] text-slate-400 ml-2">[ESC to detach]</span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommandBar;