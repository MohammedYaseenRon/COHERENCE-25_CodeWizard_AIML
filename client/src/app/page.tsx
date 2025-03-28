"use client"

import { useState, useEffect } from "react"

import { Header } from "@/components/layout/header"
import { FilterSection } from "@/components/features/filter-section"
import { ResumeScanner } from "@/components/features/resume-scanner"
import { CandidatesSection } from "@/components/features/candidates-section"
import { JobDescriptionSection } from "@/components/features/job-description"
import type { Candidate, FilterOptions } from "@/types"
import { getCandidates, scanResume, saveCandidate } from "@/lib/data-service"
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/layout/sidebar"), {
  ssr: false,
});

export default function ResumeScannerApp() {
  // App state
  const [activeTab, setActiveTab] = useState("dashboard")
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterTab, setFilterTab] = useState("matches")
  const [isScanning, setIsScanning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

  // Data state
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    skills: [],
    experience: [],
    education: [],
  })

  // Load initial data
  useEffect(() => {
    const loadCandidates = async () => {
      const data = await getCandidates()
      setCandidates(data)
    }

    loadCandidates()
  }, [])

  // Handle filter changes
  useEffect(() => {
    const applyFilters = async () => {
      const filtered = await getCandidates(filterOptions)
      setCandidates(filtered)
    }

    applyFilters()
  }, [filterOptions])

  // Handle resume scanning
  const handleScanResume = async (resumeFiles: File[], jobDescription: string) => {
    setIsScanning(true)

    try {
      // Process all files 
      const results = await Promise.all(
        resumeFiles.map(file => scanResume(file, jobDescription))
      )
      // Flatten results if needed
      const flattenedResults = results.flat()
      setCandidates(flattenedResults)
    } catch (error) {
      console.error("Error scanning resume:", error)
      // In a real app, you would show an error message
    } finally {
      setIsScanning(false)
    }
  }
  // Handle job description analysis
  const handleAnalyzeJob = async (description: string) => {
    setIsAnalyzing(true)

    try {
      const results = await scanResume(null, description)
      setCandidates(results)
    } catch (error) {
      console.error("Error analyzing job:", error)
      // In a real app, you would show an error message
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle saving a candidate
  const handleSaveCandidate = async (id: string) => {
    try {
      await saveCandidate(id)

      // Update the local state
      setCandidates(
        candidates.map((candidate) => (candidate.id === id ? { ...candidate, saved: !candidate.saved } : candidate)),
      )
    } catch (error) {
      console.error("Error saving candidate:", error)
      // In a real app, you would show an error message
    }
  }

  return (
    <div className="flex h-screen bg-[#0f1520] text-white">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Main content with dynamic margin based on sidebar width */}
      <div 
        className={`
          flex-1 overflow-auto transition-all duration-300
          ${isSidebarExpanded ? 'ml-64' : 'ml-16'}
        `}
      >
        {/* Header */}
        <Header userInitials="JS" />

        {/* Dashboard content */}
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Resume Scanning Dashboard</h2>

          {/* Filter section */}
          <FilterSection
            isOpen={filterOpen}
            toggleOpen={() => setFilterOpen(!filterOpen)}
            activeTab={filterTab}
            setActiveTab={setFilterTab}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
          />

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Resume Scanner */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                <ResumeScanner onScan={handleScanResume} isScanning={isScanning} />

                <JobDescriptionSection onSubmit={handleAnalyzeJob} isLoading={isAnalyzing} />
              </div>
            </div>

            {/* Right column - Top Matching Candidates */}
            <div>
              <CandidatesSection candidates={candidates} onSaveCandidate={handleSaveCandidate} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}