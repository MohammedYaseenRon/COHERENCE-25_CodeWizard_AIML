"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  GraduationCap,
  Star,
  FileText,
  Award,
  Phone,
  Mail,
  MapPin,
  Code,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "@/types";

interface CandidateCardProps {
  candidate: Candidate;
  index: number;
  onSave: (id: string) => void;
  onSelect?: (candidate: Candidate) => void;
  isSelected?: boolean;
}

export function CandidateCard({
  candidate,
  index,
  onSave,
  onSelect,
  isSelected = false,
}: CandidateCardProps) {
  const parsedResume =
    typeof candidate.full_resume === "string"
      ? JSON.parse(candidate.full_resume)
      : candidate.full_resume || {};

  const fullName = parsedResume?.contact_info?.full_name || "Unknown";
  const email = parsedResume?.contact_info?.email;
  const phone = parsedResume?.contact_info?.phone;
  const location = parsedResume?.contact_info?.location;
  const skills = parsedResume?.skills?.technical_skills || [];
  const education = parsedResume?.education?.[0];
  const experience = parsedResume?.work_experience?.[0];
  const matchPercentage = candidate.match_percentage || 0;
  const matchingSkills = candidate.matching_skills || [];
  const gaps = candidate.gaps || [];

  // Get color based on match percentage for badge only
  const getMatchColor = (match: number) => {
    if (match >= 80) return "bg-green-600";
    if (match >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Updated rank badge color based on match percentage
  const getRankBadgeColor = (match: number) => {
    if (match >= 80)
      return "bg-green-500/20 text-green-300 border-green-500/30";
    if (match >= 50)
      return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-red-500/20 text-red-300 border-red-500/30";
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      },
    },
    selected: {
      scale: 1.02,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.2 },
    },
  };

  return (
    <motion.div
      className={`candidate-card bg-[#1a1a1a] rounded-lg p-5 border-l-4 
      ${isSelected ? "border-green-500" : "border-gray-600"} 
      flex flex-col h-full`}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      style={{
        ...(isSelected
          ? {
              borderLeftColor: "#22c55e", // green-500
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }
          : {}),
        height: "450px", // Fixed height for all cards
      }}
    >
      {/* Header with name and match percentage - Not scrollable */}
      <div className="flex justify-between items-center mb-4">
        <motion.h3
          className="font-bold text-lg text-white truncate max-w-[180px]"
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
          {fullName}
        </motion.h3>
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
          <div className="flex items-center">
            {candidate.rank && (
              <Badge
                variant="outline"
                className={`mr-2 ${getRankBadgeColor(matchPercentage)}`}
              >
                Rank #{candidate.rank}
              </Badge>
            )}
            <div
              className={`px-3 py-1 rounded-b-xl text-xsm font-medium ${getMatchColor(
                matchPercentage
              )} text-white`}
            >
              {matchPercentage.toFixed(1)}% Match
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact information - Not scrollable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm">
        {phone && (
          <motion.div
            className="flex items-center text-gray-300"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.2 }}
          >
            <Phone size={14} className="mr-2 text-gray-400" />
            {phone}
          </motion.div>
        )}
        {email && (
          <motion.div
            className="flex items-center text-gray-300 overflow-hidden"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.25 }}
          >
            <Mail size={14} className="mr-2 flex-shrink-0 text-gray-400" />
            <span className="truncate">{email}</span>
          </motion.div>
        )}
        {location && (
          <motion.div
            className="flex items-center text-gray-300"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.3 }}
          >
            <MapPin size={14} className="mr-2 text-gray-400" />
            {location}
          </motion.div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="h-full">
          {/* Education and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {education && (
              <motion.div
                className="flex items-start"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.35 }}
              >
                <GraduationCap
                  size={16}
                  className="mr-2 mt-1 text-gray-400 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    {education.degree}
                  </p>
                  <p className="text-xs text-gray-400">
                    {education.institution}
                  </p>
                  {education.graduation_year && (
                    <p className="text-xs text-gray-500">
                      Class of {education.graduation_year}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {experience && (
              <motion.div
                className="flex items-start"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.4 }}
              >
                <Briefcase
                  size={16}
                  className="mr-2 mt-1 text-gray-400 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    {experience.job_title}
                  </p>
                  <p className="text-xs text-gray-400">{experience.company}</p>
                  {experience.start_date && experience.end_date && (
                    <p className="text-xs text-gray-500">
                      {experience.start_date} - {experience.end_date}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Skills section */}
          <motion.div
            className="mb-4"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.45 }}
          >
            <div className="flex items-center mb-2">
              <Code size={14} className="mr-2 text-gray-400" />
              <h4 className="text-sm font-medium text-white">Key Skills</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 + 0.5 + i * 0.05 }}
                >
                  <Badge
                    variant="outline"
                    className={`${
                      matchingSkills.includes(skill)
                        ? "bg-gray-700/70 text-gray-200 border-gray-600"
                        : "bg-gray-800/50 text-gray-300 border-gray-700"
                    }`}
                  >
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Match analysis */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.55 }}
          >
            {matchingSkills.length > 0 && (
              <div>
                <div className="flex items-center mb-1">
                  <Check size={14} className="mr-1 text-green-400" />
                  <span className="text-xs font-medium text-green-400">
                    Matches
                  </span>
                </div>
                <p className="text-xs text-gray-300">
                  {matchingSkills.join(", ")}
                </p>
              </div>
            )}

            {Array.isArray(gaps) && gaps.length > 0 && (
              <div>
                <div className="flex items-center mb-1">
                  <X size={14} className="mr-1 text-red-400" />
                  <span className="text-xs font-medium text-red-400">Gaps</span>
                </div>
                <p className="text-xs text-gray-300">{gaps.join(", ")}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Actions - Not scrollable */}
      <motion.div
        className="flex justify-between items-center pt-3 mt-3 border-t border-gray-700/50"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.05 + 0.6 }}
      >
        <button
          onClick={() => onSelect && onSelect(candidate)}
          className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-white py-1 px-3 rounded transition-colors"
        >
          <FileText size={14} className="mr-1" />
          View Details
        </button>

        <button
          onClick={() => onSave(candidate.filename || "")}
          className={`
            flex items-center text-sm py-1 px-3 rounded transition-colors
            ${
              candidate.saved
                ? "bg-gray-600 hover:bg-gray-500 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-white"
            }
          `}
        >
          <Star
            size={14}
            className={`mr-1 ${candidate.saved ? "fill-white" : ""}`}
          />
          {candidate.saved ? "Saved" : "Save"}
        </button>
      </motion.div>
    </motion.div>
  );
}
