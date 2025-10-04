
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Briefcase,
  Calendar as CalendarIcon,
  Clock,
  Home,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  ShoppingBasket,
  Square,
  Trash2,
  Tag,
  GripVertical
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

type TaskItemProps = {
  task: Task;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDelete: (id:string) => void;
  onEdit: (task: Task) => void;
  isTimerActive: boolean;
  setActiveTimer: (id: string | null) => void;
  updateTaskTime: (id: string, startTime: Date) => void;
  isAnotherTimerActive: boolean;
  onTimeLogClick: (task: Task) => void;
};


const categoryIcons: Record<string, React.ReactNode> = {
  work: <Briefcase className="h-4 w-4" />,
  personal: <Home className="h-4 w-4" />,
  shopping: <ShoppingBasket className="h-4 w-4" />,
  other: <Plus className="h-4 w-4" />,
  default: <Tag className="h-4 w-4" />,
};

const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    return categoryIcons[lowerCategory] || categoryIcons.default;
}

export function TaskItem({ 
  task, 
  onToggleComplete, 
  onDelete, 
  onEdit,
  isTimerActive,
  setActiveTimer,
  updateTaskTime,
  isAnotherTimerActive,
  onTimeLogClick
}: TaskItemProps) {
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerStartTimeRef = useRef<Date | null>(null);
  const isOverdue = !task.isCompleted && isPast(task.dueDate) && !isToday(task.dueDate);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  const handleTimerToggle = useCallback(() => {
    if (isTimerActive) {
      // Stop timer
      if (timerStartTimeRef.current) {
        updateTaskTime(task.id, timerStartTimeRef.current);
      }
      setActiveTimer(null);
      setElapsedTime(0);
      timerStartTimeRef.current = null;
      toast({ title: "Timer Stopped", description: `Time logged for "${task.title}".` });
    } else {
      // Start timer
      if (isAnotherTimerActive) {
        toast({ title: "Another Timer Active", description: "Please stop the other timer before starting a new one.", variant: "destructive" });
        return;
      }
      timerStartTimeRef.current = new Date();
      setActiveTimer(task.id);
      toast({ title: "Timer Started", description: `Timing task "${task.title}".` });
    }
  }, [isTimerActive, isAnotherTimerActive, task.id, task.title, setActiveTimer, updateTaskTime, toast]);
  
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        seconds > 0 || (hours === 0 && minutes === 0) ? `${seconds}s` : '',
    ].filter(Boolean).join(' ').trim();
  }

  const totalTime = task.timeSpent + elapsedTime;

  return (
    <Card className={cn("transition-all", task.isCompleted && "bg-muted/50", isOverdue && "border-destructive/50")}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
        <div className="flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <Checkbox
              id={`task-${task.id}`}
              checked={task.isCompleted}
              onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
              aria-label={`Mark ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
            />
        </div>
        <CardTitle className={cn("flex-1 text-base font-medium", task.isCompleted && "text-muted-foreground line-through")}>
          {task.title}
        </CardTitle>
        <div className="flex items-center gap-2">
            {!task.isCompleted && (
                 <Button
                    variant={isTimerActive ? "destructive" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleTimerToggle}
                    disabled={isAnotherTimerActive && !isTimerActive}
                    aria-label={isTimerActive ? 'Stop timer' : 'Start timer'}
                 >
                    {isTimerActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                 </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      {task.description && (
        <CardContent className="px-4 pb-2 pt-0 ml-12">
          <p className={cn("text-sm text-muted-foreground", task.isCompleted && "line-through")}>
            {task.description}
          </p>
        </CardContent>
      )}
      <CardFooter className="flex flex-wrap items-center gap-2 p-4 pt-0 ml-12">
        <Badge variant="outline" className={cn(
          "text-xs", 
          isOverdue ? "border-destructive text-destructive" : "border-primary"
        )}>
          <CalendarIcon className="mr-1 h-3 w-3" />
          {isToday(task.dueDate) ? "Today" : format(task.dueDate, "MMM d")}
        </Badge>
        <Badge variant="secondary" className="capitalize border-primary">
          {getCategoryIcon(task.category)}
          <span className="ml-1">{task.category}</span>
        </Badge>
        {(totalTime > 0) && (
            <Badge 
              variant="outline"
              className="text-xs cursor-pointer border-primary"
              onClick={() => onTimeLogClick(task)}
              aria-label="View time log"
            >
                <Clock className="mr-1 h-3 w-3" />
                {formatTime(totalTime)}
            </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
