import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Target, Search, BarChart2, Home, List, Edit, Briefcase } from 'lucide-react';
import { Goal, GoalNode } from './types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadGoals, addGoal, updateGoal, deleteGoal, createGoal, buildGoalTree, flattenGoalTree, loadHistory, saveHistory, ProgressSnapshot } from './services/goalService';
import { suggestSubgoals } from './services/geminiService';
import GoalItem from './components/GoalItem';
import CommandBar from './components/CommandBar';
import StatsViz from './components/StatsViz';
import VisualizationPage from './pages/VisualizationPage';
import PomodoroTimer from './components/PomodoroTimer';

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [appMode, setAppMode] = useState<'edit' | 'work'>('edit');
  const [pomodoroGoal, setPomodoroGoal] = useState<Goal | null>(null);

  const { data: goals = [] } = useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: loadGoals,
  });

  const [history, setHistory] = useState<ProgressSnapshot[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
  }, []);

  // Reminder Check Loop
  useEffect(() => {
    const checkReminders = () => {
        const now = Date.now();
        // Check for reminders due within the last minute that haven't been 'handled'
        // For simplicity in this app, we check if it's within a 60s window of 'now'
        // A more robust app would track 'notified' state.
        
        goals.forEach(goal => {
            if (goal.reminder && goal.reminder <= now && goal.reminder > now - 60000) {
                // Trigger notification
                if (Notification.permission === 'granted') {
                    new Notification(`Reminder: ${goal.title}`, {
                        body: "This goal is due now!",
                        icon: '/favicon.ico' // Assuming standard favicon location
                    });
                }
                // Clear reminder or mark as done? Let's clear it to prevent loop
                handleSetReminder(goal.id, undefined); 
            }
        });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [goals]);

  // Derived state: Tree Structure
  const goalTree = useMemo(() => {
    if (viewMode === 'today') {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000; // End of today
      
      const todaysGoals = goals.filter(g => {
        // Skip completed tasks
        if (g.isCompleted) return false;
        
        // Scheduled for today (specific days selected)
        const isScheduledToday = g.scheduledDays && g.scheduledDays.length > 0 && g.scheduledDays.includes(today.getDay());
        // One-time task scheduled for today
        const isOneTimeToday = g.oneTimeTask && g.oneTimeTask >= todayStart && g.oneTimeTask < todayEnd;
        // Unscheduled one-time task (has oneTimeTask field but no date set)
        const isUnscheduledOneTime = g.oneTimeTask === undefined && g.scheduledDays === undefined;
        
        return isScheduledToday || isOneTimeToday || isUnscheduledOneTime;
      });
      return buildGoalTree(todaysGoals);
    }
    return buildGoalTree(goals);
  }, [goals, viewMode]);

  // Filter Logic
  const filteredTree = useMemo(() => {
      if (!searchQuery.trim()) return goalTree;

      const filterNodes = (nodes: GoalNode[]): GoalNode[] => {
          return nodes.reduce((acc, node) => {
              const matches = node.title.toLowerCase().includes(searchQuery.toLowerCase());
              const filteredChildren = filterNodes(node.children);
              
              if (matches || filteredChildren.length > 0) {
                  acc.push({
                      ...node,
                      children: filteredChildren,
                      expanded: true // Always expand matching paths
                  });
              }
              return acc;
          }, [] as GoalNode[]);
      };

      return filterNodes(goalTree);
  }, [goalTree, searchQuery]);

  const visibleGoals = useMemo(() => flattenGoalTree(filteredTree), [filteredTree]);
  const visibleIds = useMemo(() => visibleGoals.map(g => g.id), [visibleGoals]);

  // Stats Logic - calculated from FULL tree, not filtered
  const stats = useMemo(() => {
    const getAllNodes = (nodes: GoalNode[]): GoalNode[] => {
        let all: GoalNode[] = [];
        nodes.forEach(n => {
            all.push(n);
            if (n.children.length > 0) {
                all = [...all, ...getAllNodes(n.children)];
            }
        });
        return all;
    };

    const allNodes = getAllNodes(goalTree);
    const total = allNodes.length;
    const completed = allNodes.filter(n => n.computedProgress === 100).length;
    const rootCount = goalTree.length;
    const overallProgress = rootCount === 0 
        ? 0 
        : goalTree.reduce((acc, node) => acc + node.computedProgress, 0) / rootCount;
    
    return { total, completed, overallProgress };
  }, [goalTree]); 

  // Update History Effect
  useEffect(() => {
      const snapshot: ProgressSnapshot = {
          timestamp: Date.now(),
          progress: stats.overallProgress,
          total: stats.total,
          completed: stats.completed
      };
      
      saveHistory(snapshot);
      
      setHistory(prev => {
         const last = prev[prev.length - 1];
         if (!last || Math.abs(last.progress - snapshot.progress) > 0.1 || (snapshot.timestamp - last.timestamp > 60000)) {
             return [...prev, snapshot];
         }
         return prev;
      });
  }, [stats]);

  const addGoalMutation = useMutation({
    mutationFn: addGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });


  // Handlers
  const handleKeyboardNav = useCallback((e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = selectedId ? visibleIds.indexOf(selectedId) : -1;
        if (idx < visibleIds.length - 1) setSelectedId(visibleIds[idx + 1]);
        else if (visibleIds.length > 0) setSelectedId(visibleIds[0]);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = selectedId ? visibleIds.indexOf(selectedId) : -1;
        if (idx > 0) setSelectedId(visibleIds[idx - 1]);
        else if (visibleIds.length > 0) setSelectedId(visibleIds[visibleIds.length - 1]);
    } else if (e.key === 'Escape') {
        setSelectedId(null);
    }
  }, [visibleIds, selectedId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardNav);
    return () => window.removeEventListener('keydown', handleKeyboardNav);
  }, [handleKeyboardNav]);

  const handleAddGoal = async (title: string, withAI: boolean) => {
    const parentId = selectedId;
    const newGoal = createGoal(title, parentId);
    
    addGoalMutation.mutate(newGoal);
    setSelectedId(newGoal.id);

    if (withAI) {
        try {
            const context = parentId ? goals.find(g => g.id === parentId)?.title : '';
            const subgoals = await suggestSubgoals(title, context ? `This is a subgoal of: ${context}` : undefined);
            
            if (subgoals.length > 0) {
                const subGoalObjects = subgoals.map(sg => 
                    createGoal(sg.title, newGoal.id, sg.description)
                );
                
                subGoalObjects.forEach(subGoal => addGoalMutation.mutate(subGoal));
            }
        } catch (e) {
            console.error("AI failed", e);
        }
    }
  };

  const handleDelete = async (id: string) => {
    const getIdsToDelete = (targetId: string, allGoals: Goal[]): string[] => {
      const children = allGoals.filter(g => g.parentId === targetId);
      const childIds = children.flatMap(c => getIdsToDelete(c.id, allGoals));
      return [targetId, ...childIds];
    };
    const idsToDelete = getIdsToDelete(id, goals);
    
    idsToDelete.forEach(id => deleteGoalMutation.mutate(id));

    if (selectedId === id) setSelectedId(null);
  };

  const handleToggleExpand = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updatedGoal = { ...goal, expanded: !goal.expanded };
      updateGoalMutation.mutate(updatedGoal);
    }
  };

  const handleUpdateProgress = async (id: string, progress: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updatedGoal = { ...goal, progress, isCompleted: progress === 100 };
      updateGoalMutation.mutate(updatedGoal);
    }
  };

  const handleToggleComplete = async (id: string) => {
    const target = goals.find(g => g.id === id);
    if (!target) return;
    const newStatus = !target.isCompleted;

    const getDescendantIds = (rootId: string, allGoals: Goal[]): string[] => {
        const children = allGoals.filter(g => g.parentId === rootId);
        return [...children.map(c => c.id), ...children.flatMap(c => getDescendantIds(c.id, allGoals))];
    };

    const idsToUpdate = [id, ...getDescendantIds(id, goals)];
    const updatedGoals = goals.map(g => {
      if (idsToUpdate.includes(g.id)) {
        return {
          ...g,
          isCompleted: newStatus,
          progress: newStatus ? 100 : 0,
          completedAt: newStatus ? Date.now() : undefined,
        };
      }
      return g;
    });

    updatedGoals.filter(g => idsToUpdate.includes(g.id)).forEach(goal => updateGoalMutation.mutate(goal));
  };

  const handleMoveGoal = async (id: string, direction: 'up' | 'down') => {
      const targetGoal = goals.find(g => g.id === id);
      if (!targetGoal) return;

      // Find all siblings in their current stored order
      const siblings = goals.filter(g => g.parentId === targetGoal.parentId);
      const currentIndex = siblings.findIndex(g => g.id === id);

      if (currentIndex === -1) return;

      let swapIndex = -1;
      if (direction === 'up') {
          swapIndex = currentIndex - 1;
      } else {
          swapIndex = currentIndex + 1;
      }

      // Check bounds
      if (swapIndex < 0 || swapIndex >= siblings.length) return;

      const swapSibling = siblings[swapIndex];

      // Find indices in the main array
      const indexA = goals.findIndex(g => g.id === id);
      const indexB = goals.findIndex(g => g.id === swapSibling.id);

      if (indexA === -1 || indexB === -1) return;

      // Swap in main array
      const newGoals = [...goals];
      newGoals[indexA] = goals[indexB];
      newGoals[indexB] = goals[indexA];
      
      await fetch(`http://localhost:3001/api/goals/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoals),
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
  };

  const handleSetReminder = (id: string, timestamp: number | undefined) => {
      const goal = goals.find(g => g.id === id);
      if (goal) {
        const updatedGoal = { ...goal, reminder: timestamp };
        updateGoalMutation.mutate(updatedGoal);
      }
      if (timestamp && timestamp > Date.now()) {
          // Could show a toast confirmation here
          if (Notification.permission === 'default') {
              Notification.requestPermission();
          }
      }
  };

  const handleToggleScheduledDay = (id: string, day: number) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      let newScheduledDays = goal.scheduledDays ? [...goal.scheduledDays] : [];
      if (newScheduledDays.includes(day)) {
        newScheduledDays = newScheduledDays.filter(d => d !== day);
      } else {
        newScheduledDays.push(day);
      }
      const updatedGoal = { ...goal, scheduledDays: newScheduledDays };
      updateGoalMutation.mutate(updatedGoal);
    }
  };

  const handleSetOneTimeTask = (id: string, date: number | undefined) => {
    const goal = goals.find(g => g.id === id);
    if (goal) {
      const updatedGoal = { ...goal, oneTimeTask: date };
      updateGoalMutation.mutate(updatedGoal);
    }
  };

  const getParentTitle = () => {
      if (!selectedId) return null;
      return goals.find(g => g.id === selectedId)?.title || null;
  };

  const handleGoalClick = (goal: Goal) => {
      if (appMode === 'work') {
          setPomodoroGoal(goal);
      }
  };

  const handlePomodoroComplete = (completed: boolean) => {
      if (!pomodoroGoal) return;
      
      if (completed) {
          handleToggleComplete(pomodoroGoal.id);
      } else {
          // Increase work progress by 25% for a pomodoro session
          const currentProgress = pomodoroGoal.progress || 0;
          const newProgress = Math.min(currentProgress + 25, 99); // Cap at 99% to allow manual completion
          handleUpdateProgress(pomodoroGoal.id, newProgress);
      }
      
      setPomodoroGoal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-slate-900 text-slate-200 border-r border-slate-800 p-6 flex flex-col gap-8 flex-shrink-0 z-20 shadow-2xl relative">
        <div className="flex items-center gap-3 text-brand-400">
          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <Target size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-mono">ASCEND_v1.0</h1>
        </div>

        <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar">
            {/* Mode Toggle */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="text-slate-500 font-bold mb-3 text-xs">MODE</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAppMode('edit')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            appMode === 'edit'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        <Edit size={16} />
                        <span className="text-sm font-medium">Edit</span>
                    </button>
                    <button
                        onClick={() => setAppMode('work')}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                            appMode === 'work'
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                    >
                        <Briefcase size={16} />
                        <span className="text-sm font-medium">Work</span>
                    </button>
                </div>
            </div>

            <StatsViz 
                total={stats.total} 
                completed={stats.completed} 
                overallProgress={stats.overallProgress} 
                history={history}
            />

            <Link to="/" onClick={() => setViewMode('today')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <Home size={20} />
                <span>Home (Today)</span>
            </Link>

            <Link to="/" onClick={() => setViewMode('all')} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <List size={20} />
                <span>All Goals</span>
            </Link>

            <Link to="/visualization" className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors">
                <BarChart2 size={20} />
                <span>Visualizations</span>
            </Link>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-xs font-mono space-y-2">
                <div className="text-slate-500 font-bold mb-2">KEYBOARD SHORTCUTS</div>
                <div className="flex justify-between">
                    <span>Focus Input</span>
                    <span className="bg-slate-700 px-1.5 rounded text-slate-300">/</span>
                </div>
                <div className="flex justify-between">
                    <span>Navigate</span>
                    <span className="bg-slate-700 px-1.5 rounded text-slate-300">↑ ↓</span>
                </div>
                <div className="flex justify-between">
                    <span>Deselect</span>
                    <span className="bg-slate-700 px-1.5 rounded text-slate-300">Esc</span>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-white">
        <Routes>
          <Route path="/" element={
            <>
              <header className="px-8 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-slate-800 tracking-tight font-mono">~/goals</h2>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              appMode === 'edit' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                          }`}>
                              {appMode === 'edit' ? 'Edit Mode' : 'Work Mode'}
                          </span>
                      </div>
                      <p className="text-sm text-slate-400 font-mono">
                          Status: {goals.length > 0 ? 'Tracking' : 'Idle'} • 
                          {appMode === 'edit' 
                              ? ' Add and manage goals' 
                              : ' Click tasks to start Pomodoro timer'}
                      </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative group w-full md:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                      </div>
                      <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-400 sm:text-sm transition-all duration-200"
                          placeholder="Filter goals..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
              </header>

              <div className="flex-1 overflow-y-auto px-8 py-8 pb-32 scroll-smooth">
                  <div className="max-w-4xl mx-auto">
                      <div className="space-y-1 pb-4">
                          {visibleGoals.map(node => (
                              <GoalItem 
                                  key={node.id} 
                                  node={node} 
                                  selectedId={selectedId}
                                  onSelect={setSelectedId}
                                  onToggleExpand={handleToggleExpand}
                                  onDelete={handleDelete}
                                  onUpdateProgress={handleUpdateProgress}
                                  onToggleComplete={handleToggleComplete}
                                  onMove={handleMoveGoal}
                                  onSetReminder={handleSetReminder}
                                  onToggleScheduledDay={handleToggleScheduledDay}
                                  onSetOneTimeTask={handleSetOneTimeTask}
                                  onGoalClick={handleGoalClick}
                                  appMode={appMode}
                                  viewMode={viewMode}
                              />
                          ))}
                      </div>
                      
                      {visibleGoals.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 opacity-40">
                              <Target size={48} className="mb-4 text-slate-300" />
                              <p className="font-mono text-slate-400">
                                  {searchQuery ? 'No matching goals found.' : 'No goals visible. Start typing below.'}
                              </p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Command Bar Area - Only show in edit mode */}
              {appMode === 'edit' && <CommandBar onAddGoal={handleAddGoal} selectedParentTitle={getParentTitle()} />}
            </>
          } />
          <Route path="/visualization" element={<VisualizationPage goals={goals} />} />
        </Routes>

        {/* Pomodoro Timer Modal */}
        {pomodoroGoal && (
          <PomodoroTimer
            goal={pomodoroGoal}
            onClose={() => setPomodoroGoal(null)}
            onComplete={handlePomodoroComplete}
          />
        )}
      </main>
    </div>
  );
};

export default App;