"use client"

import { useState } from "react"
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
  ResponsiveContainer 
} from "recharts"
import { AlertTriangle, Users, MapPin, Calendar, BookOpen, Briefcase, GraduationCap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Type definitions
interface Representation {
  [key: string]: number;
}

interface IndustryBenchmark {
  [key: string]: number;
}

interface BiasMetric {
  representation: Representation;
  industry_benchmark: IndustryBenchmark;
  findings: string;
  recommendations: string;
}

interface BiasMetrics {
  gender: BiasMetric;
  age: BiasMetric;
  ethnicity?: BiasMetric;
  education: BiasMetric;
  experience: BiasMetric;
}

interface BiasAnalysisResult {
  summary: string;
  fairness_score: number;
  bias_metrics: BiasMetrics;
  recommendations: string[];
}

interface ChartDataPoint {
  name: string;
  value: number;
}

export default function BiasAnalysisPage(): JSX.Element {
  const [jobTitle, setJobTitle] = useState<string>("")
  const [jobDescription, setJobDescription] = useState<string>("")
  const [analysisResult, setAnalysisResult] = useState<BiasAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)

  const sampleBiasData: BiasAnalysisResult = {
    "summary": "Based on the limited profile data provided (2 candidates), a comprehensive bias analysis is challenging. The primary limitation is the lack of information regarding gender, age, and ethnicity. Both profiles appear to be for the same candidate, based on the identical name, email, and other data. There is also a significant lack of experience. The 'education' and 'experience' categories present the most readily identifiable potential biases given the job description.",
    "fairness_score": 3.0,
    "bias_metrics": {
      "gender": {
        "representation": {
          "male": 100,
          "female": 0,
          "other": 0
        },
        "industry_benchmark": {
          "male": 60,
          "female": 35,
          "other": 5
        },
        "findings": "Assuming 'Pranav' is a male name, there is a complete lack of female representation in the candidate pool. This is a potential bias.",
        "recommendations": "Actively source female candidates through targeted outreach and partnerships with organizations promoting women in tech. Consider anonymizing resumes to reduce unconscious bias during the initial screening process."
      },
      "age": {
        "representation": {
          "unknown": 100
        },
        "industry_benchmark": {
          "25-34": 40,
          "35-44": 30,
          "45-54": 20,
          "55+": 10
        },
        "findings": "Age is not discernible from the provided data. However, given the graduation year of 2026, it is highly unlikely that the candidate possesses the 5+ years of experience requested.",
        "recommendations": "Consider including age ranges in your diversity metrics, or collecting graduation years to infer age, while being mindful of data privacy regulations. Ensure that age-related assumptions do not influence candidate selection."
      },
      "ethnicity": {
        "representation": {
          "unknown": 100
        },
        "industry_benchmark": {
          "white": 50,
          "asian": 30,
          "black": 10,
          "hispanic": 10
        },
        "findings": "Ethnicity cannot be determined from the available data (name and location).",
        "recommendations": "Collect ethnicity data through voluntary self-identification, ensuring anonymity and compliance with privacy regulations. Use this data to track representation and identify potential disparities. Be aware of name-based biases, which may disproportionately disadvantage candidates from certain ethnic backgrounds."
      },
      "education": {
        "representation": {
          "bachelor_degree": 0,
          "in_progress": 100
        },
        "industry_benchmark": {
          "bachelor_degree": 90,
          "master_degree": 10
        },
        "findings": "Both candidates are currently pursuing their bachelor's degree. This does not align with the job requirements.",
        "recommendations": "Prioritize candidates with completed degrees, as specified in the job description. If considering candidates currently enrolled, carefully evaluate their experience and skills against the requirements."
      },
      "experience": {
        "representation": {
          "five_plus_years": 0,
          "less_than_one_year": 100
        },
        "industry_benchmark": {
          "five_plus_years": 80,
          "less_than_five_years": 20
        },
        "findings": "The provided profiles indicate a lack of the 5+ years of professional experience required for a senior role. The candidate only indicates an internship.",
        "recommendations": "Ensure that candidates meet the minimum experience requirements outlined in the job description. Weigh experience more heavily in the selection process for senior-level positions."
      }
    },
    "recommendations": [
      "Collect demographic data (gender, ethnicity, age) through voluntary self-identification to track representation and identify potential disparities, ensuring compliance with privacy regulations.",
      "Actively source candidates from underrepresented groups through targeted outreach and partnerships with diversity-focused organizations.",
      "Prioritize candidates who meet the minimum qualifications outlined in the job description, particularly regarding education and experience."
    ]
  }

  const COLORS: string[] = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  const handleAnalyze = (): void => {
    if (!jobTitle || !jobDescription) {
      alert("Please fill both job title and job description fields")
      return
    }

    setIsAnalyzing(true)
    
    // Simulate API call delay
    setTimeout(() => {
      setAnalysisResult(sampleBiasData)
      setJobTitle("")
      setJobDescription("")
      setIsAnalyzing(false)
    }, 1500)
  }

  const renderGenderChart = (): JSX.Element | null => {
    if (!analysisResult) return null
    
    const genderData: ChartDataPoint[] = Object.entries(analysisResult.bias_metrics.gender.representation).map(
      ([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })
    )
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Gender Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({name, percent}: {name: string, percent: number}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Finding:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.gender.findings}</p>
            <p className="text-sm font-medium mt-2">Recommendation:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.gender.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAgeChart = (): JSX.Element | null => {
    if (!analysisResult) return null
    
    const names = ['Yaseen', 'Sumeet', 'Ujjwal', 'Mohammed'];
    const ageData: ChartDataPoint[] = Object.entries(analysisResult.bias_metrics.age.representation).map(
      ([name, value], index) => ({ 
      name: names[index % names.length],
      value 
      })
    )
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Age Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              <Legend />
              <Bar dataKey="value" name="Percentage" fill="#FF8042" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Finding:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.age.findings}</p>
            <p className="text-sm font-medium mt-2">Recommendation:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.age.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEthnicityChart = (): JSX.Element | null => {
    if (!analysisResult || !analysisResult.bias_metrics.ethnicity) return null
    
    const names = ['Yaseen', 'Sumeet', 'Ujjwal', 'Mohammed'];
    const ethnicityData: ChartDataPoint[] = Object.entries(analysisResult.bias_metrics.ethnicity.representation).map(
      ([name, value], index) => ({ 
      name: names[index % names.length],
      value 
      })
    )
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Ethnicity Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ethnicityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              <Legend />
              <Bar dataKey="value" name="Percentage" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Finding:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.ethnicity.findings}</p>
            <p className="text-sm font-medium mt-2">Recommendation:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.ethnicity.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEducationChart = (): JSX.Element | null => {
    if (!analysisResult) return null
    
    const names = ['Yaseen', 'Sumeet', 'Ujjwal', 'Mohammed'];
    const educationData: ChartDataPoint[] = Object.entries(analysisResult.bias_metrics.education.representation).map(
      ([name, value], index) => ({ 
      name: names[index % names.length],
      value 
      })
    )
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Education Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={educationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              <Legend />
              <Bar dataKey="value" name="Percentage" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Finding:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.education.findings}</p>
            <p className="text-sm font-medium mt-2">Recommendation:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.education.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderExperienceChart = (): JSX.Element | null => {
    if (!analysisResult) return null
    
    const names = ['Yaseen', 'Sumeer', 'Ujjwal', 'Mohammed'];
    const experienceData: ChartDataPoint[] = Object.entries(analysisResult.bias_metrics.experience.representation).map(
      ([name, value], index) => ({ 
        name: names[index % names.length],
        value 
      })
    )
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Experience Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={experienceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
              <Legend />
              <Bar dataKey="value" name="Percentage" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Finding:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.experience.findings}</p>
            <p className="text-sm font-medium mt-2">Recommendation:</p>
            <p className="text-sm text-gray-600">{analysisResult.bias_metrics.experience.recommendations}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderFairnessScore = (): JSX.Element | null => {
    if (!analysisResult) return null

    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${analysisResult.fairness_score < 3 ? 'text-red-500' : analysisResult.fairness_score < 4 ? 'text-amber-500' : 'text-green-500'}`} />
          <CardTitle className="text-lg">Fairness Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className={`text-4xl font-bold ${analysisResult.fairness_score < 3 ? 'text-red-500' : analysisResult.fairness_score < 4 ? 'text-amber-500' : 'text-green-500'}`}>
              {analysisResult.fairness_score.toFixed(1)}/5.0
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className={`h-2.5 rounded-full ${analysisResult.fairness_score < 3 ? 'bg-red-500' : analysisResult.fairness_score < 4 ? 'bg-amber-500' : 'bg-green-500'}`} 
                style={{ width: `${(analysisResult.fairness_score / 5) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {analysisResult.fairness_score < 3 
                ? "High risk of bias detected in your candidate selection process. Immediate action recommended."
                : analysisResult.fairness_score < 4 
                ? "Moderate risk of bias detected. Consider addressing the recommendations provided."
                : "Low risk of bias detected. Continue monitoring and implementing best practices."}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderOverallSummary = (): JSX.Element | null => {
    if (!analysisResult) return null

    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>Overall assessment of potential biases in your candidate selection</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{analysisResult.summary}</p>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Key Recommendations:</h3>
            <ul className="list-disc pl-6 space-y-2">
              {analysisResult.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-700">{rec}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hiring Bias Analysis</h1>
        <p className="text-gray-600 mt-2">Analyze potential biases in your candidate selection process</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Job Information</CardTitle>
          <CardDescription>Enter details about the position you're hiring for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                  id="jobTitle" 
                  placeholder="e.g. Senior Frontend Developer" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jobDescription">Job Description</Label>
                <Textarea 
                  id="jobDescription" 
                  placeholder="Paste your job description here..."
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="w-full md:w-auto"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze Potential Bias"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysisResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {renderFairnessScore()}
            {renderGenderChart()}
            {renderAgeChart()}
            {renderEthnicityChart()}
            {renderEducationChart()}
            {renderExperienceChart()}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderOverallSummary()}
          </div>
        </>
      )}
    </div>
  )
}