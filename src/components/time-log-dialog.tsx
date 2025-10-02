// src/components/time-log-dialog.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { Task, TimeEntry } from "@/lib/types";
import { format } from "date-fns";

type TimeLogDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  task: Task | null;
};

const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}


export function TimeLogDialog({ isOpen, setIsOpen, task }: TimeLogDialogProps) {
    if (!task) return null;

    const sortedTimeEntries = [...(task.timeEntries || [])].sort((a,b) => b.date.getTime() - a.date.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Time Log: {task.title}</DialogTitle>
          <DialogDescription>
            A detailed breakdown of the time you've spent on this task.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTimeEntries.length > 0 ? (
                        sortedTimeEntries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{format(entry.date, "PPP p")}</TableCell>
                                <TableCell className="text-right">{formatDuration(entry.duration)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No time has been logged for this task yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
