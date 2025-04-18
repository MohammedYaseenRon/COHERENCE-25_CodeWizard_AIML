"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { Header } from "@/components/layout/header"
import { ResumeScanner } from "@/components/features/resume-scanner"
import { CandidatesSection } from "@/components/features/candidates-section"
import { JobDescriptionSection } from "@/components/features/job-description"
import type { Candidate, FilterOptions } from "@/types"
import { getCandidates, saveCandidate } from "@/lib/data-service"
import ResumeAnalysisCharts from "@/components/ResumeAnalysisCharts"

type AnalysisResults = {
  [key: string]: unknown;
};

type RankingData = {
  ranked_resumes?: Candidate[];
};

export default function ResumeScannerApp() {
  const [isScanning, setIsScanning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // View management state
  const [currentView, setCurrentView] = useState<'initial' | 'candidates'>('initial')

  // WebSocket state
  const [uploadSocket, setUploadSocket] = useState<WebSocket | null>(null)
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  // const [resumeRankings, setResumeRankings] = useState<any>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  // Data state
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filterOptions] = useState<FilterOptions>({
    skills: [],
    experience: [],
    education: [],
  })

  useEffect(() => {
    const fetchAnalysisResults = async () => {
      try {
        const response = await fetch('https://globalhive.xyz/resume-analysis-results', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analysis results');
        }

        const data = await response.json();
        setAnalysisResults(data);
      }
      catch (error) {
        console.error('Error fetching analysis results:', error);
      }
    };
    fetchAnalysisResults();
  }, []);

  // WebSocket connection setup
  const setupWebSocket = useCallback(() => {
    const socket = new WebSocket('wss://globalhive.xyz/multi-upload');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setUploadSocket(socket);
    };

    socket.onmessage = (event) => {
      try {
        if (!event.data.startsWith('Processing')){
          const parsedData = JSON.parse(event.data);
          setAnalysisResults(parsedData);
          setUploadStatus('Analysis Complete');
          setIsScanning(false);
          setCurrentView('candidates');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setUploadStatus('Error processing analysis');
        setIsScanning(false);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setUploadStatus('WebSocket connection error');
      setIsScanning(false);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setUploadSocket(null);
    };

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Initialize WebSocket on component mount
  useEffect(() => {
    const cleanup = setupWebSocket();
    return cleanup;
  }, [setupWebSocket])

  // Handle filter changes
  useEffect(() => {
    const applyFilters = async () => {
      const filtered = await getCandidates(filterOptions)
      setCandidates(filtered)
    }

    applyFilters()
  }, [filterOptions])

  // Handle resume scanning
  const handleScanResume = async (resumeFiles: File[] | null) => {
    if (!resumeFiles || resumeFiles.length === 0 || !uploadSocket) {
      setUploadStatus('No files selected or WebSocket not connected');
      return;
    }

    setIsScanning(true);
    setUploadStatus('Uploading and analyzing...');

    try {
      // Send number of files
      uploadSocket.send(JSON.stringify({
        num_files: resumeFiles.length
      }));

      // Process each file
      for (const file of resumeFiles) {
        // Send file metadata
        uploadSocket.send(JSON.stringify({
          filename: file.name
        }));

        // Read and send file in chunks
        const arrayBuffer = await file.arrayBuffer();
        const chunkSize = 1024; // 1KB chunks
        for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
          const chunk = arrayBuffer.slice(i, i + chunkSize);
          uploadSocket.send(chunk);
        }

        // Send EOF signal
        uploadSocket.send(new Uint8Array([69, 79, 70])); // 'EOF' in bytes
      }
    } catch (error) {
      console.error("Error scanning resume:", error)
      setUploadStatus('Error uploading files');
      setIsScanning(false);
    }
  }

  // Handle job description analysis
  const handleAnalyzeJob = async (description: string) => {
    if (!description) {
      setUploadStatus('Please provide a job description');
      return;
    }

    setIsAnalyzing(true);
    setUploadStatus('Ranking resumes...');

    try {
      const response = await fetch('https://globalhive.xyz/rank-resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: description,
          resumes_file: 'resume_analysis_results.json'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rank resumes');
      }

      const rankingData: RankingData = await response.json();
      // setResumeRankings(rankingData);
      setUploadStatus('Resume Ranking Complete');
      setIsAnalyzing(false);
      setCurrentView('candidates');
      
      if (rankingData.ranked_resumes) {
        const rankedCandidates = rankingData.ranked_resumes.map((resume: Candidate, index: number) => ({
          ...resume,
          rank: index + 1
        }));
        setCandidates(rankedCandidates);
      }
    } catch (error) {
      console.error("Error analyzing job:", error)
      setUploadStatus('Error ranking resumes');
      setIsAnalyzing(false);
    }
  }

  // Handle saving a candidate
  const handleSaveCandidate = async (id: string) => {
    try {
      await saveCandidate(id);
  
      // Ensure saved candidates stay visible
      setCandidates(
        candidates.map((candidate) => 
          candidate.id === id ? { ...candidate, saved: true } : candidate
        )
      );
    } catch (error) {
      console.error("Error saving candidate:", error);
    }
  };
  

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
      <div 
        className={`
          flex-1 overflow-auto transition-all duration-300
        `}
      >
        {/* Header */}
        <Header userInitials="JS" />

        {/* Dashboard content */}
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Resume Scanning Dashboard</h2>

          {/* Status display */}
          {uploadStatus && (
            <div className={`
              mb-4 p-3 rounded 
              ${uploadStatus.includes('Error') ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}
            `}>
              {uploadStatus}
            </div>
          )}

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
                  multiple={true}
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

          {/* Optional: Analysis Results Display */}
          {analysisResults && (
            <ResumeAnalysisCharts />
          )}
        </main>
      </div>
    </div>
  )
}