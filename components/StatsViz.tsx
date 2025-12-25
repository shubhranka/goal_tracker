import React from 'react';
import { motion } from 'framer-motion';
import { ProgressSnapshot } from '../services/goalService';
import { Info } from 'lucide-react';

interface StatsVizProps {
  total: number;
  completed: number;
  overallProgress: number;
  history: ProgressSnapshot[];
}

const StatsViz: React.FC<StatsVizProps> = ({ total, completed, overallProgress, history }) => {
  const radius = 36; // Slightly smaller to ensure fit
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  const active = total - completed;
  
  // Simple distribution bars
  const completedPct = total > 0 ? (completed / total) * 100 : 0;
  const activePct = total > 0 ? (active / total) * 100 : 0;

  // Graph Calculations
  const renderGraph = () => {
    if (history.length < 2) return null;

    const height = 40;
    const width = 200;
    const minTime = history[0].timestamp;
    const maxTime = history[history.length - 1].timestamp;
    const timeRange = maxTime - minTime || 1;

    // Create points string
    const points = history.map((snap, i) => {
        const x = ((snap.timestamp - minTime) / timeRange) * width;
        const y = height - (snap.progress / 100) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="mt-6">
            <div className="group relative w-fit cursor-help flex items-center gap-1.5 mb-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border-b border-dotted border-slate-700/50 group-hover:border-slate-500 transition-colors">
                    Velocity Graph
                </div>
                <Info size={10} className="text-slate-600 group-hover:text-brand-400 transition-colors" />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 w-48 p-2.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] leading-relaxed rounded-lg shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-50">
                    <p>Visualizes your aggregate progress over time. Slopes indicate momentum as you complete tasks.</p>
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 border-b border-r border-slate-700 transform rotate-45"></div>
                </div>
            </div>

            <div className="relative h-[40px] w-full overflow-hidden border-b border-slate-700/50">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d={`M0,${height} ${points} L${width},${height}`}
                        fill="url(#gradient)"
                        stroke="none"
                    />
                    <motion.polyline
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        points={points}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-4">
        {/* Circle Chart */}
        <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-slate-700/50"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "easeOut" }}
              cx="50%"
              cy="50%"
              r={radius}
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeLinecap="round"
              className="text-brand-400"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono text-white tracking-tighter">
                {Math.round(overallProgress)}<span className="text-xs text-slate-500">%</span>
            </span>
          </div>
        </div>
        
        {/* Stats Legend */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
            <div className="group">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Done</span>
                    <span>{completed}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${completedPct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-green-500" 
                    />
                </div>
            </div>

            <div className="group">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div> Active</span>
                    <span>{active}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${activePct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-slate-500" 
                    />
                </div>
            </div>
        </div>
      </div>
      
      {renderGraph()}
      
    </div>
  );
};

export default StatsViz;