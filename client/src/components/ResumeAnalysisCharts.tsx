import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { 
  Code, 
  GraduationCap, 
  Briefcase, 
  Award, 
  BookOpen, 
  Star 
} from 'lucide-react';

// Define Chart Data Interface based on your API response
interface ChartData {
  summary_stats: {
    total_resumes: number;
    total_skills: number;
    total_projects: number;
  };
  skills_data: {
    top_skills: { name: string; count: number }[];
    skill_distribution: { name: string; value: number }[];
  };
  experience_data: { name: string; value: number }[];
  education_data: { name: string; count: number }[];
  technology_data: {
    top_technologies: { name: string; count: number }[];
    technology_distribution: { name: string; value: number }[];
  };
  resume_comparison: {
    name: string;
    skills_count: number;
    projects_count: number;
    experience_count: number;
    education: { degree: string; institution: string; year: number }[];
    experience_level: string;
  }[];
}

const ResumeAnalysisCharts: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://globalhive.xyz/generate-chart-data');
        
        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }
        
        const data = await response.json();
        setChartData(data.chart_data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Memoized data preparations
  const skillsData = useMemo(() => 
    chartData?.skills_data.top_skills || [], 
    [chartData]
  );

  const experienceData = useMemo(() => 
    chartData?.experience_data || [], 
    [chartData]
  );

  const educationData = useMemo(() => 
    chartData?.education_data.map(edu => ({
      name: edu.name,
      value: edu.count
    })) || [], 
    [chartData]
  );

  const technologyData = useMemo(() => 
    chartData?.technology_data.top_technologies || [], 
    [chartData]
  );

  const resumeCount = useMemo(() => 
    chartData?.summary_stats.total_resumes || 0, 
    [chartData]
  );

  if (loading) {
    return <div className="text-white p-6">Loading charts...</div>;
  }

  if (error || !chartData) {
    return <div className="text-red-400 p-6">Error: {error || 'No data available'}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 p-6 bg-[#1b2537] rounded-lg">
      {/* Resume Count */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg flex flex-col justify-center items-center">
        <h3 className="text-xl font-semibold text-white mb-2">Total Resumes Analyzed</h3>
        <div className="text-5xl font-bold text-blue-400">{resumeCount}</div>
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
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8">
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
          <h3 className="text-xl font-semibold text-white">Education Levels</h3>
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
          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* Technology Analysis */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Briefcase className="mr-2 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Top Technologies</h3>
        </div>
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          width={300} 
          height={250} 
          data={technologyData}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar 
            dataKey="count" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.6} 
          />
          <Tooltip />
        </RadarChart>
      </div>

      {/* Experience Distribution */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg">
        <div className="flex items-center mb-4">
          <Award className="mr-2 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Experience Levels</h3>
        </div>
        <BarChart width={300} height={250} data={experienceData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#82ca9d" />
        </BarChart>
      </div>

      {/* Summary Stats */}
      <div className="bg-[#2c3646] rounded-lg p-4 shadow-lg col-span-full">
        <div className="flex items-center mb-4">
          <BookOpen className="mr-2 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Analysis Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
          <div>
            <div className="flex items-center">
              <Star className="mr-2 text-blue-400" />
              <h4 className="font-semibold">Top Skills</h4>
            </div>
            <p className="text-sm text-gray-300">
              {skillsData.slice(0, 5).map(skill => `${skill.name} (${skill.count})`).join(', ')}
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <GraduationCap className="mr-2 text-green-400" />
              <h4 className="font-semibold">Top Degrees</h4>
            </div>
            <p className="text-sm text-gray-300">
              {educationData.slice(0, 3).map(edu => `${edu.name} (${edu.value})`).join(', ')}
            </p>
          </div>
          <div>
            <div className="flex items-center">
              <Briefcase className="mr-2 text-purple-400" />
              <h4 className="font-semibold">Top Technologies</h4>
            </div>
            <p className="text-sm text-gray-300">
              {technologyData.slice(0, 3).map(tech => `${tech.name} (${tech.count})`).join(', ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalysisCharts;