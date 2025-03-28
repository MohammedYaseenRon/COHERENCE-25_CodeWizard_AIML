"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface ParallaxSectionProps {
  children: React.ReactNode
  speed?: number
  className?: string
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({ children, speed = 0.5, className = "" }) => {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.pageYOffset)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `translateY(${offset * speed}px)`,
      }}
    >
      {children}
    </div>
  )
}

