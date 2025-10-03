// src/components/dashboard.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { LogOut, Plus } from "lucide-react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { nanoid } from "nanoid";

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
import { useAuth, type User } from "@/hooks/use-auth";
import { TimeLogDialog } from "./time-log-dialog";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

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

  useEffect(() => {
    if (!user) return;

    const tasksCollectionRef = collection(db, "tasks");
    const q = query(tasksCollectionRef, where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

      // If the time log dialog is open, update its task data
      if (timeLogTask) {
        const updatedTask = tasksData.find(t => t.id === timeLogTask.id);
        if (updatedTask) {
          setTimeLogTask(updatedTask);
        }
      }

    }, (error) => {
      console.error("Error fetching tasks with snapshot: ", error);
      const permissionError = new FirestorePermissionError({
        path: tasksCollectionRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [user, timeLogTask?.id]);


  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'timeSpent' | 'userId'>) => {
    const tasksCollectionRef = collection(db, "tasks");
    const dataToSave = {
        ...newTaskData,
        userId: user.uid,
        isCompleted: false,
        timeSpent: 0,
        timeEntries: [],
        dueDate: Timestamp.fromDate(newTaskData.dueDate),
    };
    addDoc(tasksCollectionRef, dataToSave)
    .then(() => {
        toast({ title: "Task Created", description: `"${newTaskData.title}" has been added.` });
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: tasksCollectionRef.path,
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const taskDoc = doc(db, "tasks", updatedTask.id);
    const { id, ...taskData } = updatedTask;

    // Convert Date objects back to Timestamps for Firestore
    const dataToSave = {
      ...taskData,
      dueDate: Timestamp.fromDate(taskData.dueDate),
      timeEntries: (taskData.timeEntries || []).map(entry => ({
        ...entry,
        startTime: Timestamp.fromDate(entry.startTime),
        endTime: Timestamp.fromDate(entry.endTime),
      }))
    };

    updateDoc(taskDoc, dataToSave)
    .then(() => {
        toast({ title: "Task Updated", description: `"${updatedTask.title}" has been updated.` });
        setTaskToEdit(null);
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskDoc.path,
            operation: 'update',
            requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    const taskDoc = doc(db, "tasks", id);
    updateDoc(taskDoc, { isCompleted })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskDoc.path,
            operation: 'update',
            requestResourceData: { isCompleted },
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    const taskDoc = doc(db, "tasks", id);
    deleteDoc(taskDoc)
    .then(() => {
        if (taskToDelete) {
            toast({ title: "Task Deleted", description: `"${taskToDelete.title}" has been removed.`, variant: 'destructive' });
        }
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskDoc.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
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
    
    const newTimeEntry: TimeEntry = {
        id: nanoid(),
        startTime: startTime,
        endTime: endTime,
        duration,
    };
    
    // Convert to Timestamps for Firestore
    const entryForFirestore = {
        ...newTimeEntry,
        startTime: Timestamp.fromDate(newTimeEntry.startTime),
        endTime: Timestamp.fromDate(newTimeEntry.endTime),
    };

    const newTotalTime = (task.timeSpent || 0) + duration;

    const taskDoc = doc(db, "tasks", taskId);
    updateDoc(taskDoc, {
        timeSpent: newTotalTime,
        timeEntries: arrayUnion(entryForFirestore)
    }).catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: taskDoc.path,
            operation: 'update',
            requestResourceData: { timeSpent: newTotalTime, timeEntries: '...' }
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }, [tasks, toast]);
  
  const handleTimeEntryUpdate = async (taskId: string, updatedEntry: TimeEntry) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    const isNewEntry = !updatedEntry.id;
    const finalEntry = isNewEntry ? { ...updatedEntry, id: nanoid() } : updatedEntry;
  
    let updatedEntries: TimeEntry[];
  
    if (isNewEntry) {
      updatedEntries = [...(task.timeEntries || []), finalEntry];
    } else {
      updatedEntries = (task.timeEntries || []).map(entry =>
        entry.id === finalEntry.id ? finalEntry : entry
      );
    }
    
    // We must convert dates back to timestamps before sending to Firestore
    const entriesForFirestore = updatedEntries.map(e => ({
      ...e,
      startTime: Timestamp.fromDate(e.startTime),
      endTime: Timestamp.fromDate(e.endTime),
    }));
  
    const taskDoc = doc(db, "tasks", taskId);
    await updateDoc(taskDoc, {
      timeEntries: entriesForFirestore,
    });
  
    // Recalculate total time
    await recalculateTotalTime(taskId, updatedEntries);
  };

  const handleTimeEntryDelete = async (taskId: string, entryId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timeEntries) return;

    const updatedEntries = task.timeEntries.filter(e => e.id !== entryId);

    // Convert dates back to timestamps for Firestore
    const entriesForFirestore = updatedEntries.map(e => ({
        ...e,
        startTime: Timestamp.fromDate(e.startTime),
        endTime: Timestamp.fromDate(e.endTime),
    }));

    const taskDoc = doc(db, "tasks", taskId);
    await updateDoc(taskDoc, {
        timeEntries: entriesForFirestore
    });
    
    // Recalculate total time
    await recalculateTotalTime(taskId, updatedEntries);
  };
  
  const recalculateTotalTime = async (taskId: string, currentEntries: TimeEntry[]) => {
    const totalTime = currentEntries.reduce((acc, entry) => acc + entry.duration, 0);
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
        timeSpent: totalTime
    });
  };


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
          <span className="text-sm font-medium">Hello, {user?.displayName || user?.email}</span>
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
        key={timeLogTask?.id} // Add key to force re-mount when task changes
        task={timeLogTask}
        isOpen={!!timeLogTask}
        setIsOpen={(isOpen) => !isOpen && setTimeLogTask(null)}
        onTimeEntryUpdate={handleTimeEntryUpdate}
        onTimeEntryDelete={handleTimeEntryDelete}
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
