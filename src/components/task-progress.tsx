"use client";

import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskProgressProps = {
  title?: string;
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number;
};

const formatTime = (totalSeconds: number) => {
    if (totalSeconds < 60) return "Less than a minute";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);

    return parts.join(' ') || "0m";
}


export function TaskProgress({ title = "Progress", totalTasks, completedTasks, totalTimeSpent }: TaskProgressProps) {
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {completedTasks} / {totalTasks} completed
          </span>
          <span className="flex items-center gap-1">
             <Clock className="h-4 w-4" />
             {formatTime(totalTimeSpent)}
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}
