// @/types/index.ts
// @/types/index.ts (assumed)
export interface Candidate {
  id: string;
  name: string;
  years: number;
  location: string;
  education: string;
  skills: string[];
  highlights: string[];
  match: number;
  saved: boolean;
  email: string;      // Missing
  experience: any;    // Missing (type unclear, could be number, string, etc.)
  matchScore: number; // Missing (possibly same as match?)
} 

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  datePosted: string;
}

export interface FilterOptions {
  skills: string[];
  experience: string[];
  education: string[];
}

export interface ContactInfo {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

export interface Education {
  degree: string;
  institution: string;
  graduation_year: number;
  gpa?: number;
  honors?: string[];
}

export interface WorkExperience {
  company: string;
  job_title: string;
  start_date: string;
  end_date?: string;
  responsibilities: string[];
  technologies?: string[];
}

export interface Skills {
  technical_skills: string[];
  soft_skills?: string[];
  certifications?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  start_date?: string;
  end_date?: string;
  link?: string;
}

export interface ResumeProfile {
  contact_info: ContactInfo;
  education: Education[];
  work_experience: WorkExperience[];
  skills: Skills;
  summary?: string;
  projects?: Project[];
}

// export interface Candidate {
//   id: string;
//   name: string;
//   email: string;
//   skills: string[];
//   experience: string;
//   education: string;
//   saved: boolean;
//   matchScore: number;
// }

export interface FilterOptions {
  skills: string[];
  experience: string[];
  education: string[];
}
