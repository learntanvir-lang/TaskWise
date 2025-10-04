// src/components/tasks-overview.tsx
"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isWithinInterval,
  isSameDay,
  isSameMonth,
  getWeeksInMonth,
  startOfMonth,
  endOfMonth,
  addWeeks,
} from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Task } from "@/lib/types";
import { useTheme } from "next-themes";
import { themes } from "@/themes";

type TasksOverviewProps = {
  tasks: Task[];
  viewMode: "weekly" | "monthly";
  selectedDate: Date;
};

const formatTimeForAxis = (seconds: number) => {
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const totalSeconds = payload[0].value;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);

        return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col space-y-1">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                    {label}
                    </span>
                    <span className="font-bold text-muted-foreground">
                    {`${hours}h ${minutes}m`}
                    </span>
                </div>
            </div>
        </div>
        );
    }
    return null;
};

export function TasksOverview({
  tasks,
  viewMode,
  selectedDate,
}: TasksOverviewProps) {
    const { theme: mode } = useTheme();
    const theme = themes.find((t) => t.name === (mode || 'light'));
  
    const chartData = useMemo(() => {
        if (viewMode === "weekly") {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

        return daysInWeek.map((day) => {
            const tasksForDay = tasks.filter((task) => isSameDay(task.dueDate, day));
            const totalTime = tasksForDay.reduce((acc, task) => acc + (task.timeSpent || 0), 0);
            return {
                name: format(day, "EEE"),
                total: totalTime,
            };
        });
        }
        
        if (viewMode === 'monthly') {
            const monthStart = startOfMonth(selectedDate);
            const monthEnd = endOfMonth(selectedDate);
            const weeksInMonth = getWeeksInMonth(selectedDate, { weekStartsOn: 1 });

            const weeklyData = Array.from({ length: weeksInMonth }, (_, i) => {
                const weekStart = startOfWeek(addWeeks(monthStart, i), { weekStartsOn: 1 });
                const tasksInWeek = tasks.filter(task => 
                    isWithinInterval(task.dueDate, { start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 })}) &&
                    isSameMonth(task.dueDate, selectedDate)
                );
                const totalTime = tasksInWeek.reduce((acc, task) => acc + (task.timeSpent || 0), 0);
                return {
                    name: `Week ${i + 1}`,
                    total: totalTime,
                };
            });
            return weeklyData;
        }

        return [];
    }, [tasks, viewMode, selectedDate]);

    const totalTime = useMemo(() => {
        return chartData.reduce((acc, data) => acc + data.total, 0);
    }, [chartData]);
  
    const formatTotalTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>
            {viewMode === "weekly" ? "Weekly" : "Monthly"} Time Summary
          </span>
          <span className="text-lg font-bold text-primary">{formatTotalTime(totalTime)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme?.cssVars.dark.border} />
            <XAxis
              dataKey="name"
              stroke={theme?.cssVars.dark['muted-foreground']}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={theme?.cssVars.dark['muted-foreground']}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatTimeForAxis}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: theme?.cssVars.dark['secondary'] }}
            />
            <Bar dataKey="total" fill={theme?.cssVars.dark.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
