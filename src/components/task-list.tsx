// src/components/task-list.tsx
"use client";

import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
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
  onTaskOrderChange: (tasks: Task[]) => void;
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
  onTaskOrderChange,
}: TaskListProps) {

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newTasks = Array.from(tasks);
    const [reorderedItem] = newTasks.splice(source.index, 1);
    newTasks.splice(destination.index, 0, reorderedItem);
    
    onTaskOrderChange(newTasks);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20 p-8 text-center h-full min-h-[300px]">
        <h3 className="text-lg font-semibold text-muted-foreground">No tasks for this day</h3>
        <p className="text-sm text-muted-foreground">Enjoy your free time!</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks">
            {(provided) => (
                <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                >
                    {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                >
                                    <TaskItem
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
                                </div>
                            )}
                        </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    </DragDropContext>
  );
}
