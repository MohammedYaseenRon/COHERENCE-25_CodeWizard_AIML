// "use client"

// import { useState, useEffect } from "react"

// import { Header } from "@/components/layout/header"
// import { FilterSection } from "@/components/features/filter-section"
// import { ResumeScanner } from "@/components/features/resume-scanner"
// import { CandidatesSection } from "@/components/features/candidates-section"
// import { JobDescriptionSection } from "@/components/features/job-description"
// import type { Candidate, FilterOptions } from "@/types"
// import { getCandidates, scanResume, saveCandidate } from "@/lib/data-service"
// import dynamic from "next/dynamic";
// const Sidebar = dynamic(() => import("@/components/layout/sidebar"), {
//   ssr: false,
// });

// export default function ResumeScannerApp() {
//   // App state
//   const [activeTab, setActiveTab] = useState("dashboard")
//   const [filterOpen, setFilterOpen] = useState(false)
//   const [filterTab, setFilterTab] = useState("matches")
//   const [isScanning, setIsScanning] = useState(false)
//   const [isAnalyzing, setIsAnalyzing] = useState(false)
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(true)

//   // Data state
//   const [candidates, setCandidates] = useState<Candidate[]>([])
//   const [filterOptions, setFilterOptions] = useState<FilterOptions>({
//     skills: [],
//     experience: [],
//     education: [],
//   })

//   // Load initial data
//   useEffect(() => {
//     const loadCandidates = async () => {
//       const data = await getCandidates()
//       setCandidates(data)
//     }

//     loadCandidates()
//   }, [])

//   // Handle filter changes
//   useEffect(() => {
//     const applyFilters = async () => {
//       const filtered = await getCandidates(filterOptions)
//       setCandidates(filtered)
//     }

//     applyFilters()
//   }, [filterOptions])

//   // Handle resume scanning
//   const handleScanResume = async (resumeFile: File | null, jobDescription: string) => {
//     setIsScanning(true)

//     try {
//       const results = await scanResume(resumeFile, jobDescription)
//       setCandidates(results)
//     } catch (error) {
//       console.error("Error scanning resume:", error)
//       // In a real app, you would show an error message
//     } finally {
//       setIsScanning(false)
//     }
//   }

//   // Handle job description analysis
//   const handleAnalyzeJob = async (description: string) => {
//     setIsAnalyzing(true)

//     try {
//       const results = await scanResume(null, description)
//       setCandidates(results)
//     } catch (error) {
//       console.error("Error analyzing job:", error)
//       // In a real app, you would show an error message
//     } finally {
//       setIsAnalyzing(false)
//     }
//   }

//   // Handle saving a candidate
//   const handleSaveCandidate = async (id: string) => {
//     try {
//       await saveCandidate(id)

//       // Update the local state
//       setCandidates(
//         candidates.map((candidate) => (candidate.id === id ? { ...candidate, saved: !candidate.saved } : candidate)),
//       )
//     } catch (error) {
//       console.error("Error saving candidate:", error)
//       // In a real app, you would show an error message
//     }
//   }

//   return (
//     <div className="flex h-screen bg-[#0f1520] text-white">
//       {/* Sidebar */}
//       <Sidebar 
//         activeTab={activeTab} 
//         onTabChange={setActiveTab} 
//         isExpanded={isSidebarExpanded}
//         onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
//       />

//       {/* Main content with dynamic margin based on sidebar width */}
//       <div 
//         className={`
//           flex-1 overflow-auto transition-all duration-300
//           ${isSidebarExpanded ? 'ml-64' : 'ml-16'}
//         `}
//       >
//         {/* Header */}
//         <Header userInitials="JS" />

//         {/* Dashboard content */}
//         <main className="p-6">
//           <h2 className="text-2xl font-bold mb-6">Resume Scanning Dashboard</h2>

//           {/* Filter section */}
//           <FilterSection
//             isOpen={filterOpen}
//             toggleOpen={() => setFilterOpen(!filterOpen)}
//             activeTab={filterTab}
//             setActiveTab={setFilterTab}
//             filterOptions={filterOptions}
//             setFilterOptions={setFilterOptions}
//           />

//           {/* Main content grid */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Left column - Resume Scanner */}
//             <div className="lg:col-span-2">
//               <div className="grid grid-cols-1 gap-6">
//                 <ResumeScanner onScan={handleScanResume} isScanning={isScanning} />

//                 <JobDescriptionSection onSubmit={handleAnalyzeJob} isLoading={isAnalyzing} />
//               </div>
//             </div>

//             {/* Right column - Top Matching Candidates */}
//             <div>
//               <CandidatesSection candidates={candidates} onSaveCandidate={handleSaveCandidate} />
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }

"use client"

import { useState, useEffect, useCallback } from "react"

import { Header } from "@/components/layout/header"
import { FilterSection } from "@/components/features/filter-section"
import { ResumeScanner } from "@/components/features/resume-scanner"
import { CandidatesSection } from "@/components/features/candidates-section"
import { JobDescriptionSection } from "@/components/features/job-description"
import type { Candidate, FilterOptions } from "@/types"
import { getCandidates, saveCandidate } from "@/lib/data-service"
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

  // WebSocket state
  const [uploadSocket, setUploadSocket] = useState<WebSocket | null>(null)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [resumeRankings, setResumeRankings] = useState<any>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  // Data state
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    skills: [],
    experience: [],
    education: [],
  })

  // WebSocket connection setup
  const setupWebSocket = useCallback(() => {
    // Note: Replace with your actual WebSocket server URL
    const socket = new WebSocket('wss://rbd6wn7l-8000.inc1.devtunnels.ms/multi-upload');

    socket.onopen = () => {
      console.log('WebSocket connection established');
      setUploadSocket(socket);
    };

    socket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setAnalysisResults(parsedData);
        setUploadStatus('Analysis Complete');
        setIsScanning(false);
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
  }, [setupWebSocket]);

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

  // Handle resume scanning (multi-file upload)
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
      console.error('Error scanning resumes:', error);
      setUploadStatus('Error uploading files');
      setIsScanning(false);
    }
  };

  // Handle job description analysis and resume ranking
  const handleAnalyzeJob = async (description: string) => {
    if (!description) {
      setUploadStatus('Please provide a job description');
      return;
    }

    setIsAnalyzing(true);
    setUploadStatus('Ranking resumes...');

    try {
      // Note: Replace with your actual API endpoint
      const response = await fetch('https://rbd6wn7l-8000.inc1.devtunnels.ms/rank-resumes', {
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

      const rankingData = await response.json();
      setResumeRankings(rankingData);
      setUploadStatus('Resume Ranking Complete');
      setIsAnalyzing(false);

      // Update candidates based on ranking if possible
      if (rankingData.ranked_resumes) {
        const rankedCandidates = rankingData.ranked_resumes.map((resume: any, index: number) => ({
          ...resume,
          rank: index + 1
        }));
        setCandidates(rankedCandidates);
      }
    } catch (error) {
      console.error('Error analyzing job description:', error);
      setUploadStatus('Error ranking resumes');
      setIsAnalyzing(false);
    }
  };

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

          {/* Status display */}
          {uploadStatus && (
            <div className={`
              mb-4 p-3 rounded 
              ${uploadStatus.includes('Error') ? 'bg-red-600/20 text-red-400' : 'bg-green-600/20 text-green-400'}
            `}>
              {uploadStatus}
            </div>
          )}

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
                <ResumeScanner 
                  onScan={handleScanResume} 
                  isScanning={isScanning} 
                  multiple={true}  // Allow multiple file upload
                />

                <JobDescriptionSection 
                  onSubmit={handleAnalyzeJob} 
                  isLoading={isAnalyzing} 
                />
              </div>
            </div>

            {/* Right column - Top Matching Candidates */}
            <div>
              <CandidatesSection 
                candidates={candidates} 
                onSaveCandidate={handleSaveCandidate} 
                analysisResults={analysisResults}
                rankingResults={resumeRankings}
              />
            </div>
          </div>

          {/* Optional: Analysis Results Display */}
          {analysisResults && (
            <div className="mt-6 bg-gray-800 p-4 rounded">
              <h3 className="text-xl font-semibold mb-2">Analysis Results</h3>
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(analysisResults, null, 2)}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}