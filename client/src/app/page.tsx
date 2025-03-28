// ResumeScannerApp.jsx
"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { FilterSection } from "@/components/features/filter-section";
import { ResumeScanner } from "@/components/features/resume-scanner";
import { CandidatesSection } from "@/components/features/candidates-section";
import { JobDescriptionSection } from "@/components/features/job-description";
import type { Candidate, FilterOptions } from "@/types";
import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/components/layout/sidebar"), {
  ssr: false,
});

export default function ResumeScannerApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState("matches");
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    skills: [],
    experience: [],
    education: [],
  });

  const WS_URL = "wss://rbd6wn7l-8000.inc1.devtunnels.ms";

  const connectWebSocket = (endpoint: string) => {
    return new WebSocket(`${WS_URL}${endpoint}`);
  };

  // Transform ResumeProfile to Candidate
  const mapResumeProfileToCandidate = (profile: any): Candidate => {
    const yearsOfExperience = profile.work_experience.reduce((total: number, job: any) => {
      const start = new Date(job.start_date);
      const end = job.end_date ? new Date(job.end_date) : new Date();
      const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    return {
      id: `${profile.contact_info.full_name}-${Date.now()}`, // Ensure unique ID
      name: profile.contact_info.full_name || "Unknown",
      years: Math.round(yearsOfExperience),
      location: profile.contact_info.location || "Unknown",
      education: profile.education[0]?.degree + " from " + profile.education[0]?.institution || "Not specified",
      skills: profile.skills.technical_skills || [],
      highlights: profile.work_experience.flatMap((job: any) => job.responsibilities) || [],
      match: Math.floor(Math.random() * 31) + 70, // Mock match percentage
      saved: false,
      email: profile.contact_info.email || "Not provided", // Added from API
      experience: Math.round(yearsOfExperience), // Assuming experience is same as years, adjust if needed
      matchScore: Math.floor(Math.random() * 31) + 70, // Assuming matchScore is same as match, adjust if different
    };
  };

  // Handle resume scanning with WebSocket
  const handleScanResume = async (resumeFiles: File[], jobDescription: string) => {
    setIsScanning(true);
    const ws = connectWebSocket("/multi-upload");

    ws.onopen = async () => {
      await ws.send(JSON.stringify({ num_files: resumeFiles.length }));

      for (const file of resumeFiles) {
        await ws.send(JSON.stringify({ filename: file.name }));
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const chunkSize = 1024 * 1024;
          const totalChunks = Math.ceil(arrayBuffer.byteLength / chunkSize);

          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, arrayBuffer.byteLength);
            const chunk = arrayBuffer.slice(start, end);
            ws.send(chunk);
          }
          ws.send("EOF");
        };
        reader.readAsArrayBuffer(file);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const results = Object.values(data).map((result: any) =>
        mapResumeProfileToCandidate(result)
      );
      setCandidates(results);
      setIsScanning(false);
      ws.close();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsScanning(false);
    };
  };

  // Handle job description analysis (mock for now, adjust as needed)
  const handleAnalyzeJob = async (description: string) => {
    setIsAnalyzing(true);
    const ws = connectWebSocket("/resume-analyze");

    ws.onopen = () => {
      ws.send(JSON.stringify({ filename: "job_description.txt" }));
      ws.send(description);
      ws.send("EOF");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const candidate = mapResumeProfileToCandidate(data); // Assuming single resume analysis
      setCandidates([candidate]);
      setIsAnalyzing(false);
      ws.close();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsAnalyzing(false);
    };
  };

  const handleSaveCandidate = async (id: string) => {
    setCandidates(
      candidates.map((candidate) =>
        candidate.id === id ? { ...candidate, saved: !candidate.saved } : candidate
      )
    );
  };

  useEffect(() => {
    // Add filtering logic if needed
  }, [filterOptions]);

  return (
    <div className="flex h-screen bg-[#0f1520] text-white">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />
      <div
        className={`flex-1 overflow-auto transition-all duration-300 ${
          isSidebarExpanded ? "ml-64" : "ml-16"
        }`}
      >
        <Header userInitials="JS" />
        <main className="p-6">
          <h2 className="text-2xl font-bold mb-6">Resume Scanning Dashboard</h2>
          <FilterSection
            isOpen={filterOpen}
            toggleOpen={() => setFilterOpen(!filterOpen)}
            activeTab={filterTab}
            setActiveTab={setFilterTab}
            filterOptions={filterOptions}
            setFilterOptions={setFilterOptions}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                <ResumeScanner onScan={handleScanResume} isScanning={isScanning} />
                <JobDescriptionSection onSubmit={handleAnalyzeJob} isLoading={isAnalyzing} />
              </div>
            </div>
            <div>
              <CandidatesSection candidates={candidates} onSaveCandidate={handleSaveCandidate} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}