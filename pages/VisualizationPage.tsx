import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadProgressData } from '../services/goalService';
import ProgressViz from '../components/ProgressViz';
import { ProgressData, Goal } from '../types';

interface VisualizationPageProps {
  goals: Goal[];
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ goals }) => {
  const { data: progressData } = useQuery<ProgressData, Error>({
    queryKey: ['progressData'],
    queryFn: loadProgressData,
  });

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-800 tracking-tight font-mono mb-8">
        Visualizations
      </h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {progressData ? (
          <ProgressViz progressData={progressData} goals={goals} />
        ) : (
          <div className="text-gray-400">Loading progress data...</div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPage;
