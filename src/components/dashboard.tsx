// src/components/dashboard.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { format, isSameDay } from "date-fns";
import { Plus, Sparkles, User as UserIcon, KeyRound, LogOut } from "lucide-react";
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
import { TaskList } from "./task-list";
import { TaskProgress } from "./task-progress";
import { useAuth, type User } from "@/hooks/use-auth";
import { TimeLogDialog } from "./time-log-dialog";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";
import { ChangePasswordDialog } from "./change-password-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "./icons";

type DashboardProps = {
  user: User;
};

export function Dashboard({ user }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [isChangePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
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
          timeEntries: (data.timeEntries || []).map((entry: any) => (
            entry && entry.startTime && entry.endTime ? { 
                ...entry,
                id: entry.id || nanoid(),
                startTime: (entry.startTime as Timestamp).toDate(),
                endTime: (entry.endTime as Timestamp).toDate(),
            } : null
          )).filter(Boolean) as TimeEntry[],
        } as Task;
      });
      setTasks(tasksData);

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

    const dataToSave = {
      ...taskData,
      dueDate: Timestamp.fromDate(taskData.dueDate),
      timeEntries: (taskData.timeEntries || []).map(entry => ({
        ...entry,
        id: entry.id || nanoid(),
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
    setCreateTaskDialogOpen(true);
  }

  const handleAddNewTaskClick = () => {
    setTaskToEdit(null);
    setCreateTaskDialogOpen(true);
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
  }, [tasks]);
  
  const handleTimeEntryUpdate = async (taskId: string, updatedEntry: TimeEntry) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
  
    const isNewEntry = !(task.timeEntries || []).some(entry => entry.id === updatedEntry.id);
  
    let updatedEntries: TimeEntry[];
  
    if (isNewEntry) {
      updatedEntries = [...(task.timeEntries || []), updatedEntry];
    } else {
      updatedEntries = (task.timeEntries || []).map(entry =>
        entry.id === updatedEntry.id ? updatedEntry : entry
      );
    }
    
    const entriesForFirestore = updatedEntries.map(e => ({
      ...e,
      startTime: Timestamp.fromDate(e.startTime),
      endTime: Timestamp.fromDate(e.endTime),
    }));
  
    const taskDoc = doc(db, "tasks", taskId);
    await updateDoc(taskDoc, {
      timeEntries: entriesForFirestore,
    });
  
    await recalculateTotalTime(taskId, updatedEntries);
  };

  const handleTimeEntryDelete = async (taskId: string, entryId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.timeEntries) return;

    const entryToDelete = task.timeEntries.find(e => e.id === entryId);
    if (!entryToDelete) return;
    
    const entryForFirestore = {
        ...entryToDelete,
        startTime: Timestamp.fromDate(entryToDelete.startTime),
        endTime: Timestamp.fromDate(entryToDelete.endTime),
    };

    const taskDoc = doc(db, "tasks", taskId);
    await updateDoc(taskDoc, {
        timeEntries: arrayRemove(entryForFirestore)
    });
    
    const updatedEntries = task.timeEntries.filter(e => e.id !== entryId);
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
        <div className="flex items-center gap-4">
           <span className="flex items-center gap-2 text-lg font-bold text-primary">
            <Sparkles className="h-5 w-5" />
            Hello, {user?.displayName || "User"}!
          </span>
          <Button onClick={handleAddNewTaskClick}>
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Add Task
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={user.photoURL ?? ''} />
                  <AvatarFallback>
                    <UserIcon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setChangePasswordDialogOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        isOpen={isCreateTaskDialogOpen}
        setIsOpen={setCreateTaskDialogOpen}
        onTaskCreate={handleAddTask}
        onTaskUpdate={handleUpdateTask}
        taskToEdit={taskToEdit}
      />
      
      <ChangePasswordDialog 
        isOpen={isChangePasswordDialogOpen}
        setIsOpen={setChangePasswordDialogOpen}
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
