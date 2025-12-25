export interface Goal {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  progress: number; // 0 to 100 (manual progress for leaf nodes)
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number; // Timestamp for completion
  scheduledDays?: number[]; // Days of week (0=Sun, 1=Mon, ...)
  expanded?: boolean; // UI state for tree view
  reminder?: number; // Timestamp for reminder
}

export interface GoalNode extends Goal {
  children: GoalNode[];
  computedProgress: number; // Calculated from children or self
  isLeaf: boolean;
}

export interface SubgoalSuggestion {
  title: string;
  description: string;
}

export interface ProgressDataPoint {
  day?: number;
  month?: number;
  progress: number;
  goalIds: string[];
}

export interface ProgressData {
  weekly: ProgressDataPoint[];
  monthly: ProgressDataPoint[];
  yearly: ProgressDataPoint[];
}