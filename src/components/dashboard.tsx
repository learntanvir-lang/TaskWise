// src/components/dashboard.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { LogOut, Plus } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  writeBatch,
  arrayUnion,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Task, TimeEntry } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTaskDialog } from "./create-task-dialog";
import { Logo } from "./icons";
import { TaskList } from "./task-list";
import { TaskProgress } from "./task-progress";
import { initialTasks } from "@/lib/data";
import { useAuth, type User } from "@/hooks/use-auth";
import { TimeLogDialog } from "./time-log-dialog";

type DashboardProps = {
  user: User;
};

export function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [timeLogTask, setTimeLogTask] = useState<Task | null>(null);

  const tasksCollectionRef = collection(db, "tasks");

  const fetchTasks = useCallback(async () => {
    try {
      const q = query(tasksCollectionRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const userHasSeededQuery = query(
          collection(db, "userFlags"),
          where("userId", "==", user.uid),
          where("hasSeededTasks", "==", true)
        );
        const userHasSeededSnapshot = await getDocs(userHasSeededQuery);

        if (userHasSeededSnapshot.empty) {
          const batch = writeBatch(db);
          initialTasks.forEach(task => {
            const docRef = doc(tasksCollectionRef); // Create a new doc reference
            batch.set(docRef, {
              ...task,
              userId: user.uid,
              dueDate: Timestamp.fromDate(task.dueDate),
              timeEntries: task.timeEntries?.map(entry => ({ ...entry, startTime: Timestamp.fromDate(entry.startTime), endTime: Timestamp.fromDate(entry.endTime) })) || []
            });
          });

          const userFlagRef = doc(collection(db, "userFlags"), user.uid);
          batch.set(userFlagRef, { userId: user.uid, hasSeededTasks: true });

          await batch.commit();
          fetchTasks(); // Re-fetch after seeding
          return;
        }
      }

      const tasksData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dueDate: (data.dueDate as Timestamp).toDate(),
          timeEntries: data.timeEntries?.map((entry: any) => (
            entry && entry.startTime && entry.endTime ? { 
                ...entry, 
                startTime: (entry.startTime as Timestamp).toDate(),
                endTime: (entry.endTime as Timestamp).toDate(),
            } : entry
          )).filter(Boolean) || [],
        } as Task;
      });
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks: ", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks from Firestore.",
        variant: "destructive",
      });
    }
  }, [user.uid, toast, tasksCollectionRef]);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, fetchTasks]);

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'timeSpent' | 'userId'>) => {
    try {
      await addDoc(tasksCollectionRef, {
        ...newTaskData,
        userId: user.uid,
        isCompleted: false,
        timeSpent: 0,
        timeEntries: [],
        dueDate: Timestamp.fromDate(newTaskData.dueDate),
      });
      await fetchTasks();
      toast({ title: "Task Created", description: `"${newTaskData.title}" has been added.` });
    } catch (error) {
      console.error("Error adding task: ", error);
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      const taskDoc = doc(db, "tasks", updatedTask.id);
      const { id, ...taskData } = updatedTask;
      await updateDoc(taskDoc, {
        ...taskData,
        dueDate: Timestamp.fromDate(taskData.dueDate)
      });
      await fetchTasks(); // Re-fetch to get the most accurate data
      toast({ title: "Task Updated", description: `"${updatedTask.title}" has been updated.` });
      setTaskToEdit(null);
    } catch (error) {
      console.error("Error updating task: ", error);
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
    }
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const taskDoc = doc(db, "tasks", id);
      await updateDoc(taskDoc, { isCompleted });
      setTasks(prev => prev.map(task => (task.id === id ? { ...task, isCompleted } : task)));
    } catch (error) {
      console.error("Error toggling task completion: ", error);
      toast({ title: "Error", description: "Failed to update task status.", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    try {
      await deleteDoc(doc(db, "tasks", id));
      setTasks(prev => prev.filter(task => task.id !== id));
      if (taskToDelete) {
        toast({ title: "Task Deleted", description: `"${taskToDelete.title}" has been removed.`, variant: 'destructive' });
      }
    } catch (error) {
      console.error("Error deleting task: ", error);
      toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
    }
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsDialogOpen(true);
  }

  const handleAddNewTaskClick = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  }

  const updateTaskTime = useCallback(async (taskId: string, startTime: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // duration in seconds
    
    const newTimeEntry = {
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        duration,
    };

    const newTotalTime = task.timeSpent + duration;

    try {
        const taskDoc = doc(db, "tasks", taskId);
        await updateDoc(taskDoc, {
            timeSpent: newTotalTime,
            timeEntries: arrayUnion(newTimeEntry)
        });
        
        setTasks(prevTasks =>
            prevTasks.map(t =>
                t.id === taskId ? { 
                    ...t, 
                    timeSpent: newTotalTime,
                    timeEntries: [...(t.timeEntries || []), { 
                        startTime: newTimeEntry.startTime.toDate(), 
                        endTime: newTimeEntry.endTime.toDate(), 
                        duration: newTimeEntry.duration 
                    }]
                } : t
            )
        );
    } catch (error) {
        console.error("Error updating task time: ", error);
        toast({ title: "Error", description: "Failed to log time.", variant: "destructive" });
    }
  }, [tasks, toast]);

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((task) => isSameDay(task.dueDate, selectedDate))
      .sort((a, b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) || a.title.localeCompare(b.title));
  }, [tasks, selectedDate]);

  const completedTasksForSelectedDay = useMemo(() => tasksForSelectedDay.filter(t => t.isCompleted).length, [tasksForSelectedDay]);

  const taskDateModifiers = {
    taskDays: tasks.filter(t => !t.isCompleted).map(t => t.dueDate),
    completedTaskDays: tasks.filter(t => t.isCompleted).map(t => t.dueDate)
  };

  const taskDateModifiersClassNames = {
    taskDays: 'has-task',
    completedTaskDays: 'has-completed-task'
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <header className="flex items-center justify-between p-4 border-b shrink-0 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">TaskWise</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNewTaskClick}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Task
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-[350px_1fr] xl:grid-cols-[400px_1fr] gap-6 max-w-7xl mx-auto">
          <aside className="space-y-6 lg:sticky lg:top-6">
            <TaskProgress
              title="Today's Progress"
              totalTasks={tasksForSelectedDay.length}
              completedTasks={completedTasksForSelectedDay}
            />
            <Card>
              <CardContent className="p-1">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="w-full"
                  modifiers={taskDateModifiers}
                  modifiersClassNames={taskDateModifiersClassNames}
                />
              </CardContent>
            </Card>
          </aside>

          <section className="min-w-0">
            <h2 className="text-2xl font-bold mb-4">
              Tasks for {selectedDate ? format(selectedDate, "PPP") : '...'}
            </h2>
            <div className="h-full">
              <TaskList
                tasks={tasksForSelectedDay}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                activeTimer={activeTimer}
                setActiveTimer={setActiveTimer}
                updateTaskTime={updateTaskTime}
                onTimeLogClick={setTimeLogTask}
              />
            </div>
          </section>
        </div>
      </main>

      <CreateTaskDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onTaskCreate={handleAddTask}
        onTaskUpdate={handleUpdateTask}
        taskToEdit={taskToEdit}
      />

      <TimeLogDialog
        task={timeLogTask}
        isOpen={!!timeLogTask}
        setIsOpen={(isOpen) => !isOpen && setTimeLogTask(null)}
      />

      <style jsx global>{`
        .has-task {
            position: relative;
        }
        .has-task::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: hsl(var(--accent));
        }
        .has-completed-task {
             position: relative;
        }
        .has-completed-task::after {
            content: '';
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: hsl(var(--muted-foreground) / 0.5);
        }
        .rdp-day_selected.has-task::after,
        .rdp-day_selected.has-completed-task::after {
            background-color: hsl(var(--primary-foreground));
        }
      `}</style>
    </div>
  );
}
