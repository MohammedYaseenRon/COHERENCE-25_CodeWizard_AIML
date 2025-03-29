import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from 'recharts';
import { 
  Code, 
  GraduationCap, 
  Briefcase, 
  Award, 
  BookOpen, 
  Star 
} from 'lucide-react';

// TypeScript Interfaces for Resume Data
interface ContactInfo {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string | null;
}

interface Education {
  degree: string;
  institution: string;
  graduation_year: number;
  gpa?: number | null;
  honors?: string[] | null;
}

interface WorkExperience {
  company: string;
  job_title: string;
  start_date: string;
  end_date?: string | null;
  responsibilities: string[];
  technologies?: string[] | null;
}

interface Skills {
  technical_skills: string[];
  soft_skills?: string[] | null;
  certifications?: string[] | null;
}

interface Project {
  name: string;
  description: string;
  technologies?: string[];
  start_date?: string | null;
  end_date?: string | null;
  link?: string | null;
}

interface ResumeData {
  contact_info: ContactInfo;
  education: Education[];
  work_experience: WorkExperience[];
  skills: Skills;
  summary?: string;
  projects?: Project[];
}

interface AnalysisResults {
  [filename: string]: ResumeData;
}

interface ChartData {
  name: string;
  value: number;
  degree?: string;
  institution?: string;
  technologies?: number;
  complexity?: number;
  source?: string; // Added to track which resume the data came from
}

interface ResumeAnalysisChartsProps {
  analysisResults: AnalysisResults;
}

const ResumeAnalysisCharts: React.FC<ResumeAnalysisChartsProps> = ({ analysisResults }) => {
  // Extract data from all resumes in results
  const resumeKeys = useMemo(() => Object.keys(analysisResults), [analysisResults]);
  
  // Skills Data Preparation - combine skills from all resumes
  const skillsData: ChartData[] = useMemo(() => {
    // Collect all skills from all resumes with their frequency
    const skillsMap = new Map<string, { count: number, sources: Set<string> }>();
    
    resumeKeys.forEach(key => {
      const resume = analysisResults[key];
      resume.skills.technical_skills.forEach(skill => {
        if (!skillsMap.has(skill)) {
          skillsMap.set(skill, { count: 0, sources: new Set() });
        }
        const skillData = skillsMap.get(skill)!;
        skillData.count++;
        skillData.sources.add(key);
      });
    });
    
    // Convert map to array and sort by frequency
    return Array.from(skillsMap.entries())
      .map(([skill, data]) => ({
        name: skill,
        value: data.count,
        source: Array.from(data.sources).join(', ')
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 skills
  }, [resumeKeys, analysisResults]);

  // Education Data Preparation - combine education from all resumes
  const educationData: ChartData[] = useMemo(() => {
    const educationEntries: ChartData[] = [];
    
    resumeKeys.forEach(key => {
      const resume = analysisResults[key];
      resume.education.forEach(edu => {
        educationEntries.push({
          name: edu.institution,
          value: edu.graduation_year,
          degree: edu.degree,
          institution: edu.institution,
          source: key
        });
      });
    });
    
    return educationEntries;
  }, [resumeKeys, analysisResults]);

  // Projects Data Preparation - combine projects from all resumes
  const projectsData: ChartData[] = useMemo(() => {
    const projectEntries: ChartData[] = [];
    
    resumeKeys.forEach(key => {
      const resume = analysisResults[key];
      (resume.projects || []).forEach(project => {
        projectEntries.push({
          name: project.name,
          value: project.technologies?.length || 0,
          technologies: project.technologies?.length || 0,
          complexity: Math.floor(Math.random() * 10) + 1,
          source: key
        });
      });
    });
    
    return projectEntries;
  }, [resumeKeys, analysisResults]);

  // Work Experience Data - combine work experience from all resumes
  const workExperienceData: ChartData[] = useMemo(() => {
    const workEntries: ChartData[] = [];
    
    resumeKeys.forEach(key => {
      const resume = analysisResults[key];
      resume.work_experience.forEach(work => {
        // Parse dates to get duration
        const startDate = new Date(work.start_date);
        const endDate = work.end_date ? new Date(work.end_date) : new Date();
        const durationMonths = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + 
                               (endDate.getMonth() - startDate.getMonth());
        
        workEntries.push({
          name: `${work.job_title} at ${work.company}`,
          value: durationMonths,
          source: key
        });
      });
    });
    
    return workEntries.sort((a, b) => b.value - a.value);
  }, [resumeKeys, analysisResults]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-[#1b2537] rounded-lg">
      {/* Resume Count */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-white mb-2">Total Resumes Analyzed</h3>
        <div className="text-5xl font-bold text-blue-400">{resumeKeys.length}</div>
      </div>
      
      {/* Skills Breakdown */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Code className="mr-2 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Top Technical Skills</h3>
        </div>
        <BarChart width={300} height={250} data={skillsData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value, name, props) => [value, `Found in: ${props.payload.source}`]} />
          <Bar dataKey="value" fill="#8884d8">
            {skillsData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </div>

      {/* Education Overview */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <GraduationCap className="mr-2 text-green-400" />
          <h3 className="text-xl font-semibold text-white">Education</h3>
        </div>
        <PieChart width={300} height={250}>
          <Pie
            data={educationData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {educationData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => [
              value, 
              `${props.payload.degree} from ${props.payload.institution} (${props.payload.source})`
            ]}
          />
          <Legend />
        </PieChart>
      </div>

      {/* Projects Analysis */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Briefcase className="mr-2 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Project Tech Stack</h3>
        </div>
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          width={300} 
          height={250} 
          data={projectsData.slice(0, 8)} // Limit to 8 projects for readability
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar 
            dataKey="technologies" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.6} 
          />
          <Tooltip formatter={(value, name, props) => [value, `${props.payload.source}`]} />
        </RadarChart>
      </div>

      {/* Work Experience Timeline */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Award className="mr-2 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Experience Duration (Months)</h3>
        </div>
        <BarChart width={300} height={250} data={workExperienceData.slice(0, 5)}> {/* Top 5 experiences */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value, name, props) => [value, `${props.payload.source}`]} />
          <Bar dataKey="value" fill="#82ca9d" />
        </BarChart>
      </div>

      {/* Project Complexity */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <BookOpen className="mr-2 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Project Complexity</h3>
        </div>
        <LineChart width={300} height={250} data={projectsData.slice(0, 6)}> {/* Top 6 projects */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value, name, props) => [value, `${props.payload.source}`]} />
          <Line type="monotone" dataKey="complexity" stroke="#82ca9d" />
        </LineChart>
      </div>

      {/* Detailed Resume Summary */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg col-span-full">
        <div className="flex items-center mb-4">
          <BookOpen className="mr-2 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Aggregated Resume Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div>
            <div className="flex items-center">
              <Star className="mr-2 text-blue-400" />
              <h4 className="font-semibold">Top Technical Skills</h4>
            </div>
            <p className="text-sm text-gray-300">
              {skillsData.slice(0, 5).map(skill => `${skill.name} (${skill.value})`).join(', ')}
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <GraduationCap className="mr-2 text-green-400" />
              <h4 className="font-semibold">Education Institutions</h4>
            </div>
            <p className="text-sm text-gray-300">
              {[...new Set(educationData.map(edu => edu.institution))].join(', ')}
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <Briefcase className="mr-2 text-purple-400" />
              <h4 className="font-semibold">Analyzed Resumes</h4>
            </div>
            <p className="text-sm text-gray-300">
              {resumeKeys.join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisCharts;