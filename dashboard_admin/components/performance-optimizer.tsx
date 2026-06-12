// components/performance-optimizer.tsx
"use client"

import { useEffect, useRef, useState } from 'react'

interface PerformanceOptimizerProps {
  children: React.ReactNode
}

export function PerformanceOptimizer({ children }: PerformanceOptimizerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isThrottled, setIsThrottled] = useState(false)
  const throttledRef = useRef(false)

  useEffect(() => {
    // Detectar quando a aba está visível/invisível
    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)
    }

    // Detectar quando a aba está sendo usada ativamente
    let lastActivity = Date.now()
    const handleActivity = () => {
      lastActivity = Date.now()
      if (throttledRef.current) {
        throttledRef.current = false
        setIsThrottled(false)
      }
    }

    // Throttle quando não há atividade — loga apenas na entrada do estado
    const throttleInterval = setInterval(() => {
      const now = Date.now()
      if (now - lastActivity > 30000 && !throttledRef.current) {
        throttledRef.current = true
        setIsThrottled(true)
        console.log('🐌 Modo economia de energia ativado')
      }
    }, 5000)

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('keypress', handleActivity)
    document.addEventListener('scroll', handleActivity)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      clearInterval(throttleInterval)
    }
  }, [])

  // Aplicar otimizações baseadas no estado
  useEffect(() => {
    if (!isVisible || isThrottled) {
      // Reduzir frequência de atualizações
      document.body.style.setProperty('--animation-duration', '0.1s')
      document.body.style.setProperty('--transition-duration', '0.1s')
    } else {
      // Restaurar animações normais
      document.body.style.removeProperty('--animation-duration')
      document.body.style.removeProperty('--transition-duration')
    }
  }, [isVisible, isThrottled])

  return (
    <div 
      className={`performance-optimizer ${!isVisible ? 'tab-hidden' : ''} ${isThrottled ? 'throttled' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0.7,
        transition: 'opacity 0.3s ease'
      }}
    >
      {children}
    </div>
  )
}
