// src/components/overdue-tasks.tsx
"use client";

import { AlertCircle, CalendarPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { type Task } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type OverdueTasksProps = {
  tasks: Task[];
  onReschedule: (taskId: string, newDate: Date) => void;
  selectedDate: Date;
};

export function OverdueTasks({ tasks, onReschedule, selectedDate }: OverdueTasksProps) {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible defaultValue="overdue-tasks">
      <AccordionItem value="overdue-tasks">
        <AccordionTrigger className="text-destructive hover:no-underline rounded-lg border border-destructive/50 bg-destructive/10 dark:bg-destructive/25 px-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">{tasks.length} Overdue Task{tasks.length > 1 ? 's' : ''}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3 p-2 border-l-2 border-destructive/50 ml-2 mt-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Overdue by {formatDistanceToNow(task.dueDate, { addSuffix: false })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReschedule(task.id, selectedDate)}
                  aria-label={`Reschedule ${task.title}`}
                  className="self-end sm:self-center w-full sm:w-auto"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Move to Today
                </Button>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
