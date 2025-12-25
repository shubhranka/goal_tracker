import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { suggestSubgoals } from '../services/geminiService';
import { SubgoalSuggestion } from '../types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, subgoals?: SubgoalSuggestion[]) => void;
  parentId?: string | null;
  parentTitle?: string;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, parentId, parentTitle }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedSubgoals, setSuggestedSubgoals] = useState<SubgoalSuggestion[]>([]);

  if (!isOpen) return null;

  const handleAIBSuggest = async () => {
    if (!title) return;
    setIsGenerating(true);
    try {
      const suggestions = await suggestSubgoals(title, description);
      setSuggestedSubgoals(suggestions);
    } catch (e) {
      alert("Failed to generate suggestions. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title, description, suggestedSubgoals.length > 0 ? suggestedSubgoals : undefined);
    // Reset
    setTitle('');
    setDescription('');
    setSuggestedSubgoals([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {parentId ? `Add Subgoal to "${parentTitle}"` : 'Create New Goal'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="e.g. Learn to Play Guitar"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              rows={3}
              placeholder="Add details about your goal..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI Section */}
          <div className="bg-brand-50 p-4 rounded-lg border border-brand-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-brand-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                AI Breakdown
              </h3>
              <button
                onClick={handleAIBSuggest}
                disabled={isGenerating || !title}
                className="text-xs bg-white text-brand-600 px-3 py-1 rounded-full border border-brand-200 hover:bg-brand-50 disabled:opacity-50 font-medium transition-colors"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate Subtasks"}
              </button>
            </div>
            
            {suggestedSubgoals.length > 0 ? (
              <div className="space-y-2 mt-3">
                <p className="text-xs text-brand-700 mb-2">The AI suggests these subgoals. They will be created automatically.</p>
                {suggestedSubgoals.map((sg, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border border-brand-100 text-sm">
                    <span className="font-medium text-gray-800">{sg.title}</span>
                  </div>
                ))}
              </div>
            ) : (
               <p className="text-xs text-brand-400">Enter a title and click generate to get AI-powered subtasks automatically.</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
