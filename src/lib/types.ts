export type TaskPriority = "low" | "medium" | "high";
export type TaskCategory = string;

export type TimeEntry = {
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
  priority: TaskPriority;
  category: TaskCategory;
  isCompleted: boolean;
  timeSpent: number; // in seconds
  timeEntries?: TimeEntry[]; // Array of time entries
};

export const priorities: TaskPriority[] = ["low", "medium", "high"];
export const categories: string[] = ["work", "personal", "shopping", "other"];
