'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'night' | 'day'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({ theme: 'night', toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('night')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored === 'day' || stored === 'night') {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('night', theme === 'night')
    root.classList.toggle('day', theme === 'day')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'night' ? 'day' : 'night'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
