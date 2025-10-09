// src/components/task-list.tsx
"use client";

import type { Task } from "@/lib/types";
import { TaskItem } from "./task-item";

type TaskListProps = {
  tasks: Task[];
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDelete: (id:string) => void;
  onEdit: (task: Task) => void;
  activeTimer: string | null;
  setActiveTimer: (id: string | null) => void;
  updateTaskTime: (id: string, startTime: Date) => void;
  onTimeLogClick: (task: Task) => void;
};

export function TaskList({ 
  tasks, 
  onToggleComplete, 
  onDelete, 
  onEdit,
  activeTimer,
  setActiveTimer,
  updateTaskTime,
  onTimeLogClick,
}: TaskListProps) {
    
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 p-8 text-center h-full min-h-[300px]">
        <h3 className="text-lg font-semibold text-muted-foreground">No tasks for this day</h3>
        <p className="text-sm text-muted-foreground">Enjoy your free time!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onEdit={onEdit}
          isTimerActive={activeTimer === task.id}
          setActiveTimer={setActiveTimer}
          updateTaskTime={updateTaskTime}
          isAnotherTimerActive={activeTimer !== null && activeTimer !== task.id}
          onTimeLogClick={onTimeLogClick}
        />
      ))}
    </div>
  );
}
