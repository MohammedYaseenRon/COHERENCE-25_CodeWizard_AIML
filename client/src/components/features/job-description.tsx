"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"

interface JobDescriptionSectionProps {
  onSubmit: (description: string) => void
  isLoading: boolean
}

export function JobDescriptionSection({ onSubmit, isLoading }: JobDescriptionSectionProps) {
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(description)
  }

  return (
    <div className="bg-[#1a2235] rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Job Description</h3>
      <p className="text-gray-400 mb-6">Paste the job description to match against resumes</p>

      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full h-48 bg-[#0f1520] rounded-md p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Paste the job description here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full mt-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center
            ${isLoading ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Analyzing...
            </>
          ) : (
            "Match Candidates"
          )}
        </motion.button>
      </form>
    </div>
  )
}

function Spinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={`animate-spin ${props.className || ""}`}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

