export interface Candidate {
    id: string;
    name: string;
    match: number;
    years: number;
    location: string;
    education: string;
    skills: string[];
    highlights: string[];
    saved?: boolean;
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
  