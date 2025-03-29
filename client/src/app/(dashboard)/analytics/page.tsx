"use client"

import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
import { AlertTriangle, BarChart2, Users, MapPin, Calendar, BookOpen, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ContactInfo {
  full_name: string
  email: string
  phone: string
  location: string
  linkedin: string | null
}

interface Education {
  degree: string
  institution: string
  graduation_year: number
  gpa: string | null
  honors: string | null
}

interface WorkExperience {
  company: string
  job_title: string
  start_date: string
  end_date: string | null
  responsibilities: string[]
  technologies: string | null
}

interface Skills {
  technical_skills: string[]
  soft_skills: string | null
  certifications: string | null
}

interface Project {
  name: string
  description: string
  technologies: string[]
  start_date: string | null
  end_date: string | null
  link: string | null
}

interface ResumeProfile {
  contact_info: ContactInfo
  education: Education[]
  work_experience: WorkExperience[]
  skills: Skills
  summary: string
  projects: Project[]
  achievements: string | null
}

// Sample resume data
const resumeData: {
  [key: string]: { resume_id: string; profile: ResumeProfile; selection_reason: string; selection_date: string }
} = {
  "1": {
    resume_id: "1",
    profile: {
      contact_info: {
        full_name: "PRANAV KULKARNI",
        email: "kulkarnipranav901@gmail.com",
        phone: "9403579863",
        location: "PIMPRI-CHINCHWAD PUNE-411017",
        linkedin: null,
      },
      education: [
        {
          degree: "Information Technology",
          institution: "International institute of Information Technology IIIT pune",
          graduation_year: 2026,
          gpa: null,
          honors: null,
        },
      ],
      work_experience: [
        {
          company: "INTERNSHIP",
          job_title: "Web Development training",
          start_date: "N/A",
          end_date: null,
          responsibilities: ["Web Development training"],
          technologies: null,
        },
      ],
      skills: {
        technical_skills: [
          "HTML",
          "Java script",
          "React",
          "Tailwind CSS",
          "Node.js",
          "Express(EX)",
          "Hono",
          "Zod",
          "Next.js",
          "RESTful APIs",
          "MongoDB",
          "PostgreSQL",
          "MySQL",
          "CI/CD",
          "Pipelines",
          "Kubernetes",
        ],
        soft_skills: null,
        certifications: null,
      },
      summary: "A passionate Full Stack Developer with expertise in frontend, backend, and DevOps technologies...",
      projects: [
        {
          name: "Todo Application",
          description: "Developing a to-do app with Node.js, MongoDB, Express, and React...",
          technologies: ["Node.js", "MongoDB", "Express", "React"],
          start_date: null,
          end_date: null,
          link: "https://github.com/Praxxav/Todo-app",
        },
        {
          name: "Dukkan Web Interface",
          description: "Developed Dukkan interface using Tailwind CSS...",
          technologies: ["Tailwind CSS"],
          start_date: null,
          end_date: null,
          link: "https://github.com/Praxxav/dukkan",
        },
      ],
      achievements: null,
    },
    selection_reason: "Fit for role",
    selection_date: "29-03-2025",
  },
  "2": {
    resume_id: "2",
    profile: {
      contact_info: {
        full_name: "PRIYA SHARMA",
        email: "priya.sharma@gmail.com",
        phone: "9876543210",
        location: "MUMBAI-400001",
        linkedin: null,
      },
      education: [
        {
          degree: "Computer Science",
          institution: "Mumbai University",
          graduation_year: 2025,
          gpa: null,
          honors: null,
        },
      ],
      work_experience: [
        {
          company: "TECH CORP",
          job_title: "Software Intern",
          start_date: "06-2024",
          end_date: "12-2024",
          responsibilities: ["Developed web applications"],
          technologies: null,
        },
      ],
      skills: {
        technical_skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "MongoDB", "Express"],
        soft_skills: null,
        certifications: null,
      },
      summary: "Enthusiastic developer with experience in web development...",
      projects: [
        {
          name: "E-commerce Platform",
          description: "Built an e-commerce platform using React and Node.js...",
          technologies: ["React", "Node.js", "MongoDB"],
          start_date: null,
          end_date: null,
          link: null,
        },
      ],
      achievements: null,
    },
    selection_reason: "Strong technical skills",
    selection_date: "29-03-2025",
  },
}

export default function BiasAnalyticsDashboard() {
  // Extract profiles for easier access
  const profiles = useMemo(() => {
    return Object.values(resumeData).map((item) => item.profile)
  }, [])

  // Helper function to infer gender from name
  const inferGender = (name: string): string => {
    const firstName = name.split(" ")[0].toLowerCase()
    if (firstName.includes("pranav")) return "Male"
    if (firstName.includes("priya")) return "Female"
    return "Unknown"
  }

  // Helper to parse location into city
  const getCity = (location: string): string => {
    if (!location) return "Unknown"
    const cityMatch = location.match(/(PUNE|MUMBAI|DELHI|BANGALORE|CHENNAI|HYDERABAD)/i)
    return cityMatch ? cityMatch[0] : "Other"
  }

  // Analyze potential biases
  const biasAnalysis = useMemo(() => {
    const genderData = profiles.reduce(
      (acc, profile) => {
        const gender = inferGender(profile.contact_info.full_name)
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    const locationData = profiles.reduce(
      (acc, profile) => {
        const city = getCity(profile.contact_info.location)
        acc[city] = (acc[city] || 0) + 1
        return acc
      },
      {} as { [key: string]: number },
    )

    const gradYearData = profiles.reduce(
      (acc, profile) => {
        profile.education.forEach((edu) => {
          const year = edu.graduation_year
          if (year) {
            acc[year] = (acc[year] || 0) + 1
          }
        })
        return acc
      },
      {} as { [key: string]: number },
    )

    const institutionData = profiles.reduce(
      (acc, profile) => {
        profile.education.forEach((edu) => {
          const inst = edu.institution
          if (inst) {
            const simplifiedInst = inst.includes("IIIT") ? "IIIT" : inst.includes("Mumbai") ? "Mumbai University" : inst
            acc[simplifiedInst] = (acc[simplifiedInst] || 0) + 1
          }
        })
        return acc
      },
      {} as { [key: string]: number },
    )

    const allSkills = profiles.flatMap((profile) => profile.skills.technical_skills || [])

    const uniqueSkills = [...new Set(allSkills)]
    const skillsByCandidate = profiles.map((profile) => ({
      name: profile.contact_info.full_name,
      skillCount: (profile.skills.technical_skills || []).length,
      uniqueSkillCount: new Set(profile.skills.technical_skills || []).size,
    }))

    const projectsByCandidate = profiles.map((profile) => ({
      name: profile.contact_info.full_name,
      projectCount: (profile.projects || []).length,
    }))

    return {
      genderData: Object.entries(genderData).map(([name, value]) => ({ name, value })),
      locationData: Object.entries(locationData).map(([name, value]) => ({ name, value })),
      gradYearData: Object.entries(gradYearData)
        .map(([name, value]) => ({ name: String(name), value }))
        .sort((a, b) => a.name.localeCompare(b.name)),

      institutionData: Object.entries(institutionData).map(([name, value]) => ({ name, value })),
      skillsByCandidate,
      projectsByCandidate,
      uniqueSkillsCount: uniqueSkills.length,
    }
  }, [profiles])

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Resume Bias Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Analyzing potential biases in candidate selection process</p>
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="text-amber-500" />
          <CardTitle>Bias Risk Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">
            This dashboard analyzes potential biases in the selection process. The visualizations help identify patterns
            that might indicate unfair advantages or disadvantages based on factors like gender, location, education
            institution, or graduation year.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={biasAnalysis.genderData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Location Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={biasAnalysis.locationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {biasAnalysis.locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graduation Year Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Graduation Year Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart outerRadius={90} data={biasAnalysis.gradYearData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Candidates" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Institution Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Institution Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={biasAnalysis.institutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Skills Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={biasAnalysis.skillsByCandidate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="skillCount" name="Total Skills" fill="#FFBB28" />
                <Bar dataKey="uniqueSkillCount" name="Unique Skills" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Projects Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={biasAnalysis.projectsByCandidate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="projectCount" name="Number of Projects" fill="#8884D8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

