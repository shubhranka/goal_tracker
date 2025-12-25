import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ProgressData, ProgressDataPoint, Goal } from '../types';
import GoalDetailModal from './GoalDetailModal';

interface ProgressVizProps {
  progressData: ProgressData;
  goals: Goal[];
}

type ViewMode = 'weekly' | 'monthly' | 'yearly';

const BarChart: React.FC<{
  data: ProgressDataPoint[];
  labelKey: 'day' | 'month';
  onBarClick: (goalIds: string[], label: string) => void;
}> = ({ data, labelKey, onBarClick }) => {
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const getLabel = (point: ProgressDataPoint) => {
    if (labelKey === 'day') {
      const dayIndex = (point.day || 0) - 1;
      if(data.length === 7) return weekDays[dayIndex] || `Day ${point.day}`;
      return `Day ${point.day}`
    }
    const monthIndex = (point.month || 0) - 1;
    return months[monthIndex] || `Month ${point.month}`;
  };

  const maxValue = Math.max(...data.map(d => d.progress), 1); // Avoid division by zero
  const SVG_HEIGHT = data.length * 40; // Each bar takes 40 units height
  const LABEL_OFFSET = 50; // Space for labels on the left

  return (
    <div className="w-full relative" style={{ height: `${SVG_HEIGHT}px` }}>
      <svg viewBox={`0 0 1000 ${SVG_HEIGHT}`} preserveAspectRatio="xMidYMin meet" className="w-full h-full">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#A55EEA" />
          </linearGradient>
        </defs>
        {data.map((point, index) => {
          const y = index * 40;
          const label = getLabel(point);
          const barWidth = (point.progress / maxValue) * (1000 - LABEL_OFFSET); // Scale to SVG width minus label offset
          const displayWidth = Math.max(0, barWidth); // Ensure non-negative width

          const textXPosition = displayWidth > 150 ? LABEL_OFFSET + 10 : LABEL_OFFSET + displayWidth + 10;
          const textColor = displayWidth > 150 ? 'fill-white' : 'fill-gray-800';

          return (
            <g key={index} className="group cursor-pointer" onClick={() => onBarClick(point.goalIds, label)}>
              <text x="0" y={y + 25} className="text-sm font-mono fill-gray-500" textAnchor="start">
                {label}
              </text>
              <motion.rect
                x={LABEL_OFFSET}
                y={y + 10}
                width="0"
                height="20"
                fill="url(#barGradient)"
                rx="4"
                ry="4"
                animate={{ width: displayWidth }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              {point.progress > 0 && (
                <text x={textXPosition} y={y + 25} className={`text-sm font-semibold ${textColor}`}>
                  {point.progress} {point.progress === 1 ? 'goal' : 'goals'}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ProgressViz: React.FC<ProgressVizProps> = ({ progressData, goals }) => {
  const [view, setView] = useState<ViewMode>('weekly');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [modalTitle, setModalTitle] = useState('');

  if (!progressData) {
    return <div className="text-gray-400">Loading progress data...</div>;
  }

  const handleBarClick = (goalIds: string[], label: string) => {
    const relevantGoals = goals.filter(g => goalIds.includes(g.id));
    setSelectedGoals(relevantGoals);
    setModalTitle(`Completed Goals for ${label}`);
    setModalOpen(true);
  };

  const views: { id: ViewMode; label: string; data: ProgressDataPoint[]; labelKey: 'day' | 'month' }[] = [
    { id: 'weekly', label: 'Weekly', data: progressData.weekly, labelKey: 'day' },
    { id: 'monthly', label: 'Monthly', data: progressData.monthly.slice(0, 30), labelKey: 'day' },
    { id: 'yearly', label: 'Yearly', data: progressData.yearly, labelKey: 'month' },
  ];

  const currentView = views.find(v => v.id === view);

  return (
    <>
      <GoalDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        goals={selectedGoals}
        title={modalTitle}
      />
      <div className="w-full">
        <div className="flex items-center border-b border-gray-200 mb-6">
          {views.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                view === id
                  ? 'text-brand-500 border-b-2 border-brand-500'
                  : 'text-gray-500 hover:text-brand-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {currentView && <BarChart data={currentView.data} labelKey={currentView.labelKey} onBarClick={handleBarClick} />}
      </div>
    </>
  );
};

export default ProgressViz;
