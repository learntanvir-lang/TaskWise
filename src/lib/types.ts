export type TaskPriority = {
  label: string;
  value: number;
};
export type TaskCategory = string;

export type TimeEntry = {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
};

export type Task = {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Date;
  priority: number;
  category: TaskCategory;
  isCompleted: boolean;
  timeSpent: number; // in seconds
  timeEntries?: TimeEntry[]; // Array of time entries
};

export const priorities: TaskPriority[] = [
    { label: "Priority 1", value: 1 },
    { label: "Priority 2", value: 2 },
    { label: "Priority 3", value: 3 },
    { label: "Priority 4", value: 4 },
];
export const categories: string[] = ["work", "personal", "shopping", "other"];
