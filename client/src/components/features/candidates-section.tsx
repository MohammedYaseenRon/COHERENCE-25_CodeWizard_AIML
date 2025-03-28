// candidates-section.tsx
"use client";
import Link from "next/link";
import type { Candidate } from "@/types";
import { CandidateCard } from "./candidate-card";

interface CandidatesSectionProps {
  candidates: Candidate[];
  onSaveCandidate: (id: string) => void;
}

export function CandidatesSection({ candidates, onSaveCandidate }: CandidatesSectionProps) {
  return (
    <div className="bg-[#1a2235] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Top Matching Candidates</h3>
        <Link href="#" className="text-sm bg-gray-800 px-3 py-1 rounded-md hover:bg-gray-700 transition-colors">
          View All
        </Link>
      </div>

      {candidates.length > 0 ? (
        <div className="space-y-4">
          {candidates.map((candidate, index) => (
            <CandidateCard key={candidate.id} candidate={candidate} index={index} onSave={onSaveCandidate} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <p>No matching candidates found.</p>
          <p className="text-sm mt-2">Try adjusting your filters or scan a resume.</p>
        </div>
      )}
    </div>
  );
}