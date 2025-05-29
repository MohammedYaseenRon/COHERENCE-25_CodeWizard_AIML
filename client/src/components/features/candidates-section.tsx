"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown, ChevronUp, Filter, Mail, Search, SlidersHorizontal } from "lucide-react"
import { CandidateCard } from "./candidate-card"
import type { Candidate } from "@/types"

interface CandidatesSectionProps {
  candidates: Candidate[]
  job_description: {}
  onSaveCandidate: (id: string) => void
  onSendMail?: (selectedCandidates: Candidate[]) => void
}

export const CandidatesSection: React.FC<CandidatesSectionProps> = ({
  candidates,
  job_description,
  onSaveCandidate,
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"rank" | "match" | "name">("rank")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterSkills, setFilterSkills] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  useEffect(() => {
    const skillsSet = new Set<string>()

    if (!Array.isArray(candidates)) return

    candidates.forEach((candidate) => {
      const fullResume =
        typeof candidate.full_resume === "string" ? JSON.parse(candidate.full_resume) : candidate.full_resume || {}

      fullResume?.skills?.technical_skills?.forEach((skill: string) => {
        skillsSet.add(skill)
      })
    })

    setFilterSkills(Array.from(skillsSet))
  }, [candidates])

  const handleSelectAll = () => {
    setIsAllSelected(!isAllSelected)
    setSelectedCandidates(!isAllSelected ? [...candidates] : [])
  }

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidates((prev) =>
      prev.some((c) => c.filename === candidate.filename)
        ? prev.filter((c) => c.filename !== candidate.filename)
        : [...prev, candidate],
    )
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const fullResume =
      typeof candidate.full_resume === "string"
        ? JSON.parse(candidate.full_resume) 
        : candidate.full_resume || {} 

    const nameMatch = fullResume?.contact_info?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false

    if (activeFilters.length === 0) return nameMatch

    const technicalSkills = Array.isArray(fullResume?.skills?.technical_skills)
      ? fullResume.skills.technical_skills
      : []

    const hasAllSkills = activeFilters.every((filter) => technicalSkills.includes(filter))

    return nameMatch && hasAllSkills
  })

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {

    const fullResumeA =
      typeof a.full_resume === "string"
        ? JSON.parse(a.full_resume) 
        : a.full_resume || {} 

    const fullResumeB = typeof b.full_resume === "string" ? JSON.parse(b.full_resume) : b.full_resume || {}

    if (sortBy === "rank") {
      return sortDirection === "asc" ? (a.rank ?? 999) - (b.rank ?? 999) : (b.rank ?? 999) - (a.rank ?? 999)
    }

    if (sortBy === "match") {
      return sortDirection === "asc"
        ? (a.match_percentage ?? 0) - (b.match_percentage ?? 0)
        : (b.match_percentage ?? 0) - (a.match_percentage ?? 0)
    }

    const nameA = fullResumeA?.contact_info?.full_name?.toLowerCase() || ""
    const nameB = fullResumeB?.contact_info?.full_name?.toLowerCase() || ""

    return sortDirection === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA)
  })

  const handleSendMail = async () => {
    if (selectedCandidates.length === 0) return

    try {
      const response = await fetch("http://localhost:8000/api/v1/email/send-email/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ranked_resumes: selectedCandidates, job_description: job_description}),
      })

      if (!response.ok) {
        throw new Error("Failed to send emails")
      }

    } catch (error) {
      console.error("Error sending emails:", error)

    }
  }

  const handleSort = (type: "rank" | "match" | "name") => {
    if (sortBy === type) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(type)
      setSortDirection("asc")
    }
  }

  const toggleFilter = (skill: string) => {
    setActiveFilters((prev) => (prev.includes(skill) ? prev.filter((f) => f !== skill) : [...prev, skill]))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#1b2537] p-6 rounded-lg"
    >
      {}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            Top Matching Candidates
            {}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? "s" : ""} found
            {activeFilters.length > 0 &&
              ` with ${activeFilters.length} active filter${activeFilters.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center bg-[#2c3646] hover:bg-[#38465a] text-white px-3 py-2 rounded-md transition-colors"
          >
            <Filter size={16} className="mr-2" />
            Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>

          <div className="bg-[#2c3646] flex items-center rounded-md overflow-hidden">
            <div className="px-2 py-2 text-gray-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 outline-none text-white p-2 w-[150px] md:w-[200px]"
            />
          </div>

          {selectedCandidates.length > 0 && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMail}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center transition-colors"
            >
              <Mail size={16} className="mr-2" />
              Email Selected ({selectedCandidates.length})
            </motion.button>
          )}
        </div>
      </div>

      {}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 bg-[#2c3646] rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-medium">Filter by Skills</h3>
                {activeFilters.length > 0 && (
                  <button onClick={() => setActiveFilters([])} className="text-sm text-blue-400 hover:text-blue-300">
                    Clear all filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleFilter(skill)}
                    className={`px-3 py-1 rounded-full text-sm flex items-center transition-colors ${
                      activeFilters.includes(skill)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {activeFilters.includes(skill) && <Check size={12} className="mr-1" />}
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <div className="flex justify-between items-center mb-4 p-3 bg-[#2c3646] rounded-lg">
        <div className="flex items-center">
          <SlidersHorizontal size={16} className="mr-2 text-gray-400" />
          <span className="text-sm text-gray-400 mr-4">Sort by:</span>
          <div className="flex gap-3">
            <button
              onClick={() => handleSort("rank")}
              className={`flex items-center text-sm px-2 py-1 rounded ${
                sortBy === "rank" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Rank
              {sortBy === "rank" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={14} className="ml-1" />
                ) : (
                  <ChevronDown size={14} className="ml-1" />
                ))}
            </button>
            <button
              onClick={() => handleSort("match")}
              className={`flex items-center text-sm px-2 py-1 rounded ${
                sortBy === "match" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Match %
              {sortBy === "match" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={14} className="ml-1" />
                ) : (
                  <ChevronDown size={14} className="ml-1" />
                ))}
            </button>
            <button
              onClick={() => handleSort("name")}
              className={`flex items-center text-sm px-2 py-1 rounded ${
                sortBy === "name" ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              Name
              {sortBy === "name" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={14} className="ml-1" />
                ) : (
                  <ChevronDown size={14} className="ml-1" />
                ))}
            </button>
          </div>
        </div>

        <label className="flex items-center space-x-2 text-sm">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleSelectAll}
            className="form-checkbox h-4 w-4 text-blue-600 bg-gray-800 border-gray-700 rounded"
          />
          <span className="text-gray-300">Select All</span>
        </label>
      </div>

      {}
      {sortedCandidates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#2c3646] p-8 rounded-lg text-center"
        >
          <p className="text-gray-400">No candidates match your search criteria</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          <AnimatePresence>
            {sortedCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.filename || index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  {selectedCandidates.some((c) => c.filename === candidate.filename) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center z-10">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectCandidate(candidate)
                    }}
                  >
                    <CandidateCard
                      candidate={candidate}
                      index={index}
                      onSave={onSaveCandidate}
                      isSelected={selectedCandidates.some((c) => c.filename === candidate.filename)}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}