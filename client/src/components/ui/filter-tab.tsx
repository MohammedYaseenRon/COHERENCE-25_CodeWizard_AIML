"use client"

import type * as React from "react"

interface FilterTabProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

export function FilterTab({ icon, label, active, onClick }: FilterTabProps) {
  return (
    <button
      className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
        active ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "bg-gray-800 hover:bg-gray-700"
      }`}
      onClick={onClick}
    >
      <span className="mr-2">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

