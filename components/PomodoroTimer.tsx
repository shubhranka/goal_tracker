import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { Goal } from '../types';

interface PomodoroTimerProps {
  goal: Goal;
  onClose: () => void;
  onComplete: (completed: boolean) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ goal, onClose, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editableMinutes, setEditableMinutes] = useState('25');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowCompletionDialog(true);
            // Play notification sound or show browser notification
            if (Notification.permission === 'granted') {
              new Notification('Pomodoro Timer Complete!', {
                body: `Time's up for "${goal.title}"`,
                icon: '/favicon.ico'
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, goal.title]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(parseInt(editableMinutes) * 60);
    setShowCompletionDialog(false);
  };

  const handleFinish = () => {
    setIsRunning(false);
    setShowCompletionDialog(true);
  };

  const handleTimeEdit = () => {
    setIsEditingTime(true);
    setIsRunning(false);
  };

  const handleTimeSave = () => {
    const minutes = parseInt(editableMinutes);
    if (minutes > 0 && minutes <= 120) {
      setTimeLeft(minutes * 60);
      setIsEditingTime(false);
    }
  };

  const handleTimeCancel = () => {
    setEditableMinutes(Math.floor(timeLeft / 60).toString());
    setIsEditingTime(false);
  };

  const handleCompleteResponse = (completed: boolean) => {
    onComplete(completed);
    setShowCompletionDialog(false);
    onClose();
  };

  const progress = ((parseInt(editableMinutes) * 60 - timeLeft) / (parseInt(editableMinutes) * 60)) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Pomodoro Timer</h3>
            <p className="text-sm text-slate-600 font-medium">{goal.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <div className="w-48 h-48 mx-auto relative">
            {/* Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="#3b82f6"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
                className={isEditingTime ? "" : "transition-all duration-1000 ease-linear"}
              />
            </svg>
            
            {/* Time Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isEditingTime ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-3 py-2">
                    <input
                      type="number"
                      value={editableMinutes}
                      onChange={(e) => setEditableMinutes(e.target.value)}
                      className="w-12 text-center text-3xl font-bold text-slate-800 font-mono bg-transparent border-none outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                      max="120"
                    />
                    <span className="text-lg text-slate-600 font-medium">min</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTimeSave}
                      className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleTimeCancel}
                      className="px-4 py-1.5 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-slate-800 font-mono">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    {isRunning ? 'Focus Time' : 'Ready to Start'}
                  </div>
                  <button
                    onClick={handleTimeEdit}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Edit duration
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center mb-6">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          
          {(isRunning || timeLeft < parseInt(editableMinutes) * 60) && (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Finish
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        {/* Completion Dialog */}
        {showCompletionDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
              <h4 className="text-lg font-bold text-slate-800 mb-4">Timer Complete!</h4>
              <p className="text-slate-600 mb-6">
                Did you finish the task: "{goal.title}"?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCompleteResponse(true)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Yes, Completed
                </button>
                <button
                  onClick={() => handleCompleteResponse(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Not Yet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
