export interface Goal {
  id: string;
  title: string;
  description?: string;
  parentId: string | null;
  progress: number; // 0 to 100 (manual progress for leaf nodes)
  isCompleted: boolean;
  createdAt: number;
  completedAt?: number;
  scheduledDays?: number[]; // Days of week (0=Sun, 1=Mon, ...)
  expanded?: boolean; // UI state for tree view
  reminder?: number; // Timestamp for reminder
}
