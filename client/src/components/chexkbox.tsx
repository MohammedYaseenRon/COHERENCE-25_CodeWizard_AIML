"use client"
import { motion } from "framer-motion"

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: () => void
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="relative flex items-center">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`w-4 h-4 border rounded ${checked ? "bg-blue-500 border-blue-500" : "border-gray-600"}`}>
          {checked && (
            <motion.svg
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </motion.svg>
          )}
        </div>
      </div>
      <span className="ml-2 text-sm">{label}</span>
    </label>
  )
}

