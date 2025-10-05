// src/components/mode-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  // We need to wait for the component to be mounted to know the theme
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Return a placeholder or null until mounted
    return <div className="h-9 w-16 rounded-full bg-muted" />
  }

  const isDarkMode = theme === "dark"

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="relative h-9 w-16 rounded-full"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <Sun className={`h-4 w-4 text-yellow-500 transition-opacity duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`} />
      <Moon className={`h-4 w-4 text-blue-400 transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`} />
      <span
        className={`absolute top-0.5 left-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-md transition-transform duration-300 ease-in-out
        ${isDarkMode ? 'translate-x-[calc(100%-4px)]' : 'translate-x-0'}
        `}
      >
        <Sun className={`h-4 w-4 text-foreground transition-opacity duration-300 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`} />
        <Moon className={`absolute h-4 w-4 text-foreground transition-opacity duration-300 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`} />
      </span>
    </Button>
  )
}
