"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

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
  
  // View management state
  const [currentView, setCurrentView] = useState<'initial' | 'candidates'>('initial')

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
  const handleScanResume = async (resumeFile: File | null, jobDescription: string) => {
    setIsScanning(true)

    try {
      const results = await scanResume(resumeFile, jobDescription)
      setCandidates(results)
      // Automatically switch to candidates view
      setCurrentView('candidates')
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
      // Automatically switch to candidates view
      setCurrentView('candidates')
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

  // Loading overlay component
  const LoadingOverlay = () => (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-16 h-16 border-4 border-transparent border-t-purple-500 border-r-purple-500 rounded-full animate-spin"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ 
          repeat: Infinity, 
          duration: 1,
          ease: "linear"
        }}
      />
    </motion.div>
  )

  return (
    <div className="flex h-screen bg-black text-white">
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

          {/* Conditional rendering based on current view */}
          <AnimatePresence>
            {currentView === 'initial' && (
              <motion.div 
                key="initial-view"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <ResumeScanner 
                  onScan={handleScanResume} 
                  isScanning={isScanning} 
                />

                <JobDescriptionSection 
                  onSubmit={handleAnalyzeJob} 
                  isLoading={isAnalyzing} 
                />
              </motion.div>
            )}

            {currentView === 'candidates' && (
              <motion.div 
                key="candidates-view"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
              >
                <button 
                  onClick={() => setCurrentView('initial')}
                  className="mb-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                >
                  Back to Scanner
                </button>
                <CandidatesSection 
                  candidates={candidates} 
                  onSaveCandidate={handleSaveCandidate} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional loading overlay */}
          {(isScanning || isAnalyzing) && <LoadingOverlay />}
        </main>
      </div>
    </div>
  )
}