// src/components/tasks-overview.tsx
"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
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
  addWeeks,
  endOfMonth,
  eachWeekOfInterval,
} from "date-fns";
import { toPng } from "html-to-image";
import { Download, ListFilter } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type Task, type TimeEntry } from "@/lib/types";
import { useTheme } from "next-themes";
import { themes } from "@/themes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TasksOverviewProps = {
  tasks: Task[];
  viewMode: "weekly" | "monthly";
  selectedDate: Date;
};

const formatTimeForAxis = (seconds: number) => {
  const hours = seconds / 3600;
  if (hours < 0.1) return "0h";
  return `${hours.toFixed(1)}h`;
};

const formatTimeForLabel = (totalSeconds: number) => {
    if (totalSeconds < 60) return null;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    
    return parts.join(' ');
}

const CustomizedLabel = (props: any) => {
    const { x, y, stroke, value } = props;
    const formattedTime = formatTimeForLabel(value);
    if (formattedTime) {
        return (
            <text 
                x={x} 
                y={y} 
                dy={-12} 
                fill={stroke} 
                fontSize={14} 
                fontWeight="bold"
                textAnchor="middle"
                style={{ paintOrder: "stroke", stroke: "hsl(var(--background) / 0.8)", strokeWidth: "4px", strokeLinejoin: "round" }}
            >
                {formattedTime}
            </text>
        );
    }
    return null;
}

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

const ChartLoader = () => (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/3" />
            <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
            </div>
        </div>
        <Skeleton className="h-[350px] w-full" />
    </div>
);


export function TasksOverview({
  tasks,
  viewMode,
  selectedDate,
}: TasksOverviewProps) {
    const { resolvedTheme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
    const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(["All"]);

    const cardRef = useRef<HTMLDivElement>(null);
    const theme = themes.find((t) => t.name === 'light');
    const colors = resolvedTheme === 'dark' ? theme?.cssVars.dark : theme?.cssVars.light;
    const primaryColor = `hsl(${colors?.primary})`;
    const borderColor = `hsl(${colors?.border})`;
    const mutedForegroundColor = `hsl(${colors?.["muted-foreground"]})`;

    const allCategories = useMemo(() => {
      const categories = new Set(tasks.map((t) => t.category));
      return ["All", ...Array.from(categories)];
    }, [tasks]);

    const availableSubCategories = useMemo(() => {
        const subCategories = new Set<string>();
        const filteredTasks = selectedCategories.includes("All")
          ? tasks
          : tasks.filter((task) => selectedCategories.includes(task.category));
        
        filteredTasks.forEach(task => {
            if (task.subcategory) {
                subCategories.add(task.subcategory);
            }
        });

        if (subCategories.size === 0) return [];
        return ["All", ...Array.from(subCategories)];
    }, [tasks, selectedCategories]);

    useEffect(() => {
        // Reset sub-category filter when available sub-categories change
        setSelectedSubCategories(["All"]);
    }, [availableSubCategories]);

    const handleCategoryChange = (category: string) => {
      setSelectedCategories((prev) => {
        if (category === "All") {
          return prev.length === 1 && prev[0] === "All" ? [] : ["All"];
        }
    
        const newSelection = prev.filter((c) => c !== "All");
        if (newSelection.includes(category)) {
            const filtered = newSelection.filter((c) => c !== category);
            return filtered.length === 0 ? ["All"] : filtered;
        } else {
            return [...newSelection, category];
        }
      });
    };

    const handleSubCategoryChange = (subCategory: string) => {
        setSelectedSubCategories((prev) => {
            if (subCategory === "All") {
                return prev.length === 1 && prev[0] === "All" ? [] : ["All"];
            }
        
            const newSelection = prev.filter((sc) => sc !== "All");
            if (newSelection.includes(subCategory)) {
                const filtered = newSelection.filter((sc) => sc !== subCategory);
                return filtered.length === 0 ? ["All"] : filtered;
            } else {
                return [...newSelection, subCategory];
            }
          });
    };

    const handleDownload = useCallback(() => {
        if (cardRef.current === null) {
            return;
        }
        
        const fontEmbedCSS = `@import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap');`;

        toPng(cardRef.current, { 
            cacheBust: true, 
            backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#f8fafc',
            fontEmbedCSS: fontEmbedCSS,
            filter: (node: HTMLElement) => {
                return node.dataset?.excludeFromDownload !== 'true';
            },
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `tasks-overview-${viewMode}-${format(selectedDate, 'yyyy-MM-dd')}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
            });
    }, [cardRef, viewMode, selectedDate, resolvedTheme]);
  
    const chartData = useMemo(() => {
        setIsLoading(true);

        const categoryFilteredTasks = selectedCategories.includes("All")
          ? tasks
          : tasks.filter((task) => selectedCategories.includes(task.category));

        const subCategoryFilteredTasks = selectedSubCategories.includes("All")
          ? categoryFilteredTasks
          : categoryFilteredTasks.filter((task) => 
                task.subcategory && selectedSubCategories.includes(task.subcategory)
            );

        const finalFilteredTasks = selectedSubCategories.includes("All") ? categoryFilteredTasks : subCategoryFilteredTasks;

        const allTimeEntries = finalFilteredTasks.flatMap(task => task.timeEntries || []);

        if (viewMode === "weekly") {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 6 });
            const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

            return daysInWeek.map((day) => {
                const totalTime = allTimeEntries.reduce((acc, entry) => {
                    if (isSameDay(entry.startTime, day)) {
                        return acc + entry.duration;
                    }
                    return acc;
                }, 0);
                return {
                    name: format(day, "EEE"),
                    total: totalTime,
                };
            });
        }
        
        if (viewMode === 'monthly') {
            const monthStart = startOfMonth(selectedDate);
            const monthEnd = endOfMonth(selectedDate);
            const weeksInMonth = eachWeekOfInterval(
                { start: monthStart, end: monthEnd }, 
                { weekStartsOn: 6 }
            );

            return weeksInMonth.map((weekStart, i) => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 6 });
                const totalTime = allTimeEntries.reduce((acc, entry) => {
                    if (isWithinInterval(entry.startTime, { start: weekStart, end: weekEnd })) {
                        return acc + entry.duration;
                    }
                    return acc;
                }, 0);

                return {
                    name: `Week ${i + 1}`,
                    total: totalTime,
                };
            });
        }

        return [];
    }, [tasks, viewMode, selectedDate, selectedCategories, selectedSubCategories]);
    
    useEffect(() => {
        // Simulate a small delay to allow for render, then show the chart
        const timer = setTimeout(() => setIsLoading(false), 0);
        return () => clearTimeout(timer);
    }, [chartData]);


    const totalTime = useMemo(() => {
        return chartData.reduce((acc, data) => acc + data.total, 0);
    }, [chartData]);
  
    const formatTotalTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const chartTitle = useMemo(() => {
        const title = viewMode === "weekly" ? "Weekly" : "Monthly";
        const categories = selectedCategories.includes("All") || selectedCategories.length === 0 ? "" : selectedCategories.join(" & ");
        const subCategories = selectedSubCategories.includes("All") || selectedSubCategories.length === 0 ? "" : selectedSubCategories.join(" & ");

        if (categories && subCategories) {
            return `${title} Time for ${categories} (${subCategories})`;
        }
        if (categories) {
            return `${title} Time for ${categories}`;
        }
        if (subCategories) {
            return `${title} Time for ${subCategories}`;
        }
        return `${title} Time Summary`;
    }, [viewMode, selectedCategories, selectedSubCategories]);

    const chartDateRangeLabel = useMemo(() => {
        if (viewMode === 'weekly') {
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 6 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 6 });
            return `${format(weekStart, 'd MMM, yyyy')} - ${format(weekEnd, 'd MMM, yyyy')}`;
        }
        if (viewMode === 'monthly') {
            const monthStart = startOfMonth(selectedDate);
            const monthEnd = endOfMonth(selectedDate);
            return `${format(monthStart, 'd MMM, yyyy')} - ${format(monthEnd, 'd MMM, yyyy')}`;
        }
        return '';
    }, [viewMode, selectedDate]);

    const categoryButtonLabel = useMemo(() => {
        if (selectedCategories.includes("All") || selectedCategories.length === 0) {
            return "Category";
        }
        if (selectedCategories.length === 1) {
            return selectedCategories[0];
        }
        return `${selectedCategories.length} categories`;
    }, [selectedCategories]);

    const subCategoryButtonLabel = useMemo(() => {
        if (selectedSubCategories.includes("All") || selectedSubCategories.length === 0) {
            return "Sub-category";
        }
        if (selectedSubCategories.length === 1) {
            return selectedSubCategories[0];
        }
        return `${selectedSubCategories.length} sub-categories`;
    }, [selectedSubCategories]);
    
    if (isLoading || !resolvedTheme) {
        return (
            <Card>
                <CardContent className="p-6">
                    <ChartLoader />
                </CardContent>
            </Card>
        )
    }

  return (
    <Card ref={cardRef}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
            <div className="flex flex-col gap-1">
                <span className="capitalize">
                    {chartTitle}
                </span>
                <span className="text-lg font-bold text-primary pt-1">{formatTotalTime(totalTime)}</span>
            </div>
          <div className="flex items-center gap-2" data-exclude-from-download="true">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="capitalize">
                        <ListFilter className="mr-2 h-4 w-4" />
                        {categoryButtonLabel}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allCategories.map(category => (
                        <DropdownMenuCheckboxItem
                            key={category}
                            checked={selectedCategories.includes(category)}
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={() => handleCategoryChange(category)}
                            className="capitalize"
                        >
                            {category}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {availableSubCategories.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="capitalize">
                            <ListFilter className="mr-2 h-4 w-4" />
                            {subCategoryButtonLabel}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Sub-category</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {availableSubCategories.map(subCategory => (
                            <DropdownMenuCheckboxItem
                                key={subCategory}
                                checked={selectedSubCategories.includes(subCategory)}
                                onSelect={(e) => e.preventDefault()}
                                onCheckedChange={() => handleSubCategoryChange(subCategory)}
                                className="capitalize"
                            >
                                {subCategory}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div>
            <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 25, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis
                dataKey="name"
                stroke={mutedForegroundColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                />
                <YAxis
                stroke={mutedForegroundColor}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatTimeForAxis}
                />
                <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: primaryColor, strokeWidth: 2, strokeDasharray: "3 3" }}
                />
                <Line 
                type="monotone" 
                dataKey="total" 
                stroke={primaryColor}
                strokeWidth={2}
                activeDot={{ r: 8, fill: primaryColor }}
                dot={{ stroke: primaryColor, strokeWidth: 2, r: 4, fill: "hsl(var(--background))" }}
                >
                    <LabelList content={<CustomizedLabel />} dataKey="total" />
                </Line>
            </LineChart>
            </ResponsiveContainer>
        </div>
      </CardContent>
      <div className="text-center text-lg font-bold text-primary px-4 pt-0 pb-4">
        {chartDateRangeLabel}
      </div>
    </Card>
  );
}
