// src/components/time-log-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, set, getHours, getMinutes } from "date-fns";
import { nanoid } from "nanoid";
import { MoreHorizontal, Pencil, Plus, Trash2, CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Task, TimeEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


type TimeLogDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  task: Task | null;
  onTimeEntryUpdate: (taskId: string, entry: TimeEntry) => void;
  onTimeEntryDelete: (taskId: string, entryId: string) => void;
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

const timeLogSchema = z.object({
    date: z.date(),
    startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
}).refine(data => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const [endHour, endMinute] = data.endTime.split(':').map(Number);
    const startDate = set(data.date, { hours: startHour, minutes: startMinute });
    const endDate = set(data.date, { hours: endHour, minutes: endMinute });
    return endDate > startDate;
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});

type TimeLogFormValues = z.infer<typeof timeLogSchema>;

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

function LogForm({
    defaultValues,
    onSubmit,
    onCancel,
}: {
    defaultValues: TimeLogFormValues;
    onSubmit: (data: TimeLogFormValues) => void;
    onCancel: () => void;
}) {
    const form = useForm<TimeLogFormValues>({
        resolver: zodResolver(timeLogSchema),
        defaultValues,
    });
    
    useEffect(() => {
        form.reset(defaultValues);
    }, [defaultValues, form]);

    const startHour = form.watch('startTime')?.split(':')[0] ?? '00';
    const startMinute = form.watch('startTime')?.split(':')[1] ?? '00';
    const endHour = form.watch('endTime')?.split(':')[0] ?? '00';
    const endMinute = form.watch('endTime')?.split(':')[1] ?? '00';
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                        >
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <div className="flex gap-2">
                           <Controller
                                control={form.control}
                                name="startTime"
                                render={() => (
                                    <Select value={startHour} onValueChange={(h) => form.setValue('startTime', `${h}:${startMinute}`)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent className="max-h-48">
                                            {hours.map(h => <SelectItem key={`start-h-${h}`} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                           />
                           <Controller
                                control={form.control}
                                name="startTime"
                                render={() => (
                                    <Select value={startMinute} onValueChange={(m) => form.setValue('startTime', `${startHour}:${m}`)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent className="max-h-48">
                                            {minutes.map(m => <SelectItem key={`start-m-${m}`} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                           />
                        </div>
                        <FormMessage>{form.formState.errors.startTime?.message}</FormMessage>
                    </FormItem>
                    <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <div className="flex gap-2">
                           <Controller
                                control={form.control}
                                name="endTime"
                                render={() => (
                                    <Select value={endHour} onValueChange={(h) => form.setValue('endTime', `${h}:${endMinute}`)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent className="max-h-48">
                                            {hours.map(h => <SelectItem key={`end-h-${h}`} value={h}>{h}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                           />
                           <Controller>
                                control={form.control}
                                name="endTime"
                                render={() => (
                                    <Select value={endMinute} onValueChange={(m) => form.setValue('endTime', `${endHour}:${m}`)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent className="max-h-48">
                                            {minutes.map(m => <SelectItem key={`end-m-${m}`} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                           </Controller>
                        </div>
                         <FormMessage>{form.formState.errors.endTime?.message}</FormMessage>
                    </FormItem>
                </div>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Form>
    );
}


export function TimeLogDialog({ isOpen, setIsOpen, task, onTimeEntryUpdate, onTimeEntryDelete }: TimeLogDialogProps) {
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const { toast } = useToast();

    if (!task) return null;

    const sortedTimeEntries = [...(task.timeEntries || [])]
      .filter((entry): entry is TimeEntry & { startTime: Date; endTime: Date } => !!entry.startTime && !!entry.endTime)
      .sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
    
    const handleFormSubmit = (data: TimeLogFormValues) => {
        const [startHour, startMinute] = data.startTime.split(':').map(Number);
        const [endHour, endMinute] = data.endTime.split(':').map(Number);

        const startTime = set(data.date, { hours: startHour, minutes: startMinute, seconds: 0 });
        const endTime = set(data.date, { hours: endHour, minutes: endMinute, seconds: 0 });
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

        if (duration <= 0) {
            toast({ title: "Invalid Time Range", description: "End time must be after start time.", variant: "destructive" });
            return;
        }

        const newEntry: TimeEntry = {
            id: editingEntryId || nanoid(),
            startTime,
            endTime,
            duration,
        };
        onTimeEntryUpdate(task.id, newEntry);
        setEditingEntryId(null);
        setIsAdding(false);
    };
    
    const getFormDefaults = (entry: TimeEntry | null): TimeLogFormValues => {
        if (!entry) {
            return {
                date: new Date(),
                startTime: "09:00",
                endTime: "10:00",
            };
        }
        return {
            date: entry.startTime,
            startTime: `${getHours(entry.startTime).toString().padStart(2, '0')}:${getMinutes(entry.startTime).toString().padStart(2, '0')}`,
            endTime: `${getHours(entry.endTime).toString().padStart(2, '0')}:${getMinutes(entry.endTime).toString().padStart(2, '0')}`,
        };
    };

    const entryToEdit = editingEntryId ? sortedTimeEntries.find(e => e.id === editingEntryId) : null;
    const formDefaultValues = getFormDefaults(entryToEdit ?? null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Time Log: {task.title}</DialogTitle>
          <DialogDescription>
            A detailed breakdown of the time you've spent on this task.
          </DialogDescription>
        </DialogHeader>
        
        {(isAdding || editingEntryId) && (
            <LogForm 
                defaultValues={formDefaultValues}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                    setIsAdding(false);
                    setEditingEntryId(null);
                }}
            />
        )}

        <div className="max-h-[60vh] overflow-y-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTimeEntries.length > 0 ? (
                        sortedTimeEntries.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell>{format(entry.startTime, "PPP")}</TableCell>
                                <TableCell>{`${format(entry.startTime, "p")} - ${format(entry.endTime, "p")}`}</TableCell>
                                <TableCell className="text-right">{formatDuration(entry.duration)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">More actions</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setIsAdding(false); setEditingEntryId(entry.id); }}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the time entry.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => onTimeEntryDelete(task.id, entry.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No time has been logged for this task yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
         <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => { setEditingEntryId(null); setIsAdding(true); }}
                disabled={isAdding || !!editingEntryId}
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Record
            </Button>
          <Button type="button" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
