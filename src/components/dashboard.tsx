"use client";

import { useState, useMemo, useEffect } from "react";
import { isSameDay, isToday, format } from "date-fns";
import { Plus } from "lucide-react";
import type { Task } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTaskDialog } from "./create-task-dialog";
import { Logo } from "./icons";
import { TaskList } from "./task-list";
import { TaskProgress } from "./task-progress";

type DashboardProps = {
  initialTasks: Task[];
};

export function Dashboard({ initialTasks }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const tasksDueToday = tasks.filter(task => !task.isCompleted && isToday(task.dueDate));
    if (tasksDueToday.length > 0) {
      toast({
        title: "Upcoming Deadlines",
        description: `You have ${tasksDueToday.length} task${tasksDueToday.length > 1 ? 's' : ''} due today.`,
      });
    }
  }, [tasks, toast]);

  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'isCompleted'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      isCompleted: false,
    };
    setTasks(prev => [...prev, newTask]);
    toast({ title: "Task Created", description: `"${newTask.title}" has been added.` });
  };
  
  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    toast({ title: "Task Updated", description: `"${updatedTask.title}" has been updated.` });
    setTaskToEdit(null);
  }

  const handleToggleComplete = (id: string, isCompleted: boolean) => {
    setTasks(prev => prev.map(task => (task.id === id ? { ...task, isCompleted } : task)));
  };
  
  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(task => task.id !== id));
    if (taskToDelete) {
        toast({ title: "Task Deleted", description: `"${taskToDelete.title}" has been removed.`, variant: 'destructive'});
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

  const tasksForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((task) => isSameDay(task.dueDate, selectedDate))
      .sort((a, b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1) || a.title.localeCompare(b.title));
  }, [tasks, selectedDate]);
  
  const completedTasksCount = useMemo(() => tasks.filter(t => t.isCompleted).length, [tasks]);

  const taskDateModifiers = {
    taskDays: tasks.filter(t => !t.isCompleted).map(t => t.dueDate),
    completedTaskDays: tasks.filter(t => t.isCompleted).map(t => t.dueDate)
  };
  
  const taskDateModifiersClassNames = {
    taskDays: 'has-task',
    completedTaskDays: 'has-completed-task'
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">TaskWise</h1>
        </div>
        <Button onClick={handleAddNewTaskClick}>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Task
        </Button>
      </header>
      
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr] gap-6 max-w-7xl mx-auto">
          <aside className="space-y-6">
            <TaskProgress totalTasks={tasks.length} completedTasks={completedTasksCount} />
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
          
          <section>
            <h2 className="text-2xl font-bold mb-4">
              Tasks for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : '...'}
            </h2>
            <div className="h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <TaskList 
                tasks={tasksForSelectedDay} 
                onToggleComplete={handleToggleComplete}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
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
