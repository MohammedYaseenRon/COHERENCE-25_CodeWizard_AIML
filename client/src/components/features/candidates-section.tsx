import React from 'react'

interface Candidate {
  match_percentage?: number
  matching_skills?: string[]
  gaps?: string[]
  reasoning?: string
  filename?: string
  full_resume?: {
    contact_info?: {
      full_name?: string
      email?: string
      phone?: string
      location?: string | null
      linkedin?: string | null
    }
    education?: Array<{
      degree?: string
      institution?: string
      graduation_year?: number
      gpa?: number
      honors?: string | null
    }>
    work_experience?: Array<{
      company?: string
      job_title?: string
      start_date?: string
      end_date?: string
      responsibilities?: string[]
      technologies?: string[] | null
    }>
    skills?: {
      technical_skills?: string[]
      soft_skills?: string[] | null
      certifications?: string[] | null
    }
    summary?: string
    projects?: string[] | null
  }
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
    // const candidateAnalysis = analysisResults?.[candidate.name];
    
    return (
      <div className="space-y-2">
        {candidate.rank && (
          <div className="text-sm text-yellow-400">
            Ranking: #{candidate.rank}
          </div>
        )}
        
        {candidate.full_resume?.contact_info?.phone && (
          <div className="text-xs text-gray-400">
            <strong>Contact:</strong> {candidate.full_resume.contact_info.phone}
          </div>
        )}
        
        {candidate.full_resume?.skills?.technical_skills && (
          <div className="text-xs">
            <strong>Skills:</strong> {candidate.full_resume?.skills?.technical_skills.join(', ')}
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
              key={candidate.filename} 
              className="bg-[#2c3646] p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{candidate.full_resume?.contact_info?.full_name}</div>
                {renderCandidateDetails(candidate)}
              </div>
              
              <button 
                onClick={() => onSaveCandidate(candidate.filename || '')}
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