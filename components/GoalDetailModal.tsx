import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Goal } from '../types';
import { X } from 'lucide-react';

interface GoalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  title: string;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ isOpen, onClose, goals, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4">{title}</h3>
            {goals.length > 0 ? (
              <ul className="space-y-3">
                {goals.map((goal) => (
                  <li key={goal.id} className="p-3 bg-gray-50 rounded-md shadow-sm">
                    <p className="font-semibold">{goal.title}</p>
                    {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No goals completed for this period.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GoalDetailModal;
