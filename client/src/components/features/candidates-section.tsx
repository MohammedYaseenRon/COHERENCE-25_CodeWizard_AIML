// "use client"

// import Link from "next/link"
// import type { Candidate } from "@/types"
// import { CandidateCard } from "./candidate-card"

// interface CandidatesSectionProps {
//   candidates: Candidate[]
//   onSaveCandidate: (id: string) => void
// }

// export function CandidatesSection({ candidates, onSaveCandidate }: CandidatesSectionProps) {
//   return (
//     <div className="bg-[#1a2235] rounded-lg p-6">
//       <div className="flex items-center justify-between mb-6">
//         <h3 className="text-xl font-bold">Top Matching Candidates</h3>
//         <Link href="#" className="text-sm bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">
//           View All
//         </Link>
//       </div>

//       {candidates.length > 0 ? (
//         <div className="space-y-4">
//           {candidates.map((candidate, index) => (
//             <CandidateCard key={candidate.id} candidate={candidate} index={index} onSave={onSaveCandidate} />
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-8 text-gray-400">
//           <p>No matching candidates found.</p>
//           <p className="text-sm mt-2">Try adjusting your filters or scan a resume.</p>
//         </div>
//       )}
//     </div>
//   )
// }

import React from 'react'

interface Candidate {
  id: string
  name: string
  skills?: string[]
  experience?: string
  saved?: boolean
  rank?: number
}

interface CandidatesSectionProps {
  candidates: Candidate[]
  onSaveCandidate: (id: string) => void
  analysisResults?: any
  rankingResults?: any
}

export const CandidatesSection: React.FC<CandidatesSectionProps> = ({ 
  candidates, 
  onSaveCandidate, 
  analysisResults,
  rankingResults 
}) => {
  const renderCandidateDetails = (candidate: Candidate) => {
    // Try to get additional details from analysis results
    const candidateAnalysis = analysisResults?.[candidate.name];
    
    return (
      <div className="space-y-2">
        {candidate.rank && (
          <div className="text-sm text-yellow-400">
            Ranking: #{candidate.rank}
          </div>
        )}
        
        {candidateAnalysis?.contact_info && (
          <div className="text-xs text-gray-400">
            <strong>Contact:</strong> {candidateAnalysis.contact_info.email}
          </div>
        )}
        
        {candidate.skills && (
          <div className="text-xs">
            <strong>Skills:</strong> {candidate.skills.join(', ')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#1b2537] p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Top Matching Candidates 
          {rankingResults?.ranking_method && 
            ` (${rankingResults.ranking_method})`}
        </h3>
        <span className="text-sm text-gray-400">
          {candidates.length} Candidates
        </span>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No candidates found
        </div>
      ) : (
        <ul className="space-y-4">
          {candidates.map((candidate) => (
            <li 
              key={candidate.id} 
              className="bg-[#2c3646] p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{candidate.name}</div>
                {renderCandidateDetails(candidate)}
              </div>
              
              <button 
                onClick={() => onSaveCandidate(candidate.id)}
                className={`
                  py-1 px-3 rounded text-sm
                  ${candidate.saved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                  text-white
                `}
              >
                {candidate.saved ? 'Saved' : 'Save'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Optional: Comprehensive Analysis Details */}
      {analysisResults && (
        <details className="mt-4 text-xs bg-[#2c3646] p-2 rounded">
          <summary>Full Analysis Details</summary>
          <pre className="overflow-x-auto">
            {JSON.stringify(analysisResults, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}