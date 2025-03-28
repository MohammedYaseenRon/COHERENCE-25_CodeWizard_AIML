"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useInView } from "@/hooks/use-in-view"

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, duration = 2000, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true })
  const countingRef = useRef(false)

  useEffect(() => {
    if (inView && !countingRef.current) {
      countingRef.current = true

      let startTimestamp: number | null = null
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp
        const progress = Math.min((timestamp - startTimestamp) / duration, 1)
        setCount(Math.floor(progress * end))

        if (progress < 1) {
          window.requestAnimationFrame(step)
        }
      }

      window.requestAnimationFrame(step)
    }
  }, [inView, end, duration])

  return (
    <div ref={ref} className="text-4xl font-bold text-purple-500">
      {prefix}
      {count}
      {suffix}
    </div>
  )
}

