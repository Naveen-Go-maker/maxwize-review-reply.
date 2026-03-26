'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Toast, type ToastItem, type ToastType } from './toast'

interface ToastContextValue {
  toast: (options: Omit<ToastItem, 'id'>) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (options: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const duration = options.duration ?? 5000

      setToasts((prev) => [{ ...options, id }, ...prev].slice(0, 5))

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration)
        timers.current.set(id, timer)
      }
    },
    [removeToast]
  )

  const toast = useCallback(addToast, [addToast])
  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast])
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast])
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast])
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast])

  // Cleanup timers on unmount
  useEffect(() => {
    const currentTimers = timers.current
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
