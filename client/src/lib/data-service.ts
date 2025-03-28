import type { Candidate, Job, FilterOptions } from "@/types"
import { v4 as uuidv4 } from "uuid"

// Mock data
const mockCandidates: Candidate[] = [
  {
    id: "1",
    name: "Alex Johnson",
    match: 92,
    years: 5,
    location: "San Francisco, CA",
    education: "M.S. Computer Science",
    skills: ["React", "TypeScript", "Node.js", "AWS"],
    highlights: ["Full-stack development", "Team leadership"],
    saved: false,
  },
  {
    id: "2",
    name: "Sarah Miller",
    match: 87,
    years: 4,
    location: "New York, NY",
    education: "B.S. Computer Engineering",
    skills: ["JavaScript", "React", "Python", "Docker"],
    highlights: ["Frontend specialist", "UI/UX design"],
    saved: false,
  },
  {
    id: "3",
    name: "Marcus Chen",
    match: 85,
    years: 6,
    location: "Seattle, WA",
    education: "B.S. Software Engineering",
    skills: ["Java", "Spring", "React", "TypeScript"],
    highlights: ["Backend architecture", "Microservices"],
    saved: false,
  },
  {
    id: "4",
    name: "Priya Patel",
    match: 78,
    years: 3,
    location: "Austin, TX",
    education: "B.S. Computer Science",
    skills: ["Python", "Django", "React", "PostgreSQL"],
    highlights: ["Data engineering", "API development"],
    saved: false,
  },
  {
    id: "5",
    name: "David Kim",
    match: 75,
    years: 7,
    location: "Chicago, IL",
    education: "Ph.D. Computer Science",
    skills: ["Machine Learning", "Python", "TensorFlow", "AWS"],
    highlights: ["AI research", "Data science"],
    saved: false,
  },
]

const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechCorp Inc.",
    location: "San Francisco, CA",
    description:
      "We are looking for a Senior Frontend Developer with strong React and TypeScript experience to join our team.",
    skills: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    datePosted: "2025-03-15",
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "InnovateSoft",
    location: "Remote",
    description:
      "Seeking a Full Stack Engineer with experience in Node.js, React, and AWS to help build our next-generation platform.",
    skills: ["Node.js", "React", "AWS", "MongoDB", "TypeScript"],
    datePosted: "2025-03-20",
  },
  {
    id: "3",
    title: "Backend Developer",
    company: "DataFlow Systems",
    location: "Seattle, WA",
    description: "Backend Developer needed to work on our microservices architecture using Java and Spring Boot.",
    skills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Docker"],
    datePosted: "2025-03-22",
  },
]

// Simulate API calls with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getCandidates(filters?: FilterOptions): Promise<Candidate[]> {
  await delay(1000) // Simulate network delay

  if (!filters) return mockCandidates

  return mockCandidates.filter((candidate) => {
    // Filter by skills
    if (filters.skills.length > 0 && !candidate.skills.some((skill) => filters.skills.includes(skill))) {
      return false
    }

    // Filter by experience
    if (filters.experience.length > 0) {
      const matchesExperience = filters.experience.some((exp) => {
        if (exp === "0-2") return candidate.years >= 0 && candidate.years <= 2
        if (exp === "3-5") return candidate.years >= 3 && candidate.years <= 5
        if (exp === "5+") return candidate.years > 5
        return false
      })

      if (!matchesExperience) return false
    }

    // Filter by education
    if (filters.education.length > 0) {
      const matchesEducation = filters.education.some((edu) => {
        return candidate.education.includes(edu)
      })

      if (!matchesEducation) return false
    }

    return true
  })
}

export async function getJobs(): Promise<Job[]> {
  await delay(800) // Simulate network delay
  return mockJobs
}

export async function scanResume(resumeFile: File | null, jobDescription: string): Promise<Candidate[]> {
  await delay(2000) // Simulate processing time

  // In a real app, you would upload the file and process it
  // For this demo, we'll just return filtered candidates based on the job description

  // Extract keywords from job description
  const keywords = jobDescription.toLowerCase().split(/\s+/)

  // Filter and sort candidates based on keyword matches
  const matchedCandidates = mockCandidates
    .map((candidate) => {
      // Calculate a match score based on skills and highlights matching keywords
      const skillMatches = candidate.skills.filter((skill) => keywords.includes(skill.toLowerCase())).length

      const highlightMatches = candidate.highlights.filter((highlight) =>
        keywords.some((keyword) => highlight.toLowerCase().includes(keyword)),
      ).length

      // Calculate a new match percentage
      const newMatch = Math.min(
        95, // Cap at 95%
        Math.round(skillMatches * 15 + highlightMatches * 10 + Math.random() * 10),
      )

      return {
        ...candidate,
        match: newMatch,
      }
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 3) // Return top 3 matches

  return matchedCandidates
}

export async function saveCandidate(id: string): Promise<Candidate> {
  await delay(300) // Simulate network delay

  const candidate = mockCandidates.find((c) => c.id === id)

  if (!candidate) {
    throw new Error("Candidate not found")
  }

  // Toggle saved status
  candidate.saved = !candidate.saved

  return candidate
}

export async function createCandidate(data: Omit<Candidate, "id">): Promise<Candidate> {
  await delay(500) // Simulate network delay

  const newCandidate: Candidate = {
    ...data,
    id: uuidv4(),
  }

  // In a real app, you would save this to a database
  mockCandidates.push(newCandidate)

  return newCandidate
}

