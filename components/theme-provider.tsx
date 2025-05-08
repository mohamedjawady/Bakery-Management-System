"use client"

import type * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

interface ThemeProviderProps extends React.PropsWithChildren {
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

function useTheme() {
  // Dummy implementation as the real implementation is provided by next-themes
  return {
    theme: "light",
    setTheme: (theme: string) => {
      console.log("Setting theme:", theme)
    },
  }
}

export { ThemeProvider, useTheme }
