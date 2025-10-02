"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskProgressProps = {
  title?: string;
  totalTasks: number;
  completedTasks: number;
};

export function TaskProgress({ title = "Progress", totalTasks, completedTasks }: TaskProgressProps) {
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {completedTasks} / {totalTasks} completed
          </span>
        </div>
        <Progress value={progressPercentage} className="mt-2 h-2" />
      </CardContent>
    </Card>
  );
}
