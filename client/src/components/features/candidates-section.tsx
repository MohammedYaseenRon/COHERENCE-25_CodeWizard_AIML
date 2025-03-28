import React, { useState } from 'react'

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
  selected?: boolean
}

interface CandidatesSectionProps {
  candidates: Candidate[]
  onSaveCandidate: (id: string) => void
  onSendMail?: (selectedCandidates: Candidate[]) => void
  analysisResults?: any
  rankingResults?: any
}

export const CandidatesSection: React.FC<CandidatesSectionProps> = ({ 
  candidates, 
  onSaveCandidate, 
  onSendMail,
  analysisResults,
  rankingResults 
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<Candidate[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)

  const renderCandidateDetails = (candidate: Candidate) => {
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

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidates(prev => 
      prev.some(c => c.filename === candidate.filename)
        ? prev.filter(c => c.filename !== candidate.filename)
        : [...prev, candidate]
    )
  }

  const handleSelectAll = () => {
    setIsAllSelected(!isAllSelected)
    setSelectedCandidates(!isAllSelected ? [...candidates] : [])
  }

  const handleSendMail = () => {
    if (onSendMail && selectedCandidates.length > 0) {
      onSendMail(selectedCandidates)
    }
  }

  return (
    <div className="bg-[#1b2537] p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            Top Matching Candidates 
            {rankingResults?.ranking_method && 
              ` (${rankingResults.ranking_method})`}
          </h3>
          <label className="flex items-center space-x-2 text-sm">
            <input 
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              className="form-checkbox h-8 w-8 text-blue-600 bg-gray-800 border-gray-700 rounded"
            />
            <span>Select All</span>
          </label>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {candidates.length} Candidates
          </span>
          {selectedCandidates.length > 0 && (
            <button 
              onClick={handleSendMail}
              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
            >
              Send Mail ({selectedCandidates.length})
            </button>
          )}
        </div>
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
              <div className="flex items-center space-x-4">
                <input 
                  type="checkbox"
                  checked={selectedCandidates.some(c => c.filename === candidate.filename)}
                  onChange={() => handleSelectCandidate(candidate)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-gray-800 border-gray-700 rounded"
                />
                <div>
                  <div className="font-semibold">{candidate.full_resume?.contact_info?.full_name}</div>
                  {renderCandidateDetails(candidate)}
                </div>
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