// src/components/create-task-dialog.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, type Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  category: z.string({ required_error: "Category is required" }),
  customCategory: z.string().optional(),
  priority: z.coerce.number().min(1, "Priority is required."),
}).refine(data => {
    if (data.category === 'other' && !data.customCategory) {
        return false;
    }
    return true;
}, {
    message: "Custom category cannot be empty.",
    path: ["customCategory"],
});

type TaskFormValues = z.infer<typeof taskSchema>;

type CreateTaskDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'isCompleted' | 'timeSpent' | 'userId'>) => void;
  onTaskUpdate: (task: Task) => void;
  taskToEdit: Task | null;
};

export function CreateTaskDialog({ isOpen, setIsOpen, onTaskCreate, onTaskUpdate, taskToEdit }: CreateTaskDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(),
      category: "personal",
      customCategory: "",
      priority: 2,
    },
  });
    
  const categoryValue = form.watch("category");

  useEffect(() => {
    if (taskToEdit) {
      const isCustom = !categories.includes(taskToEdit.category);
      form.reset({
        ...taskToEdit,
        description: taskToEdit.description || "",
        category: isCustom ? "other" : taskToEdit.category,
        customCategory: isCustom ? taskToEdit.category : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: new Date(),
        category: "personal",
        customCategory: "",
        priority: 2,
      });
    }
  }, [taskToEdit, isOpen, form]);

  function onSubmit(data: TaskFormValues) {
    const { customCategory, ...taskData } = data;
    const finalCategory = data.category === 'other' ? customCategory! : data.category;
    
    const finalTaskData = { ...taskData, category: finalCategory };

    if (taskToEdit) {
      onTaskUpdate({ ...taskToEdit, ...finalTaskData });
    } else {
      onTaskCreate(finalTaskData);
    }
    setIsOpen(false);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? 'Update the details of your task.' : 'Fill in the details below to add a new task.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Finish project report" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 1, 2, 3, 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category} className="capitalize">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            {categoryValue === 'other' && (
                <FormField
                    control={form.control}
                    name="customCategory"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custom Category</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter custom category" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
            
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:space-x-2">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto">{taskToEdit ? 'Save Changes' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
