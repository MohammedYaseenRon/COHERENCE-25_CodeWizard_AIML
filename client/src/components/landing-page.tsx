"use client";

import type React from "react";
import { ReactNode } from "react";

import { useState} from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import {
  Upload,
  BarChart2,
  CheckCircle,
  Award,
  FileText,
  Cpu,
  List,
  File,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Navbar from "./layout/Navbar";

type InViewProps = {
  children: ReactNode;
  delay?: number;
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
  rating: number;
};

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-48 h-48">
        
        <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-purple-500 rounded-full animate-spin"></div>

        
        <div className="absolute inset-0 flex items-center justify-center">
          <File className="text-purple-500 animate-pulse" size={64} />
        </div>

        
        <div className="absolute bottom-0 left-0 right-0 text-center mt-4">
          <span className="text-white text-lg animate-typing overflow-hidden whitespace-nowrap border-r-4 border-r-white pr-1">
            Signing In...
          </span>
        </div>
      </div>
    </div>
  );
};

const testimonials: Testimonial[] = [
  {
    name: "Alex Johnson",
    role: "Software Engineer",
    quote:
      "ATS Rankify helped me understand why my resume wasn't getting past the screening process. After making the suggested changes, I started getting interviews right away!",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Tech Recruiter",
    quote:
      "As a recruiter, I recommend this tool to all my candidates. It helps them optimize their resumes to match our ATS requirements and saves everyone time.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Marketing Specialist",
    quote:
      "The ranking feature allowed me to see how my resume stacked up against others for the same position. The insights were invaluable for my job search.",
    rating: 4,
  },
];

const features: Feature[] = [
  {
    icon: FileText,
    title: "ATS Compatibility Check",
    description:
      "Instantly analyze your resume against Applicant Tracking Systems to ensure it passes automated screenings.",
  },
  {
    icon: BarChart2,
    title: "Resume Ranking",
    description:
      "Compare multiple resumes against job descriptions to determine the best match based on skills and experience.",
  },
  {
    icon: CheckCircle,
    title: "Keyword Optimization",
    description:
      "Identify and suggest missing keywords from job descriptions to improve your resume's relevance score.",
  },
  {
    icon: Award,
    title: "Skills Gap Analysis",
    description:
      "Discover skill gaps between your experience and job requirements with actionable recommendations.",
  },
];

const workSteps: Feature[] = [
  {
    icon: Upload,
    title: "Upload Your Resume",
    description: "Submit your resume in PDF, DOCX, or other common formats.",
  },
  {
    icon: Cpu,
    title: "AI Analysis",
    description:
      "Our AI engine scans your resume and compares it with job descriptions.",
  },
  {
    icon: List,
    title: "Get Detailed Reports",
    description:
      "Receive a comprehensive analysis of your resume's performance against ATS.",
  },
  {
    icon: Trophy,
    title: "Optimize & Improve",
    description:
      "Follow tailored recommendations to enhance your resume's ranking.",
  },
];

const RenderStarRating = ({ rating }: { rating: number }) => (
  <div className="flex text-yellow-500">
    {[...Array(5)].map((_, i) => (
      <span
        key={i}
        className={i < rating ? "text-yellow-500" : "text-gray-300"}
      >
        ★
      </span>
    ))}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
};

const InView: React.FC<InViewProps> = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 50, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignIn = () => {
      setIsLoading(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    };

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Head>
        <title>ATS Rankify - Optimize Your Resume</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      
      <motion.header
        className="container mx-auto px-4 pt-32 pb-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-4"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Optimize Your Resume for ATS Success
        </motion.h1>
        <motion.p
          className="text-xl mb-8 max-w-2xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Let AI analyze and rank your resume based on job descriptions, skills,
          and experience requirements to maximize your chances of getting
          noticed.
        </motion.p>
        <motion.div
          className="space-x-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.button
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            Get Started
          </motion.button>
          <motion.button
            className="border border-white hover:bg-white hover:text-black text-white font-bold py-3 px-6 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            How It Works
          </motion.button>
        </motion.div>
      </motion.header>

      
      <InView>
        <section className="container mx-auto px-4 py-16">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Powerful Resume Analysis Tools
          </motion.h2>
          <motion.div
            className="grid md:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-900 p-6 rounded-lg text-center"
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.5)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <feature.icon
                  className="mx-auto mb-4 text-purple-500"
                  size={48}
                />
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </InView>

      
      <InView>
        <section className="container mx-auto px-4 py-16">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-center mb-12 text-xl max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Our streamlined process helps you optimize your resume in minutes,
            not hours
          </motion.p>
          <motion.div
            className="grid md:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {workSteps.map((step, index) => (
              <motion.div
                key={index}
                className="relative group"
                variants={itemVariants}
              >
                <div
                  className="bg-gray-900 p-6 rounded-lg text-center transition-all duration-300 
            group-hover:scale-105 group-hover:bg-purple-900/20 group-hover:border group-hover:border-purple-500"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: 180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: index * 0.2,
                    }}
                  >
                    <step.icon
                      className="mx-auto mb-4 text-purple-500 transition-transform duration-300 
                group-hover:scale-110 group-hover:text-purple-400"
                      size={48}
                    />
                  </motion.div>
                  <h3 className="font-bold mb-2 text-white group-hover:text-purple-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-gray-200 transition-colors">
                    {step.description}
                  </p>
                </div>
                {index < workSteps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/2 left-full transform -translate-y-1/2 -translate-x-1/2 
            w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent 
            opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out"
                  ></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </section>
      </InView>

      
      <InView>
        <section className="container mx-auto px-4 py-16">
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-gray-900 p-6 rounded-lg"
                variants={itemVariants}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.3)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <RenderStarRating rating={testimonial.rating} />
                <p className="my-4 italic">&quote;{testimonial.quote}&quote;</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-gray-400">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </InView>

      
      <InView>
        <section className="container mx-auto px-4 py-16 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Ready to Boost Your Job Application Success?
          </motion.h2>
          <motion.p
            className="text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Join thousands of job seekers who have improved their resume ranking
            and landed their dream jobs.
          </motion.p>
          <motion.div
            className="space-x-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.button
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={handleSignIn}
            >
              Get Started for Free
            </motion.button>
            <motion.button
              className="border border-white hover:bg-white hover:text-black text-white font-bold py-3 px-6 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              View Pricing Plans
            </motion.button>
          </motion.div>
        </section>
      </InView>

      
      <footer className="container mx-auto px-4 py-12 border-t border-gray-800">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">ATS Rankify</h3>
            <p className="text-gray-400">
              AI-powered resume optimization for the modern job seeker.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="text-gray-400 space-y-2">
              <li>Features</li>
              <li>Pricing</li>
              <li>Integrations</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="text-gray-400 space-y-2">
              <li>Blog</li>
              <li>Resume Templates</li>
              <li>Career Tips</li>
              <li>Help Center</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="text-gray-400 space-y-2">
              <li>About</li>
              <li>Careers</li>
              <li>Contact</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-8 text-gray-500">
          © 2025 ATS Rankify. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;