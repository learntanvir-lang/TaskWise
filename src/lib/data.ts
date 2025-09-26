import type { Task } from "./types";

// Note: id and userId will be replaced by Firestore
export const initialTasks: Omit<Task, 'id' | 'userId'>[] = [
  {
    title: "Finish project proposal",
    description: "Complete the final draft for the Q3 project proposal.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    priority: "high",
    category: "work",
    isCompleted: false,
    timeSpent: 0,
  },
  {
    title: "Buy groceries",
    description: "Milk, bread, cheese, and eggs.",
    dueDate: new Date(),
    priority: "medium",
    category: "shopping",
    isCompleted: false,
    timeSpent: 0,
  },
  {
    title: "Schedule dentist appointment",
    description: "Annual check-up.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    priority: "low",
    category: "personal",
    isCompleted: false,
    timeSpent: 0,
  },
  {
    title: "Team meeting",
    description: "Weekly sync-up with the development team.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    priority: "high",
    category: "work",
    isCompleted: true,
    timeSpent: 3600, // 1 hour
  },
  {
    title: "Call Mom",
    description: "Catch up with mom.",
    dueDate: new Date(),
    priority: "medium",
    category: "personal",
    isCompleted: true,
    timeSpent: 900, // 15 minutes
  },
  {
    title: "Renew gym membership",
    description: "Membership expires at the end of the month.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    priority: "low",
    category: "personal",
    isCompleted: false,
    timeSpent: 0,
  },
];
