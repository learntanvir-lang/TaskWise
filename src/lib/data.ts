import type { Task, TimeEntry } from "./types";
import { nanoid } from "nanoid";

// Note: id and userId will be replaced by Firestore
export const initialTasks: Omit<Task, 'id' | 'userId'>[] = [
  {
    title: "Finish project proposal",
    description: "Complete the final draft for the Q3 project proposal.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    order: 1,
    category: "work",
    isCompleted: false,
    timeSpent: 0,
    timeEntries: [],
  },
  {
    title: "Buy groceries",
    description: "Milk, bread, cheese, and eggs.",
    dueDate: new Date(),
    order: 2,
    category: "shopping",
    isCompleted: false,
    timeSpent: 0,
    timeEntries: [],
  },
  {
    title: "Schedule dentist appointment",
    description: "Annual check-up.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    order: 3,
    category: "personal",
    isCompleted: false,
    timeSpent: 0,
    timeEntries: [],
  },
  {
    title: "Team meeting",
    description: "Weekly sync-up with the development team.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    order: 4,
    category: "work",
    isCompleted: true,
    timeSpent: 3600, // 1 hour
    timeEntries: [{
        id: nanoid(),
        startTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(10, 0, 0)), 
        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(11, 0, 0)), 
        duration: 3600 
    }],
  },
  {
    title: "Call Mom",
    description: "Catch up with mom.",
    dueDate: new Date(),
    order: 5,
    category: "personal",
    isCompleted: true,
    timeSpent: 900, // 15 minutes
    timeEntries: [{ 
        id: nanoid(),
        startTime: new Date(new Date().setHours(18, 0, 0)), 
        endTime: new Date(new Date().setHours(18, 15, 0)), 
        duration: 900 
    }],
  },
  {
    title: "Renew gym membership",
    description: "Membership expires at the end of the month.",
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    order: 6,
    category: "personal",
    isCompleted: false,
    timeSpent: 0,
    timeEntries: [],
  },
];
