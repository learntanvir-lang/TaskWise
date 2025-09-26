"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Sparkles } from "lucide-react";

import { suggestPriorityAction } from "@/app/actions";
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
import { useToast } from "@/hooks/use-toast";
import { categories, priorities, type Task } from "@/lib/types";
import { cn } from "@/lib/utils";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "A due date is required." }),
  priority: z.enum(priorities),
  category: z.string({ required_error: "Category is required" }),
  customCategory: z.string().optional(),
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
  onTaskCreate: (task: Omit<Task, 'id' | 'isCompleted' | 'timeSpent'>) => void;
  onTaskUpdate: (task: Task) => void;
  taskToEdit: Task | null;
};

export function CreateTaskDialog({ isOpen, setIsOpen, onTaskCreate, onTaskUpdate, taskToEdit }: CreateTaskDialogProps) {
  const [isAiPending, startAiTransition] = useTransition();
  const [aiSuggestion, setAiSuggestion] = useState<{priority: string, reason: string} | null>(null);
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: new Date(),
      priority: "medium",
      category: "personal",
      customCategory: "",
    },
  });
    
  const categoryValue = form.watch("category");

  useEffect(() => {
    if (taskToEdit) {
      const isCustom = !categories.includes(taskToEdit.category);
      form.reset({
        ...taskToEdit,
        category: isCustom ? "other" : taskToEdit.category,
        customCategory: isCustom ? taskToEdit.category : "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        dueDate: new Date(),
        priority: "medium",
        category: "personal",
        customCategory: "",
      });
    }
  }, [taskToEdit, form, isOpen]);

  const handleSuggestPriority = async () => {
    const { title, description, dueDate } = form.getValues();
    const taskContent = `${title} ${description || ''}`.trim();
    if (!taskContent) {
      form.setError("title", { message: "Please enter a title or description first."});
      return;
    }

    startAiTransition(async () => {
      const result = await suggestPriorityAction({
        description: taskContent,
        deadline: format(dueDate, "yyyy-MM-dd"),
      });

      if (result.success && result.data) {
        // @ts-ignore
        form.setValue("priority", result.data.priority, { shouldValidate: true });
        setAiSuggestion(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "AI Suggestion Failed",
          description: result.error,
        });
      }
    });
  };

  function onSubmit(data: TaskFormValues) {
    const finalCategory = data.category === 'other' ? data.customCategory! : data.category;
    const taskData = { ...data, category: finalCategory };
    
    if (taskToEdit) {
        onTaskUpdate({ ...taskToEdit, ...taskData });
    } else {
        onTaskCreate(taskData);
    }
    setIsOpen(false);
    form.reset();
    setAiSuggestion(null);
  }
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
        form.reset();
        setAiSuggestion(null);
    }
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel>Priority</FormLabel>
                        <Button type="button" variant="ghost" size="sm" onClick={handleSuggestPriority} disabled={isAiPending}>
                            {isAiPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
                            )}
                            Suggest
                        </Button>
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority} className="capitalize">
                          {priority}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {aiSuggestion && aiSuggestion.priority === field.value && (
                     <p className="text-xs text-muted-foreground mt-1 p-2 bg-secondary rounded-md">
                        <span className="font-semibold">AI Suggestion:</span> {aiSuggestion.reason}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit">{taskToEdit ? 'Save Changes' : 'Create Task'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
