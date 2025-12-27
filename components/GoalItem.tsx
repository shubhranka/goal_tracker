import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  CheckCircle2, 
  Circle,
  X,
  ArrowUp,
  ArrowDown,
  Bell,
  BellRing,
  Calendar
} from 'lucide-react';
import { GoalNode } from '../types';
import { generateMotivation } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalItemProps {
  node: GoalNode & { depth: number };
  isSelected?: boolean;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onToggleExpand: (id:string) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onToggleComplete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onSetReminder: (id: string, timestamp: number | undefined) => void;
  onToggleScheduledDay: (id: string, day: number) => void;
  onSetOneTimeTask: (id: string, date: number | undefined) => void;
  onGoalClick?: (goal: GoalNode) => void;
  appMode?: 'edit' | 'work';
  viewMode?: 'today' | 'all';
}

const GoalItem: React.FC<GoalItemProps> = ({ 
  node, 
  isSelected,
  selectedId, 
  onSelect,
  onToggleExpand, 
  onDelete,
  onUpdateProgress,
  onToggleComplete,
  onMove,
  onSetReminder,
  onToggleScheduledDay,
  onSetOneTimeTask,
  onGoalClick,
  appMode = 'edit',
  viewMode = 'today'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const oneTimeDateRef = useRef<HTMLInputElement>(null);

  const hasChildren = node.children.length > 0;
  const isCompleted = node.computedProgress === 100;
  const active = isSelected || (selectedId === node.id);
  const hasReminder = node.reminder && node.reminder > Date.now();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Auto reset delete confirmation after 3s
  useEffect(() => {
    if (confirmDelete) {
        const timer = setTimeout(() => setConfirmDelete(false), 3000);
        return () => clearTimeout(timer);
    }
    return undefined;
  }, [confirmDelete]);

  const handleGetMotivation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = await generateMotivation(node.title, node.computedProgress);
    setMotivation(msg);
    setTimeout(() => setMotivation(null), 5000);
  };

  const handleRowClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (appMode === 'work' && onGoalClick && !isCompleted && viewMode === 'today') {
          onGoalClick(node);
      } else {
          onSelect(node.id);
      }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirmDelete) {
          onDelete(node.id);
      } else {
          setConfirmDelete(true);
      }
  };

  const cancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDelete(false);
  }

  const handleReminderClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (node.reminder) {
          dateInputRef.current?.showPicker();
      } else {
          dateInputRef.current?.showPicker();
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
          onSetReminder(node.id, new Date(e.target.value).getTime());
      } else {
          onSetReminder(node.id, undefined);
      }
  };

  const handleOneTimeTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    oneTimeDateRef.current?.showPicker();
  };

  const handleOneTimeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onSetOneTimeTask(node.id, new Date(e.target.value).getTime());
    } else {
      onSetOneTimeTask(node.id, undefined);
    }
  };
  
  return (
    <div 
      className="select-none relative font-mono mb-1"
    >
      <div 
        className={`
          group relative flex items-center gap-3 p-2 rounded-lg transition-all duration-200 border cursor-pointer
          ${active 
            ? 'bg-brand-50/80 border-brand-200 shadow-sm' 
            : appMode === 'work'
            ? 'bg-transparent border-transparent hover:bg-green-50 hover:border-green-200'
            : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'}
        `}
        style={{ marginLeft: `${node.depth * 24}px` }}
        onClick={handleRowClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Guide Line for nested items */}
        {node.depth > 0 && (
             <div className="absolute -left-[13px] top-0 bottom-0 w-px border-l border-dashed border-slate-200" />
        )}

        {/* Active Marker */}
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-500 rounded-r-full" />
        )}

        {/* Move Controls */}
        <div className={`flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -ml-1 ${appMode === 'work' ? 'hidden' : ''}`}>
             <button 
                onClick={(e) => { e.stopPropagation(); onMove(node.id, 'up'); }}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-300 hover:text-brand-500"
                title="Move Up"
             >
                 <ArrowUp size={10} />
             </button>
             <button 
                onClick={(e) => { e.stopPropagation(); onMove(node.id, 'down'); }}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-300 hover:text-brand-500"
                title="Move Down"
             >
                 <ArrowDown size={10} />
             </button>
        </div>

        {/* Expand Toggle */}
        <button 
          onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
          }}
          className={`
            p-1 rounded hover:bg-slate-200 text-slate-400 transition-colors z-10 flex-shrink-0
            ${!hasChildren || appMode === 'work' ? 'invisible' : ''}
          `}
        >
          {node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Checkbox */}
        <button 
          onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(node.id);
          }}
          className={`
            transition-colors duration-300 flex-shrink-0 z-10
            ${isCompleted ? 'text-green-500' : 'text-slate-300 hover:text-brand-500'}
            ${appMode === 'work' ? 'invisible' : ''}
          `}
        >
          {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </button>

        {/* Title & Progress */}
        <div className="flex-1 min-w-0 flex flex-col z-0">
          <div className="flex items-center gap-2">
            {/* Work Mode Indicator */}
            {appMode === 'work' && !isCompleted && viewMode === 'today' && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                Start session
              </span>
            )}
            <h3 className={`text-sm truncate font-medium font-sans ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>
              {node.title}
            </h3>
            
            {/* Reminder Indicator (Visible if set) */}
            {node.reminder && node.reminder > Date.now() && (
                 <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                     <BellRing size={10} />
                     {new Date(node.reminder).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
            )}
            
            {node.scheduledDays !== undefined && node.scheduledDays.length > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar size={10} />
                {node.scheduledDays.map(day => daysOfWeek[day]).join(', ')}
              </span>
            )}
            
            {node.oneTimeTask && (
              <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Calendar size={10} />
                {new Date(node.oneTimeTask).toLocaleDateString()}
              </span>
            )}
          </div>
          
          {!isCompleted && (
            <div className="flex items-center gap-2 mt-1 h-1 pr-4">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${node.computedProgress}%` }}
                    className="h-full bg-brand-500 rounded-full"
                    />
                </div>
            </div>
          )}

          {/* Slider for Leaf Nodes */}
          {node.isLeaf && !isCompleted && active && appMode === 'edit' && (
             <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="pt-2 pr-4"
             >
                 <input
                    type="range"
                    min="0"
                    max="100"
                    value={node.progress}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on slider
                    onChange={(e) => onUpdateProgress(node.id, parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
             </motion.div>
          )}
        </div>

        {/* Actions - Always mounted, visibility toggled */}
        <div className={`flex items-center gap-2 z-10 transition-opacity duration-200 ${appMode === 'work' ? 'opacity-0 pointer-events-none' : (isHovered || active || confirmDelete ? 'opacity-100' : 'opacity-0')}`}>
           {!confirmDelete ? (
              <>
                <div className="flex items-center gap-1">
                    {daysOfWeek.map((day, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); onToggleScheduledDay(node.id, i); }}
                            className={`w-6 h-6 text-xs font-mono rounded-full flex items-center justify-center transition-colors
                                ${node.scheduledDays?.includes(i) ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title={`Toggle ${day} scheduling`}
                        >
                            {day.charAt(0)}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <button
                        onClick={handleReminderClick}
                        className={`p-1.5 rounded transition-colors ${hasReminder ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:bg-slate-100 hover:text-brand-500'}`}
                        title="Set Reminder"
                    >
                        {hasReminder ? <BellRing size={14} /> : <Bell size={14} />}
                    </button>
                    {/* Hidden Date Input */}
                    <input 
                        ref={dateInputRef}
                        type="datetime-local"
                        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                        onChange={handleDateChange}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <div className="relative">
                    <button
                        onClick={handleOneTimeTaskClick}
                        className={`p-1.5 rounded transition-colors ${node.oneTimeTask ? 'text-purple-500 bg-purple-50' : 'text-slate-400 hover:bg-slate-100 hover:text-purple-500'}`}
                        title="Set One-Time Task"
                    >
                        <Calendar size={14} />
                    </button>
                    {/* Hidden Date Input */}
                    <input 
                        ref={oneTimeDateRef}
                        type="date"
                        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                        onChange={handleOneTimeDateChange}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                <button
                    onClick={handleGetMotivation}
                    className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 hover:bg-brand-100 rounded border border-brand-100"
                >
                    AI
                </button>
                <button 
                    onClick={handleDeleteClick}
                    className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded transition-colors"
                >
                    <Trash2 size={14} />
                </button>
              </>
           ) : (
               <div className="flex items-center bg-red-50 rounded-lg border border-red-100 overflow-hidden">
                   <button 
                    onClick={handleDeleteClick}
                    className="px-2 py-1 text-xs text-red-600 font-medium hover:bg-red-100 flex items-center gap-1"
                   >
                       Delete?
                   </button>
                   <div className="w-px h-4 bg-red-200"></div>
                   <button 
                    onClick={cancelDelete}
                    className="px-1.5 py-1 text-red-400 hover:text-red-700 hover:bg-red-100"
                   >
                       <X size={12} />
                   </button>
               </div>
           )}
        </div>

        {/* Motivation Popup */}
        <AnimatePresence>
            {motivation && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute right-0 top-full mt-2 z-30 bg-slate-900 text-slate-100 text-xs px-3 py-2 rounded shadow-xl border border-slate-700 max-w-[200px]"
                >
                    <div className="absolute -top-1 right-8 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 transform rotate-45"></div>
                    {motivation}
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default GoalItem;