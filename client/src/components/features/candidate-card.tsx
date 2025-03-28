"use client"

import { motion } from "framer-motion"
import { Briefcase, GraduationCap, Star, FileText } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Candidate } from "@/types"

interface CandidateCardProps {
  candidate: Candidate
  index: number
  onSave: (id: string) => void
}

export function CandidateCard({ candidate, index, onSave }: CandidateCardProps) {
    const getMatchVariant = (match: number) => {
        if (match >= 90) return "success";      // Best match -> default
        if (match >= 80) return "success";      // Good match -> green
        if (match >= 70) return "outline";      // Okay match -> outline
        return "destructive";                   // Bad match -> red
    };

    return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-gray-900 rounded-lg p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-white">{candidate.name}</h4>
        <Badge variant={getMatchVariant(candidate.match)}>
          {candidate.match}% Match
        </Badge>
      </div>
      
      <div className="flex items-center text-sm text-gray-400 mb-2">
        <Briefcase size={14} className="mr-1" />
        <span>{candidate.years} years</span>
        <span className="mx-2">•</span>
        <span>{candidate.location}</span>
      </div>
      
      <div className="flex items-center text-sm text-gray-400 mb-3">
        <GraduationCap size={14} className="mr-1" />
        <span>{candidate.education}</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {candidate.skills.map((skill, i) => (
          <Badge key={i} variant="default">
            {skill}
          </Badge>
        ))}
      </div>
      
      <div>
        <p className="text-sm text-gray-400 mb-1">Highlights:</p>
        <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
          {candidate.highlights.map((highlight, i) => (
            <li key={i}>{highlight}</li>
          ))}
        </ul>
      </div>
      
      <div className="flex justify-between mt-4">
        <button 
          className={`text-sm flex items-center ${
            candidate.saved ? 'text-yellow-400' : 'text-gray-300 hover:text-white'
          }`}
          onClick={() => onSave(candidate.id)}
        >
          <Star size={14} className={`mr-1 ${candidate.saved ? 'fill-yellow-400' : ''}`} />
          {candidate.saved ? 'Saved' : 'Save'}
        </button>
        <button className="flex items-center bg-gray-800 text-white text-sm px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">
          <FileText size={14} className="mr-1" />
          Download Resume
        </button>
      </div>
    </motion.div>
  )
}