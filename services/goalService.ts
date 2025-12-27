import { Goal, GoalNode, ProgressData } from "../types";
import { v4 as uuidv4 } from 'uuid';

// import { Goal, GoalNode } from "../types";
// import { v4 as uuidv4 } from 'uuid';

const API_URL = 'https://goal-tracker-backend-uh3k.onrender.com/api/goals';

export interface ProgressSnapshot {
  timestamp: number;
  progress: number;
  total: number;
  completed: number;
}

export const loadGoals = async (): Promise<Goal[]> => {
  try {
    const response = await fetch(API_URL);
    return await response.json();
  } catch (e) {
    console.error("Failed to load goals", e);
    return [];
  }
};

export const addGoal = async (goal: Goal): Promise<Goal> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  return await response.json();
};

export const updateGoal = async (goal: Goal): Promise<Goal> => {
  const response = await fetch(`${API_URL}/${goal.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(goal),
  });
  return await response.json();
};

export const deleteGoal = async (id: string): Promise<void> => {
  await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
};
const HISTORY_KEY = 'goal_progress_history';
export const loadHistory = (): ProgressSnapshot[] => {
    try {
        const saved = localStorage.getItem(HISTORY_KEY);
        // Default to at least one point if empty
        return saved ? JSON.parse(saved) : [{ timestamp: Date.now(), progress: 0, total: 0, completed: 0 }];
    } catch {
        return [];
    }
};

export const saveHistory = (snapshot: ProgressSnapshot) => {
    const history = loadHistory();
    // Simple debouncing: only save if last snapshot was > 1 minute ago or significant change
    const last = history[history.length - 1];
    const now = Date.now();
    
    // Push if it's the first entry, or enough time passed, or value changed significantly
    if (!last || (now - last.timestamp > 60000) || Math.abs(last.progress - snapshot.progress) > 1) {
        const newHistory = [...history, snapshot].slice(-50); // Keep last 50 points
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    }
};

export const createGoal = (title: string, parentId: string | null = null, description?: string): Goal => {
  return {
    id: uuidv4(),
    title,
    description,
    parentId,
    progress: 0,
    isCompleted: false,
    createdAt: Date.now(),
    expanded: true,
  };
};

export const loadProgressData = async (): Promise<ProgressData> => {
  try {
    const response = await fetch(`${API_URL}/progress`);
    return await response.json();
  } catch (e) {
    console.error("Failed to load progress data", e);
    return { weekly: [], monthly: [], yearly: [] };
  }
};

// Recursively build the tree and calculate progress
export const buildGoalTree = (goals: Goal[]): GoalNode[] => {
  const goalMap = new Map<string, GoalNode>();
  
  // 1. Initialize nodes
  goals.forEach(g => {
    goalMap.set(g.id, {
      ...g,
      children: [],
      computedProgress: g.progress,
      isLeaf: true
    });
  });

  const roots: GoalNode[] = [];

  // 2. Build hierarchy
  goals.forEach(g => {
    const node = goalMap.get(g.id)!;
    if (g.parentId && goalMap.has(g.parentId)) {
      const parent = goalMap.get(g.parentId)!;
      parent.children.push(node);
      parent.isLeaf = false;
    } else {
      roots.push(node);
    }
  });

  // 3. Calculate progress bottom-up
  const calculateNodeProgress = (node: GoalNode): number => {
    if (node.children.length === 0) {
      // Leaf node: use its own progress
      // If marked completed, force 100, else use progress slider value
      return node.isCompleted ? 100 : node.progress;
    }
    
    const totalProgress = node.children.reduce((acc, child) => acc + calculateNodeProgress(child), 0);
    const avg = totalProgress / node.children.length;
    node.computedProgress = avg;
    return avg;
  };

  roots.forEach(calculateNodeProgress);

  return roots;
};

// Flattens the tree into a list for rendering, respecting 'expanded' state
export const flattenGoalTree = (nodes: GoalNode[], depth = 0): (GoalNode & { depth: number })[] => {
    return nodes.reduce((acc, node) => {
        acc.push({ ...node, depth });
        if (node.children && node.children.length > 0 && node.expanded) {
            acc.push(...flattenGoalTree(node.children, depth + 1));
        }
        return acc;
    }, [] as (GoalNode & { depth: number })[]);
};
